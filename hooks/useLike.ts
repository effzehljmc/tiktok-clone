import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useUser } from './useUser';
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from 'react-native-toast-message';

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
        // First check if the like already exists
        const { data: existingLike } = await supabase
          .from('likes')
          .select('id')
          .match({ video_id: videoId, user_id: user.id })
          .single();

        // If like exists and we're trying to like, just return silently
        if (existingLike) {
          return;
        }

        const { error } = await supabase
          .from('likes')
          .insert([{ 
            id: uuidv4(),
            video_id: videoId, 
            user_id: user.id 
          }]);

        if (error) {
          // If it's a duplicate key error (409 Conflict), ignore it
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            return;
          }
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ video_id: videoId, user_id: user.id });
        
        if (error) {
          // If record not found, ignore the error
          if (error.code === 'PGRST116') {
            return;
          }
          throw error;
        }
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
    onError: (err, shouldLike, context) => {
      // Revert the optimistic update on error
      if (context) {
        setIsLiked(context.previousLiked);
        setLikeCount(context.previousCount);
      }

      // Show user-friendly error message
      Toast.show({
        type: 'error',
        text1: shouldLike ? 'Failed to like video' : 'Failed to unlike video',
        text2: 'Please try again later',
        position: 'bottom',
      });

      console.error('Error toggling like:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
  });

  const toggleLike = useCallback(async () => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Sign in required',
        text2: 'Please sign in to like videos',
        position: 'bottom',
      });
      return;
    }
    
    // Then trigger the mutation
    likeMutation.mutate(!isLiked);
  }, [user, isLiked, likeMutation]);

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading: likeMutation.isPending
  };
} 