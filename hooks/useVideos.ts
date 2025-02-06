import { supabase } from '@/utils/supabase';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';
import { VideoCategory } from '@prisma/client';

export interface Video {
  id: string;
  url: string;
  title: string;
  caption?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  likesCount: number;
  isLikedByCurrentUser: boolean;
  commentsCount: number;
  viewsCount: number;
  isPrivate: boolean;
  status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  recipeMetadata?: {
    cookingTime: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    servings: number;
    calories?: number;
    dietaryTags: string[];
    ingredients: string[];
    steps: { timestamp: number; description: string }[];
    equipment: string[];
    cuisine: string;
  };
}

interface UseVideosOptions {
  category?: VideoCategory;
  categories?: VideoCategory[];
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  dietaryTag?: string;
}

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  is_private: boolean;
  creator_id: string;
  category: VideoCategory | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    username: string;
    image: string | null;
  };
  likes: {
    id: string;
    user_id: string;
  }[];
  recipe_metadata?: {
    cooking_time: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    servings: number;
    calories: number | null;
    dietary_tags: string[];
    ingredients: string[];
    steps: { timestamp: number; description: string }[];
    equipment: string[];
    cuisine: string;
  };
}

export function useVideos(options?: UseVideosOptions) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['videos', options?.category, options?.categories, options?.difficulty, options?.dietaryTag] as const,
    queryFn: async () => {
      let query = supabase
        .from('videos')
        .select(`
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
          creator_id,
          category,
          tags,
          created_at,
          updated_at,
          creator:User (
            id,
            username,
            image
          ),
          likes (
            id,
            user_id
          ),
          recipe_metadata (
            cooking_time,
            difficulty,
            servings,
            calories,
            dietary_tags,
            ingredients,
            steps,
            equipment,
            cuisine
          )
        `)
        .eq('status', 'PUBLISHED')
        .eq('is_private', false);

      if (options?.categories) {
        query = query.in('category', options.categories);
      } else if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.difficulty) {
        query = query.eq('recipe_metadata.difficulty', options.difficulty);
      }

      if (options?.dietaryTag) {
        query = query.contains('recipe_metadata.dietary_tags', [options.dietaryTag]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching videos:', error);
        return [];
      }

      const typedData = (data as unknown) as VideoData[];
      
      return typedData.map(video => ({
        id: video.id,
        url: video.video_url,
        title: video.title,
        caption: video.description,
        thumbnailUrl: video.thumbnail_url,
        createdAt: video.created_at,
        creator: {
          id: video.creator.id,
          username: video.creator.username,
          avatarUrl: video.creator.image,
        },
        likesCount: video.likes_count,
        isLikedByCurrentUser: video.likes.some(like => like.user_id === user?.id),
        commentsCount: video.comments_count,
        viewsCount: video.views_count,
        isPrivate: video.is_private,
        status: video.status,
        recipeMetadata: video.recipe_metadata ? {
          cookingTime: video.recipe_metadata.cooking_time,
          difficulty: video.recipe_metadata.difficulty,
          servings: video.recipe_metadata.servings,
          calories: video.recipe_metadata.calories ?? undefined,
          dietaryTags: video.recipe_metadata.dietary_tags,
          ingredients: video.recipe_metadata.ingredients,
          steps: video.recipe_metadata.steps,
          equipment: video.recipe_metadata.equipment,
          cuisine: video.recipe_metadata.cuisine,
        } : undefined,
      }));
    },
    // React Query Caching-Optionen
    staleTime: 5 * 60 * 1000,     // Daten sind 5 Minuten "frisch"
    gcTime: 10 * 60 * 1000,       // Unbenutzte Videos nach 10 Minuten aus Cache entfernen
    refetchOnMount: true,         // Neu laden beim Mounten
    refetchOnWindowFocus: true,   // Neu laden wenn Tab/App fokussiert wird
    refetchInterval: false,       // Kein automatisches Polling
    retry: 2,                     // Maximal 2 Retry-Versuche bei Fehlern
  });
} 