import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { supabase } from '../utils/supabase';

// The base URL should not include /scalar
const BFL_API_BASE = 'https://api.us1.bfl.ai/v1';
const BFL_API_KEY = Constants.expoConfig?.extra?.BLACK_FOREST_LABS_API_KEY;

if (!BFL_API_KEY) {
  console.error('BLACK_FOREST_LABS_API_KEY is not set in environment variables');
}

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
}

interface ImageGenerationResponse {
  id: string;
  status: string;
  result?: {
    sample: string;
    prompt: string;
    seed: number;
    start_time: number;
    end_time: number;
    duration: number;
  };
  error?: string;
}

export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
  try {
    console.log('Generating image with options:', { ...options, prompt: options.prompt.substring(0, 50) + '...' });
    
    const { data, error } = await supabase.functions.invoke('image-generation', {
      body: options
    });

    if (error) throw error;
    if (!data) throw new Error('No data received from image generation');

    return data;
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

export async function getGenerationResult(id: string): Promise<ImageGenerationResponse> {
  if (!BFL_API_KEY) {
    throw new Error('BLACK_FOREST_LABS_API_KEY is not configured');
  }

  try {
    console.log('Checking generation status for:', id);
    
    const response = await fetch(`${BFL_API_BASE}/get_result?id=${id}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get generation result: ${response.status} ${response.statusText} ${errorText}`);
    }

    const data = await response.json();
    console.log('Get result response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching generation result:', error);
    throw error;
  }
}

export async function waitForGenerationCompletion(
  id: string, 
  maxAttempts = 30,
  intervalMs = 1000
): Promise<ImageGenerationResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    console.log(`Checking completion status (attempt ${attempts + 1}/${maxAttempts})`);
    
    const result = await getGenerationResult(id);
    
    if (result.status === 'Ready') {
      console.log('Generation completed successfully');
      return result;
    }
    
    if (result.status === 'Failed') {
      console.error('Generation failed:', result.error);
      throw new Error(result.error || 'Image generation failed');
    }
    
    console.log(`Generation still pending, waiting ${intervalMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('Generation timed out');
} 