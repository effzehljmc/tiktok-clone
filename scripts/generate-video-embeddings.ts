import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 384,
  });
  return response.data[0].embedding;
}

async function updateVideoEmbeddings() {
  try {
    // Fetch videos that don't have embeddings yet
    const { data: videos, error: fetchError } = await supabaseAdmin
      .from('videos')
      .select('id, title, description, tags')
      .is('embedding', null)
      .eq('status', 'PUBLISHED');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${videos?.length} videos without embeddings`);

    // Process each video
    for (const video of videos || []) {
      try {
        // Combine video metadata for embedding
        const textToEmbed = [
          video.title,
          video.description,
          ...(video.tags || [])
        ].filter(Boolean).join(' ');

        if (!textToEmbed.trim()) {
          console.log(`Skipping video ${video.id} - no text content to embed`);
          continue;
        }

        console.log(`Generating embedding for video ${video.id}`);
        const embedding = await generateEmbedding(textToEmbed);

        // Update the video with its embedding
        const { error: updateError } = await supabaseAdmin
          .from('videos')
          .update({ embedding })
          .eq('id', video.id);

        if (updateError) {
          console.error(`Error updating video ${video.id}:`, updateError);
          continue;
        }

        console.log(`Successfully updated embedding for video ${video.id}`);
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }

      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('Finished updating video embeddings');
  } catch (error) {
    console.error('Error updating video embeddings:', error);
  }
}

// Run the script
updateVideoEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 
