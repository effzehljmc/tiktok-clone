import { supabase } from '@/utils/supabase';
import axios, { AxiosError } from 'axios';
import * as Sentry from '@sentry/react-native';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface RecipeMetadata {
  ingredients: string[];
  cookingTime: number;
  difficulty: string;
  cuisine: string;
  dietaryTags: string[];
}

// Error types for better error handling
enum EmbeddingErrorType {
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

interface EmbeddingError extends Error {
  type: EmbeddingErrorType;
  retryAfter?: number;
}

// Utility to create typed errors
function createEmbeddingError(
  message: string,
  type: EmbeddingErrorType,
  retryAfter?: number
): EmbeddingError {
  const error = new Error(message) as EmbeddingError;
  error.type = type;
  if (retryAfter) error.retryAfter = retryAfter;
  return error;
}

// API usage monitoring
interface APIUsageMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  lastCallTimestamp: number;
}

let apiUsageMetrics: APIUsageMetrics = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  totalTokens: 0,
  lastCallTimestamp: 0,
};

// Function to log API metrics to Supabase
async function logAPIMetrics(metrics: Partial<APIUsageMetrics>) {
  try {
    const { error } = await supabase
      .from('api_usage_logs')
      .insert([{
        service: 'openai_embeddings',
        ...metrics,
        timestamp: new Date().toISOString()
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to log API metrics:', error);
    Sentry.captureException(error);
  }
}

// Exponential backoff utility
function calculateBackoff(attempt: number, initialDelay: number): number {
  return initialDelay * Math.pow(2, attempt - 1);
}

// Enhanced error handling for OpenAI API
function handleOpenAIError(error: unknown): EmbeddingError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    switch (status) {
      case 429:
        const retryAfter = parseInt(error.response?.headers['retry-after'] || '60');
        return createEmbeddingError(
          'API rate limit exceeded',
          EmbeddingErrorType.API_RATE_LIMIT,
          retryAfter
        );
      case 402:
        return createEmbeddingError(
          'API quota exceeded',
          EmbeddingErrorType.API_QUOTA_EXCEEDED
        );
      case 413:
        return createEmbeddingError(
          'Token limit exceeded',
          EmbeddingErrorType.TOKEN_LIMIT_EXCEEDED
        );
      default:
        if (!error.response) {
          return createEmbeddingError(
            'Network error',
            EmbeddingErrorType.NETWORK_ERROR
          );
        }
    }
  }
  
  return createEmbeddingError(
    'Unknown error occurred',
    EmbeddingErrorType.UNKNOWN
  );
}

/**
 * Combines video data into a single text for embedding
 */
function prepareTextForEmbedding(
  title: string,
  description: string | null,
  tags: string[],
  recipeMetadata: RecipeMetadata | null
): string {
  const parts = [
    `Title: ${title}`,
    description ? `Description: ${description}` : '',
    tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''
  ];

  if (recipeMetadata) {
    const {
      ingredients,
      cookingTime,
      difficulty,
      cuisine,
      dietaryTags
    } = recipeMetadata;

    parts.push(
      `Recipe Details:`,
      `Ingredients: ${ingredients.join(', ')}`,
      `Cooking Time: ${cookingTime} minutes`,
      `Difficulty: ${difficulty}`,
      `Cuisine: ${cuisine}`,
      `Dietary Tags: ${dietaryTags.join(', ')}`
    );
  }

  return parts.filter(Boolean).join('\n');
}

/**
 * Generates embeddings using OpenAI's API with retry logic
 */
async function generateEmbeddings(text: string): Promise<number[]> {
  let attempt = 1;
  
  while (attempt <= MAX_RETRIES) {
    try {
      apiUsageMetrics.totalCalls++;
      apiUsageMetrics.lastCallTimestamp = Date.now();

      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: 'text-embedding-ada-002'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`
          }
        }
      );

      // Update success metrics
      apiUsageMetrics.successfulCalls++;
      apiUsageMetrics.totalTokens += text.length / 4; // Rough token estimation
      
      // Log metrics periodically
      if (apiUsageMetrics.totalCalls % 100 === 0) {
        await logAPIMetrics(apiUsageMetrics);
      }

      return response.data.data[0].embedding;
    } catch (error) {
      try {
        const embeddingError = handleOpenAIError(error);
        
        // Update failure metrics
        apiUsageMetrics.failedCalls++;
        
        // Handle different error types
        switch (embeddingError.type) {
          case EmbeddingErrorType.API_RATE_LIMIT:
            if (attempt < MAX_RETRIES) {
              const delay = embeddingError.retryAfter
                ? embeddingError.retryAfter * 1000
                : calculateBackoff(attempt, INITIAL_RETRY_DELAY);
              await new Promise(resolve => setTimeout(resolve, delay));
              attempt++;
              continue;
            }
            break;
          
          case EmbeddingErrorType.TOKEN_LIMIT_EXCEEDED:
            // If text is too long, we could try to truncate it
            if (text.length > 8000) { // Rough estimate
              text = text.slice(0, 8000);
              attempt++;
              continue;
            }
            break;
            
          case EmbeddingErrorType.API_QUOTA_EXCEEDED:
            // Log critical error and stop retrying
            Sentry.captureException(embeddingError);
            await logAPIMetrics({
              ...apiUsageMetrics,
              failedCalls: apiUsageMetrics.failedCalls + 1
            });
            throw embeddingError;
            
          default:
            if (attempt < MAX_RETRIES) {
              const delay = calculateBackoff(attempt, INITIAL_RETRY_DELAY);
              await new Promise(resolve => setTimeout(resolve, delay));
              attempt++;
              continue;
            }
        }
      } catch (handlingError) {
        Sentry.captureException(handlingError);
        throw handlingError;
      }
      
      // If we've exhausted all retries, throw the last error
      if (attempt === MAX_RETRIES) {
        Sentry.captureException(error);
        await logAPIMetrics(apiUsageMetrics);
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate embeddings after all retries');
}

/**
 * Stores embeddings in the database
 */
async function storeEmbeddings(videoId: string, embedding: number[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('videos')
      .update({ embedding_vector: embedding })
      .eq('id', videoId);

    if (error) throw error;
  } catch (error) {
    console.error('Error storing embeddings:', error);
    throw error;
  }
}

/**
 * Updates embeddings for a single video
 */
export async function updateVideoEmbeddings(videoId: string): Promise<void> {
  try {
    // 1. Fetch video data
    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        *,
        recipe_metadata (
          ingredients,
          cooking_time,
          difficulty,
          cuisine,
          dietary_tags
        )
      `)
      .eq('id', videoId)
      .single();

    if (error || !video) {
      throw error || new Error('Video not found');
    }

    // 2. Prepare text for embedding
    const textToEmbed = prepareTextForEmbedding(
      video.title,
      video.description,
      video.tags,
      video.recipe_metadata
    );

    // 3. Generate embeddings with retry logic
    const embedding = await generateEmbeddings(textToEmbed);

    // 4. Store embeddings
    const { error: updateError } = await supabase
      .from('videos')
      .update({ 
        embedding_vector: embedding,
        last_embedding_update: new Date().toISOString()
      })
      .eq('id', videoId);

    if (updateError) {
      throw updateError;
    }

    // Log successful update
    console.log(`Successfully updated embeddings for video ${videoId}`);
  } catch (error) {
    console.error('Error updating video embeddings:', error);
    Sentry.captureException(error);
    throw error;
  }
}

/**
 * Updates embeddings for all videos that don't have them yet
 */
export async function updateAllMissingEmbeddings(): Promise<void> {
  try {
    // Fetch all videos without embeddings
    const { data: videos, error } = await supabase
      .from('videos')
      .select('id')
      .is('embedding_vector', null);

    if (error) throw error;
    if (!videos || videos.length === 0) {
      console.log('No videos found without embeddings');
      return;
    }

    console.log(`Found ${videos.length} videos without embeddings`);

    // Process videos in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      await Promise.all(
        batch.map(video => updateVideoEmbeddings(video.id))
      );
      console.log(`Processed batch ${i / batchSize + 1}`);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Finished updating all missing embeddings');
  } catch (error) {
    console.error('Error updating all missing embeddings:', error);
    throw error;
  }
}

