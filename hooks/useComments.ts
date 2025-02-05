import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useUser } from './useUser';
import Toast from 'react-native-toast-message';

interface Comment {
  id: string;
  text: string;
  videoId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
  };
}

interface DatabaseComment {
  id: string;
  text: string;
  video_id: string;
  user_id: string;
  created_at: string;
  user: {
    id: string;
    username: string | null;
  };
}

function mapDatabaseCommentToComment(dbComment: DatabaseComment): Comment {
  return {
    id: dbComment.id,
    text: dbComment.text,
    videoId: dbComment.video_id,
    userId: dbComment.user_id,
    createdAt: dbComment.created_at,
    user: dbComment.user
  };
}

export function useComments(videoId: string) {
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Fetch comments for a video
  const { 
    data: comments, 
    isLoading,
    error: fetchError,
    refetch 
  } = useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            user:User (
              id,
              username
            )
          `)
          .eq('video_id', videoId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        return (data as unknown as DatabaseComment[]).map(mapDatabaseCommentToComment);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        throw new Error('Failed to load comments. Please try again.');
      }
    },
    staleTime: 1000 * 60,
    retry: 1,
    retryDelay: 1000
  });

  // Add a new comment
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Must be logged in to comment');
      if (!text.trim()) throw new Error('Comment cannot be empty');

      try {
        const { data: comment, error: commentError } = await supabase
          .from('comments')
          .insert({
            text: text.trim(),
            video_id: videoId,
            user_id: user.id
          })
          .select(`
            *,
            user:User (
              id,
              username
            )
          `)
          .single();

        if (commentError) throw commentError;
        if (!comment) throw new Error('Failed to create comment');

        // Increment the comments count in the background
        supabase.rpc('increment_comments_count', {
          video_id: videoId
        }).then(({ error }) => {
          if (error) {
            console.error('Failed to increment comments count:', error);
          }
        });

        return mapDatabaseCommentToComment(comment as unknown as DatabaseComment);
      } catch (error) {
        console.error('Failed to add comment:', error);
        throw new Error('Failed to add comment. Please try again.');
      }
    },
    onMutate: async (newCommentText) => {
      if (!user) return;
      
      await queryClient.cancelQueries({ queryKey: ['comments', videoId] });
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', videoId]) || [];

      const optimisticComment: Comment = {
        id: `-${Date.now()}`,
        text: newCommentText,
        videoId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username || 'User'
        }
      };

      queryClient.setQueryData(['comments', videoId], [optimisticComment, ...previousComments]);

      return { previousComments };
    },
    onError: (err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', videoId], context.previousComments);
      }
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Failed to add comment',
        position: 'bottom'
      });
    },
    onSuccess: (newComment) => {
      Toast.show({
        type: 'success',
        text1: 'Comment added successfully',
        position: 'bottom'
      });
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  const addComment = useCallback(async (text: string) => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'You must be logged in to comment',
        position: 'bottom'
      });
      return;
    }
    await addCommentMutation.mutateAsync(text);
  }, [addCommentMutation, user]);

  return {
    comments: comments || [],
    isLoading,
    isAddingComment: addCommentMutation.isPending,
    error: fetchError,
    addComment,
    refetch
  };
} 
