import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are defined
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  }
);

// Types from Supabase
export type Database = {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          views_count: number;
          likes_count: number;
          comments_count: number;
          status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
          is_private: boolean;
          creator_id: string;
          category: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
      };
      video_metrics: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          watched_seconds: number;
          watched_at: string;
          last_position: number;
          completed: boolean;
          replay_count: number;
          average_watch_percent: number;
        };
      };
      video_scores: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          engagement_score: number;
          content_similarity_score: number;
          total_score: number;
          last_calculated_at: string;
          created_at: string;
          updated_at: string;
        };
      };
      recipe_metadata: {
        Row: {
          id: string;
          video_id: string;
          ingredients: string[];
          cooking_time: number;
          difficulty: string;
          cuisine: string;
          servings: number;
          calories: number | null;
          equipment: string[];
          dietary_tags: string[];
          steps: any; // JSON type in Postgres
        };
      };
    };
  };
};
