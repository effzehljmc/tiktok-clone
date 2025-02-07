import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { Database } from '@/utils/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.EXPO_SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiKey });

interface RecipeMetadata {
  ingredients: string[];
  cooking_time: number;
  difficulty: string;
  cuisine: string;
  dietary_tags: string[];
}

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
      cooking_time,
      difficulty,
      cuisine,
      dietary_tags
    } = recipeMetadata;

    parts.push(
      `Recipe Details:`,
      `Ingredients: ${ingredients.join(', ')}`,
      `Cooking Time: ${cooking_time} minutes`,
      `Difficulty: ${difficulty}`,
      `Cuisine: ${cuisine}`,
      `Dietary Tags: ${dietary_tags.join(', ')}`
    );
  }

  return parts.filter(Boolean).join('\n');
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });

  return response.data[0].embedding;
}

async function main() {
  console.log('Starting embedding generation...');

  try {
    // 1. Get all videos without embeddings
    const { data: videos, error: fetchError } = await supabase
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
      .is('embedding_vector', null);

    if (fetchError) throw fetchError;
    if (!videos || videos.length === 0) {
      console.log('No videos found without embeddings');
      return;
    }

    console.log(`Found ${videos.length} videos without embeddings`);

    // 2. Process videos in batches
    const batchSize = 5;
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      
      // Process each video in the batch
      await Promise.all(batch.map(async (video) => {
        try {
          // Prepare text for embedding
          const text = prepareTextForEmbedding(
            video.title,
            video.description,
            video.tags,
            video.recipe_metadata
          );

          // Generate embedding
          const embedding = await generateEmbedding(text);

          // Store embedding
          const { error: updateError } = await supabase
            .from('videos')
            .update({ embedding_vector: embedding })
            .eq('id', video.id);

          if (updateError) throw updateError;

          console.log(`Updated embedding for video ${video.id}`);
        } catch (error) {
          console.error(`Error processing video ${video.id}:`, error);
        }
      }));

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}`);
      
      // Add delay between batches
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Finished generating embeddings!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 
