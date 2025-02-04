import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useUser } from './useUser';

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
  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          text,
          video_id,
          user_id,
          created_at,
          user:users (
            id,
            username
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return (data as unknown as DatabaseComment[]).map(mapDatabaseCommentToComment);
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  });

  // Add a new comment
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Must be logged in to comment');

      // First insert the comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert([
          {
            text,
            video_id: videoId,
            user_id: user.id
          }
        ])
        .select(`
          id,
          text,
          video_id,
          user_id,
          created_at,
          user:users (
            id,
            username
          )
        `)
        .single();

      if (commentError) throw commentError;
      if (!comment) throw new Error('Failed to create comment');

      // Then increment the comments count
      const { error: updateError } = await supabase.rpc('increment_comments_count', {
        video_id: videoId
      });

      if (updateError) throw updateError;

      return mapDatabaseCommentToComment(comment as unknown as DatabaseComment);
    },
    onSuccess: () => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
      // Invalidate videos query to update comments count
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  const addComment = useCallback(async (text: string) => {
    await addCommentMutation.mutateAsync(text);
  }, [addCommentMutation]);

  return {
    comments,
    isLoading,
    addComment,
    isAddingComment: addCommentMutation.isPending
  };
} 
