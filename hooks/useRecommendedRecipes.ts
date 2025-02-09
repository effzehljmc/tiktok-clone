import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { RecommendedVideo } from '@/types/recommendation';

interface UseRecommendedRecipesOptions {
  enabled?: boolean;
  limit?: number;
}

interface PageParam {
  score: number;
  id: string;
}

export function useRecommendedRecipes({ 
  enabled = true, 
  limit = 10 
}: UseRecommendedRecipesOptions = {}) {
  const { user } = useAuth();

  return useInfiniteQuery<RecommendedVideo[], Error, InfiniteData<RecommendedVideo[]>>({
    queryKey: ['recommendedRecipes', user?.id],
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to get recommendations');
      }

      console.log('Fetching recommendations with params:', {
        user_id: user.id,
        limit,
        cursor_score: (pageParam as PageParam)?.score,
        cursor_video_id: (pageParam as PageParam)?.id
      });

      const { data, error } = await supabase.rpc(
        'get_preference_based_recommendations',
        {
          p_user_id: user.id,
          p_limit: limit,
          p_cursor_score: (pageParam as PageParam)?.score,
          p_cursor_video_id: (pageParam as PageParam)?.id
        }
      );

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }

      console.log('Successfully fetched recommendations:', data);
      return data as RecommendedVideo[];
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < limit) {
        console.log('No more pages available');
        return undefined;
      }
      const lastItem = lastPage[lastPage.length - 1];
      const nextPageParam = {
        score: lastItem.total_score,
        id: lastItem.id
      } as PageParam;
      console.log('Next page param:', nextPageParam);
      return nextPageParam;
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
} 