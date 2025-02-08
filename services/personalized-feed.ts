import { supabase } from '@/utils/supabase';
import type { Database } from '@/utils/supabase';
import { PersonalizedVideo, getPersonalizedVideos, RecipeMetadata } from './recommendations';

type Tables = Database['public']['Tables'];
type DatabaseVideo = Tables['videos']['Row'];
type DatabaseVideoScores = Tables['video_scores']['Row'];

interface DatabaseRecipeMetadata {
  ingredients: string[];
  cooking_time: number;
  difficulty: string;
  cuisine: string;
  servings: number;
  calories?: number;
  equipment: string[];
  dietary_tags: string[];
  steps: Array<{
    timestamp: number;
    description: string;
  }>;
}

interface RPCVideoResult {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  category: string | null;
  tags: string[];
  recipe_metadata: DatabaseRecipeMetadata | null;
  total_score: number;
  engagement_score: number;
  content_similarity_score: number;
}

function convertDatabaseRecipeMetadata(dbMetadata: DatabaseRecipeMetadata): RecipeMetadata {
  return {
    ingredients: dbMetadata.ingredients,
    cookingTime: dbMetadata.cooking_time,
    difficulty: dbMetadata.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    cuisine: dbMetadata.cuisine,
    servings: dbMetadata.servings,
    calories: dbMetadata.calories,
    equipment: dbMetadata.equipment,
    dietaryTags: dbMetadata.dietary_tags,
    steps: dbMetadata.steps
  };
}

export interface PersonalizedFeedResponse {
  videos: PersonalizedVideo[];
  nextCursor?: string;
  hasMore: boolean;
}

const PAGE_SIZE = 5;

export async function getPersonalizedFeed(
  userId: string,
  cursor?: string
): Promise<PersonalizedFeedResponse> {
  try {
    // Parse cursor if provided
    let cursorScore: number | null = null;
    let cursorVideoId: string | null = null;
    
    if (cursor) {
      const [score, videoId] = cursor.split('_');
      cursorScore = parseFloat(score);
      cursorVideoId = videoId;
    }

    // Fetch one extra item to determine if there are more results
    const { data: results, error } = await supabase
      .rpc('get_personalized_videos', {
        p_user_id: userId,
        p_cursor_score: cursorScore,
        p_cursor_video_id: cursorVideoId,
        p_limit: PAGE_SIZE + 1
      });

    if (error) throw error;
    if (!results) return { videos: [], hasMore: false };

    // Remove the extra item before processing
    const hasMore = results.length > PAGE_SIZE;
    const pageResults = results.slice(0, PAGE_SIZE) as RPCVideoResult[];

    // Transform the results into PersonalizedVideo objects
    const videos = pageResults.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description || undefined,
      videoUrl: result.video_url,
      thumbnailUrl: result.thumbnail_url || undefined,
      viewsCount: result.views_count,
      likesCount: result.likes_count,
      commentsCount: result.comments_count,
      category: result.category || undefined,
      tags: result.tags,
      recipeMetadata: result.recipe_metadata 
        ? convertDatabaseRecipeMetadata(result.recipe_metadata)
        : undefined,
      personalizedScore: result.total_score,
      engagementScore: result.engagement_score,
      contentSimilarityScore: result.content_similarity_score
    })) satisfies PersonalizedVideo[];

    // Create the next cursor from the last item if we have more results
    let nextCursor: string | undefined;
    if (hasMore && pageResults.length > 0) {
      const lastItem = pageResults[pageResults.length - 1];
      nextCursor = `${lastItem.total_score}_${lastItem.id}`;
    }

    return {
      videos,
      nextCursor,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching personalized feed:', error);
    throw error;
  }
} 
