import { generateImage, getGenerationResult, waitForGenerationCompletion } from './imageGeneration';
import type { ImageGenerationOptions } from './imageGeneration';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

export async function safeGenerateImage(
  options: ImageGenerationOptions,
  retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS
) {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 5000 } = retryOptions;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Start the generation
      const generationResponse = await generateImage(options);
      
      // Wait for completion
      const result = await waitForGenerationCompletion(
        generationResponse.id,
        30, // max attempts for completion check
        1000 // interval between checks
      );

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Image generation attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        // Calculate exponential backoff delay
        const delay = Math.min(
          Math.pow(2, attempt - 1) * baseDelay,
          maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Image generation failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
  );
}

// Helper function to safely check generation status
export async function safeGetGenerationResult(
  id: string,
  retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS
) {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 5000 } = retryOptions;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await getGenerationResult(id);
    } catch (error) {
      lastError = error as Error;
      console.error(`Get result attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        const delay = Math.min(
          Math.pow(2, attempt - 1) * baseDelay,
          maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to get generation result after ${maxAttempts} attempts. Last error: ${lastError?.message}`
  );
} 