/**
 * Calculates cosine similarity between two vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
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

/**
 * Finds similar videos based on embedding similarity
 */
export async function findSimilarVideos(
  videoId: string,
  limit: number = 5
): Promise<string[]> {
  try {
    // 1. Get the source video's embedding
    const { data: sourceVideo, error: sourceError } = await supabase
      .from('videos')
      .select('embedding_vector')
      .eq('id', videoId)
      .single();

    if (sourceError || !sourceVideo?.embedding_vector) {
      throw sourceError || new Error('Source video embedding not found');
    }

    // 2. Find similar videos using cosine similarity
    const { data: similarVideos, error: similarError } = await supabase
      .rpc('find_similar_videos', {
        query_embedding: sourceVideo.embedding_vector,
        match_threshold: 0.5,
        match_count: limit
      });

    if (similarError) throw similarError;

    return similarVideos.map((video: { id: string }) => video.id);
  } catch (error) {
    console.error('Error finding similar videos:', error);
    Sentry.captureException(error);
    throw error;
  }
}

// Export monitoring functions for external use
export function getAPIUsageMetrics(): APIUsageMetrics {
  return { ...apiUsageMetrics };
}

export function resetAPIUsageMetrics(): void {
  apiUsageMetrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalTokens: 0,
    lastCallTimestamp: 0,
  };
} 