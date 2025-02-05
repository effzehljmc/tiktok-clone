import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useUser } from './useUser';
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
  const queryClient = useQueryClient();

  // Subscribe to real-time updates
  useEffect(() => {
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
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikeCount(prev => prev + 1);
            if (payload.new.user_id === user?.id) {
              setIsLiked(true);
            }
          } else if (payload.eventType === 'DELETE') {
            setLikeCount(prev => Math.max(0, prev - 1));
            if (payload.old.user_id === user?.id) {
              setIsLiked(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, user?.id]);

  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (shouldLike) {
        const { error } = await supabase
          .from('likes')
          .insert([{ 
            id: uuidv4(),
            video_id: videoId, 
            user_id: user.id 
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ video_id: videoId, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async (shouldLike) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['videos'] });

      // Snapshot the previous value
      const previousLiked = isLiked;
      const previousCount = likeCount;

      // Optimistically update
      setIsLiked(shouldLike);
      setLikeCount(prev => prev + (shouldLike ? 1 : -1));

      // Return context with the snapshotted value
      return { previousLiked, previousCount };
    },
    onError: (err, _, context) => {
      // Revert the optimistic update on error
      if (context) {
        setIsLiked(context.previousLiked);
        setLikeCount(context.previousCount);
      }
      console.error('Error toggling like:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
  });

  const toggleLike = useCallback(async () => {
    if (!user) return;
    
    // Optimistically update UI immediately
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => prev + (newIsLiked ? 1 : -1));
    
    // Then trigger the mutation
    likeMutation.mutate(newIsLiked);
  }, [user, isLiked, likeMutation]);

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading: likeMutation.isPending
  };
} 