import { queryRecipeAgent, AIAgentOptions, AIAgentResponse } from './aiAgent';
import { RecipeMetadata } from '@prisma/client';

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logError(error: any, context: { 
  attempt: number;
  userPrompt: string;
  recipe: Partial<RecipeMetadata>;
  options?: AIAgentOptions;
}) {
  console.error('AI Agent Error:', {
    error: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

export async function safeQueryAgent(
  userPrompt: string,
  recipe: RecipeMetadata,
  options?: AIAgentOptions,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<AIAgentResponse> {
  let lastError: any;
  let currentDelay = retryConfig.delayMs;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      // Log attempt if not the first try
      if (attempt > 1) {
        console.log(`Retry attempt ${attempt} for prompt: "${userPrompt}"`);
      }

      const result = await queryRecipeAgent(userPrompt, recipe, options);

      // If successful after retries, log the recovery
      if (attempt > 1) {
        console.log(`Successfully recovered after ${attempt} attempts`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Log the error with context
      logError(error, {
        attempt,
        userPrompt,
        recipe: {
          id: recipe.id,
          videoId: recipe.videoId,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
        },
        options,
      });

      // Don't wait on the last attempt
      if (attempt < retryConfig.maxAttempts) {
        // Exponential backoff
        await delay(currentDelay);
        currentDelay *= retryConfig.backoffFactor;
      }

      // Special handling for specific error types
      if (error.status === 429) { // Rate limit
        console.warn('Rate limit hit, increasing backoff...');
        currentDelay *= 2;
      } else if (error.status === 400) { // Bad request
        // Don't retry on bad requests
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.status === 401 || error.status === 403) { // Auth errors
        // Don't retry on auth errors
        throw new Error(`Authentication error: ${error.message}`);
      }
    }
  }

  // If we get here, all retries failed
  throw new Error(
    `Failed after ${retryConfig.maxAttempts} attempts. Last error: ${lastError.message}`
  );
}

// Utility function for checking if we should retry based on error type
export function isRetryableError(error: any): boolean {
  // Network errors should be retried
  if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
    return true;
  }

  // Retry on rate limits
  if (error.status === 429) {
    return true;
  }

  // Retry on server errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // Don't retry on client errors (except rate limits)
  if (error.status >= 400 && error.status < 500) {
    return false;
  }

  // Retry by default for unknown errors
  return true;
}

// Convenience wrapper for simple queries without retry configuration
export async function quickQueryAgent(
  userPrompt: string,
  recipe: RecipeMetadata,
  options?: AIAgentOptions
): Promise<AIAgentResponse> {
  return safeQueryAgent(userPrompt, recipe, options, {
    maxAttempts: 1,
    delayMs: 0,
    backoffFactor: 1,
  });
} 