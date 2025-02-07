import { supabase } from '@/utils/supabase';
import type { Database } from '@/utils/supabase';

type Tables = Database['public']['Tables'];
type DatabaseVideo = Tables['videos']['Row'];
type DatabaseVideoMetrics = Tables['video_metrics']['Row'];
type DatabaseVideoScores = Tables['video_scores']['Row'];

// Interfaces for the application layer
export interface VideoMetrics {
  watchedSeconds: number;
  lastPosition: number;
  completed: boolean;
  replayCount: number;
  averageWatchPercent: number;
}

export interface RecipeMetadata {
  ingredients: string[];
  cookingTime: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  cuisine: string;
  servings: number;
  calories?: number;
  equipment: string[];
  dietaryTags: string[];
  steps: Array<{
    timestamp: number;
    description: string;
  }>;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  category?: string;
  tags: string[];
  recipeMetadata?: RecipeMetadata;
}

export interface PersonalizedVideo extends Video {
  personalizedScore: number;
  engagementScore: number;
  contentSimilarityScore?: number;
}

interface RecommendationScore {
  videoId: string;
  engagementScore: number;
  contentSimilarityScore: number;
  totalScore: number;
}

// Utility functions to convert between database and application types
function convertDatabaseMetricsToApp(metrics: DatabaseVideoMetrics): VideoMetrics {
  return {
    watchedSeconds: metrics.watched_seconds,
    lastPosition: metrics.last_position,
    completed: metrics.completed,
    replayCount: metrics.replay_count,
    averageWatchPercent: metrics.average_watch_percent
  };
}

function convertAppMetricsToDatabase(
  metrics: Partial<VideoMetrics>,
  userId: string,
  videoId: string
): Partial<DatabaseVideoMetrics> {
  return {
    user_id: userId,
    video_id: videoId,
    watched_seconds: metrics.watchedSeconds,
    last_position: metrics.lastPosition,
    completed: metrics.completed,
    replay_count: metrics.replayCount,
    average_watch_percent: metrics.averageWatchPercent
  };
}

function convertDatabaseVideoToApp(dbVideo: DatabaseVideo): Video {
  return {
    id: dbVideo.id,
    title: dbVideo.title,
    description: dbVideo.description || undefined,
    videoUrl: dbVideo.video_url,
    thumbnailUrl: dbVideo.thumbnail_url || undefined,
    viewsCount: dbVideo.views_count,
    likesCount: dbVideo.likes_count,
    commentsCount: dbVideo.comments_count,
    category: dbVideo.category || undefined,
    tags: dbVideo.tags,
    // Note: recipe_metadata would need to be handled separately
  };
}

