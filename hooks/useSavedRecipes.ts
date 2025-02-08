import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { SavedRecipe } from '../types/saved-recipe';

export function useSavedRecipes(userId: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['savedRecipes', userId],
    queryFn: async () => {
      console.log('Fetching saved recipes for user:', userId);
      
      // Check session state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const { data, error } = await supabase
        .from('saved_recipes')
        .select(`
          id,
          user_id,
          video_id,
          saved_at,
          video:videos (
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            duration,
            views_count,
            likes_count,
            comments_count,
            status,
            is_private,
            creator:creator_id (
              id,
              username,
              image
            ),
            recipe_metadata (
              cooking_time,
              difficulty,
              cuisine,
              servings,
              calories,
              equipment,
              dietary_tags,
              ingredients,
              steps
            )
          )
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching saved recipes:', error);
        throw error;
      }
      
      // Transform the data to match our expected types
      const transformedData = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        videoId: item.video_id,
        savedAt: new Date(item.saved_at),
        video: item.video ? {
          id: item.video.id,
          title: item.video.title,
          description: item.video.description,
          url: item.video.video_url,
          thumbnailUrl: item.video.thumbnail_url,
          duration: item.video.duration,
          viewsCount: item.video.views_count,
          likesCount: item.video.likes_count,
          commentsCount: item.video.comments_count,
          status: item.video.status,
          isPrivate: item.video.is_private,
          creator: item.video.creator ? {
            id: item.video.creator.id,
            username: item.video.creator.username,
            avatarUrl: item.video.creator.image
          } : null,
          recipeMetadata: item.video.recipe_metadata ? {
            cookingTime: item.video.recipe_metadata.cooking_time,
            difficulty: item.video.recipe_metadata.difficulty,
            cuisine: item.video.recipe_metadata.cuisine,
            servings: item.video.recipe_metadata.servings,
            calories: item.video.recipe_metadata.calories,
            equipment: item.video.recipe_metadata.equipment,
            dietaryTags: item.video.recipe_metadata.dietary_tags,
            ingredients: item.video.recipe_metadata.ingredients,
            steps: item.video.recipe_metadata.steps
          } : null
        } : null
      }));
      
      console.log('Fetched saved recipes:', transformedData);
      return transformedData as SavedRecipe[];
    },
    enabled: !!userId, // Only run if user is logged in
  });

  const saveMutation = useMutation({
    mutationFn: async (videoId: string) => {
      console.log('Saving recipe:', videoId, 'for user:', userId);
      
      // Check session state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const { error } = await supabase
        .from('saved_recipes')
        .insert({ user_id: userId, video_id: videoId });
        
      if (error) {
        console.error('Error saving recipe:', error);
        throw error;
      }
    },
    onMutate: async (videoId) => {
      // Optimistic update
      const previousData = queryClient.getQueryData(['savedRecipes', userId]);
      
      queryClient.setQueryData(['savedRecipes', userId], (old: SavedRecipe[] = []) => [
        { id: 'temp', userId, videoId, savedAt: new Date() },
        ...old,
      ]);

      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error('Error in save mutation:', err);
      // Rollback on error
      queryClient.setQueryData(['savedRecipes', userId], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', userId] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (videoId: string) => {
      console.log('Unsaving recipe:', videoId, 'for user:', userId);
      
      // Check session state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .match({ user_id: userId, video_id: videoId });
        
      if (error) {
        console.error('Error unsaving recipe:', error);
        throw error;
      }
    },
    onMutate: async (videoId) => {
      // Optimistic update
      const previousData = queryClient.getQueryData(['savedRecipes', userId]);
      
      queryClient.setQueryData(['savedRecipes', userId], (old: SavedRecipe[] = []) => 
        old.filter(recipe => recipe.videoId !== videoId)
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error('Error in unsave mutation:', err);
      // Rollback on error
      queryClient.setQueryData(['savedRecipes', userId], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', userId] });
    },
  });

  return {
    savedRecipes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveRecipe: saveMutation.mutate,
    unsaveRecipe: unsaveMutation.mutate,
    isSaving: saveMutation.isPending || unsaveMutation.isPending,
  };
} 
