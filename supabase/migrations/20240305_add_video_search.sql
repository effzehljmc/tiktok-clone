-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Create video_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE video_status AS ENUM ('PROCESSING', 'PUBLISHED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create video_category enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE video_category AS ENUM ('MUSIC', 'GAMING', 'EDUCATION', 'ENTERTAINMENT', 'SPORTS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS search_videos(TEXT, "VideoCategory", INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_videos(TEXT, video_category, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_videos(TEXT);
DROP FUNCTION IF EXISTS match_videos;

-- Add full-text search capabilities to videos table

-- Create a function to generate the search vector
CREATE OR REPLACE FUNCTION video_search_vector(title TEXT, description TEXT, tags TEXT[]) RETURNS tsvector AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a generated column for the search vector
ALTER TABLE videos ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (video_search_vector(title, description, tags)) STORED;

-- Create a GIN index on the search vector for fast full-text search
CREATE INDEX IF NOT EXISTS videos_search_idx ON videos USING GIN (search_vector);

-- Add a column for the embedding vector using pgvector
DO $$ BEGIN
  ALTER TABLE videos ADD COLUMN embedding vector(384);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create an HNSW index for the embedding column for fast approximate nearest neighbor search
DROP INDEX IF EXISTS videos_embedding_idx;
CREATE INDEX videos_embedding_idx ON videos USING hnsw (embedding vector_cosine_ops);

-- Create a function to match videos using semantic search
CREATE OR REPLACE FUNCTION match_videos (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    videos.id,
    1 - (videos.embedding <=> query_embedding) AS similarity
  FROM videos
  WHERE 1 - (videos.embedding <=> query_embedding) > match_threshold
  ORDER BY videos.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to search videos using hybrid search
CREATE OR REPLACE FUNCTION search_videos(
  search_query TEXT,
  category_filter VideoCategory DEFAULT NULL,
  dietary_preference TEXT DEFAULT NULL,
  limit_val INTEGER DEFAULT 20,
  offset_val INTEGER DEFAULT 0
) RETURNS SETOF videos AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT v.*
  FROM videos v
  LEFT JOIN recipe_metadata rm ON v.id = rm.video_id
  WHERE v.status = 'PUBLISHED'
    AND v.is_private = false
    AND (
      v.title ILIKE '%' || search_query || '%'
      OR v.description ILIKE '%' || search_query || '%'
      OR v.tags @> ARRAY[search_query]
    )
    AND (category_filter IS NULL OR v.category = category_filter)
    AND (
      dietary_preference IS NULL 
      OR (rm.dietary_tags IS NOT NULL AND rm.dietary_tags @> ARRAY[dietary_preference])
    )
  ORDER BY 
    CASE 
      WHEN v.title ILIKE '%' || search_query || '%' THEN 0
      WHEN v.description ILIKE '%' || search_query || '%' THEN 1
      ELSE 2
    END,
    v.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql; 