// Scoring functions
async function calculateAndStoreEngagementScore(
  userId: string,
  videoId: string,
  metrics: DatabaseVideoMetrics
): Promise<number> {
  const {
    watched_seconds,
    completed,
    replay_count,
    average_watch_percent
  } = metrics;

  // Gewichtungen für verschiedene Metriken
  const weights = {
    watchTime: 1,
    completion: 50,
    replay: 10,
    averageWatch: 0.5
  };

  const engagementScore = 
    watched_seconds * weights.watchTime +
    (completed ? weights.completion : 0) +
    replay_count * weights.replay +
    average_watch_percent * weights.averageWatch;

  // Store the calculated score
  const { error } = await supabase
    .from('video_scores')
    .upsert({
      user_id: userId,
      video_id: videoId,
      engagement_score: engagementScore,
      content_similarity_score: 0, // TODO: Implement content similarity
      total_score: engagementScore, // For now, total = engagement score
      last_calculated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error storing video score:', error);
    throw error;
  }

  return engagementScore;
}

// Initialize scores for new video-user combinations
async function initializeVideoScores(userId: string, videoIds: string[]): Promise<void> {
  const initialScores: Partial<DatabaseVideoScores>[] = videoIds.map(videoId => ({
    user_id: userId,
    video_id: videoId,
    engagement_score: 0,
    content_similarity_score: 0,
    total_score: 0,
    last_calculated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('video_scores')
    .upsert(initialScores, { 
      onConflict: 'user_id,video_id',
      ignoreDuplicates: true 
    });

  if (error) {
    console.error('Error initializing video scores:', error);
    throw error;
  }
}

// Main recommendation function
export async function getPersonalizedVideos(
  userId: string,
  referenceVideoId?: string,
  limit: number = 10
): Promise<PersonalizedVideo[]> {
  try {
    // Get reference embedding if provided
    let referenceEmbedding: number[] | null = null;
    if (referenceVideoId) {
      const { data: refVideo } = await supabase
        .from('videos')
        .select('embedding_vector')
        .eq('id', referenceVideoId)
        .single();
      
      referenceEmbedding = refVideo?.embedding_vector || null;
    }

    // Construct the base query
    let query = supabase
      .from('videos')
      .select(`
        *,
        recipe_metadata (
          ingredients,
          cooking_time,
          difficulty,
          cuisine,
          servings,
          calories,
          equipment,
          dietary_tags,
          steps
        ),
        video_metrics!inner (
          watched_seconds,
          completed,
          replay_count,
          average_watch_percent
        ),
        video_scores!inner (
          engagement_score,
          content_similarity_score,
          total_score
        )
      `)
      .eq('video_metrics.user_id', userId)
      .eq('status', 'PUBLISHED');

    // If we have a reference video, add similarity calculation
    if (referenceEmbedding) {
      query = query
        .not('id', 'eq', referenceVideoId) // Exclude reference video
        .order('embedding_vector <-> $1', { ascending: true });
    } else {
      // Otherwise, order by total score
      query = query.order('video_scores.total_score', { ascending: false });
    }

    // Execute query with limit
    const { data: videos, error } = await query.limit(limit);

    if (error) throw error;
    if (!videos) return [];

    // Calculate final scores and convert to application types
    const personalizedVideos: PersonalizedVideo[] = videos.map(dbVideo => {
      const metrics = dbVideo.video_metrics[0];
      const scores = dbVideo.video_scores[0];
      
      // Base engagement score from stored value
      const engagementScore = scores?.engagement_score || 0;

      // Calculate content similarity if we have a reference
      let contentSimilarityScore = 0;
      if (referenceEmbedding && dbVideo.embedding_vector) {
        contentSimilarityScore = calculateCosineSimilarity(
          referenceEmbedding,
          dbVideo.embedding_vector
        );
      }

      // Combine scores with weights
      const totalScore = (
        engagementScore * 0.7 + // 70% weight for engagement
        contentSimilarityScore * 0.3 // 30% weight for content similarity
      );

      // Convert database video to application type
      const video = convertDatabaseVideoToApp(dbVideo);

      return {
        ...video,
        recipeMetadata: dbVideo.recipe_metadata,
        personalizedScore: totalScore,
        engagementScore,
        contentSimilarityScore
      };
    });

    // Sort by personalized score
    return personalizedVideos.sort((a, b) => b.personalizedScore - a.personalizedScore);
  } catch (error) {
    console.error('Error in getPersonalizedVideos:', error);
    throw error;
  }
}

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper function to update metrics and recalculate scores
export async function updateVideoMetrics(
  userId: string,
  videoId: string,
  metrics: Partial<VideoMetrics>
): Promise<void> {
  try {
    // 1. Update metrics
    const { data: existingMetrics, error: metricsError } = await supabase
      .from('video_metrics')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw metricsError;
    }

    const dbMetrics = convertAppMetricsToDatabase(metrics, userId, videoId);
    const updatedMetrics = {
      ...existingMetrics,
      ...dbMetrics
    };

    const { error: upsertError } = await supabase
      .from('video_metrics')
      .upsert(updatedMetrics);

    if (upsertError) throw upsertError;

    // 2. Recalculate and store score
    await calculateAndStoreEngagementScore(userId, videoId, updatedMetrics as DatabaseVideoMetrics);
  } catch (error) {
    console.error('Error updating video metrics:', error);
    throw error;
  }
} 
