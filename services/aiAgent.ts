import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { RecipeMetadata } from '@prisma/client';
import { selectPromptBuilder } from './prompts/recipePrompts';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    url: supabaseUrl ? 'exists' : 'missing',
    key: supabaseAnonKey ? 'exists' : 'missing'
  });
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AIAgentOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  queryType?: 'VARIATION' | 'NUTRITION' | 'TECHNIQUE' | 'SUBSTITUTION';
  userPreferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    cookingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
}

export interface AIAgentResponse {
  content: string;
  cached: boolean;
  error?: string;
}

/**
 * Main function to query the AI agent for recipe-related questions
 */
export async function queryRecipeAgent(
  userPrompt: string,
  recipe: RecipeMetadata,
  options: AIAgentOptions = {}
): Promise<AIAgentResponse> {
  try {
    console.log('Querying AI agent with prompt:', userPrompt);
    
    const queryType = options.queryType || 'VARIATION';
    const promptBuilder = selectPromptBuilder(queryType);
    const context = promptBuilder(userPrompt, { 
      recipe,
      userPreferences: options.userPreferences
    });

    const { data, error } = await supabase.functions.invoke('ai-agent', {
      body: {
        userPrompt,
        context,
        options: {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          model: options.model,
        },
      },
    });

    if (error) {
      console.error('Error calling AI agent edge function:', error);
      throw error;
    }

    return data as AIAgentResponse;
  } catch (error) {
    console.error('Error in queryRecipeAgent:', error);
    throw error;
  }
} 