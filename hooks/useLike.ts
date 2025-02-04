import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useUser } from './useUser';
import { RealtimeChannel } from '@supabase/supabase-js';
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UseLikeProps {
  videoId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}

export function useLike({ videoId, initialLikeCount, initialIsLiked }: UseLikeProps) {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current like count
  const fetchLikeCount = async () => {
    const { data } = await supabase
      .from('videos')
      .select('likes_count')
      .eq('id', videoId)
      .single();
    
    if (data) {
      setLikeCount(data.likes_count);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    // Get initial count
    fetchLikeCount();

    const channel = supabase
      .channel(`likes:${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `video_id=eq.${videoId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['videos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, queryClient]);

  const toggleLike = useCallback(async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    const wasLiked = isLiked;
    
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikeCount(prev => prev + (wasLiked ? -1 : 1));
    
    try {
      if (!wasLiked) {
        // First check if the like already exists
        const { data: existingLike } = await supabase
          .from('likes')
          .select('id')
          .match({ video_id: videoId, user_id: user.id })
          .single();

        if (existingLike) {
          // Like already exists, we're already in the correct state
          return;
        }

        // Try to insert the like
        const { error } = await supabase
          .from('likes')
          .insert([{ 
            id: uuidv4(),
            video_id: videoId, 
            user_id: user.id 
          }]);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['videos'] });
      } else {
        // Try to remove the like
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ video_id: videoId, user_id: user.id });
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['videos'] });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setLikeCount(prev => prev + (wasLiked ? 1 : -1));
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, isLoading, user, videoId, queryClient]);

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading
  };
} 