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
  query_embedding vector(384),
  category_filter "VideoCategory" DEFAULT NULL,
  limit_val INTEGER DEFAULT 20,
  offset_val INTEGER DEFAULT 0,
  semantic_weight FLOAT DEFAULT 0.5,
  text_weight FLOAT DEFAULT 0.5
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  views_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  status "VideoStatus",
  is_private BOOLEAN,
  creator_id UUID,
  category "VideoCategory",
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT 
      id,
      1 - (embedding <=> query_embedding) AS semantic_score
    FROM videos
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> query_embedding
    LIMIT limit_val * 2
  ),
  full_text_results AS (
    SELECT 
      v.id,
      ts_rank(v.search_vector, websearch_to_tsquery('english', search_query)) AS text_score
    FROM videos v
    WHERE 
      v.search_vector @@ websearch_to_tsquery('english', search_query)
  ),
  combined_results AS (
    SELECT 
      v.*,
      COALESCE(sr.semantic_score, 0) * semantic_weight + 
      COALESCE(ftr.text_score, 0) * text_weight AS combined_score
    FROM videos v
    LEFT JOIN semantic_results sr ON v.id = sr.id
    LEFT JOIN full_text_results ftr ON v.id = ftr.id
    WHERE 
      v.status = 'PUBLISHED' 
      AND v.is_private = false
      AND (category_filter IS NULL OR v.category = category_filter)
      AND (
        sr.id IS NOT NULL 
        OR ftr.id IS NOT NULL 
        OR v.title ILIKE '%' || search_query || '%' 
        OR v.description ILIKE '%' || search_query || '%'
      )
  )
  SELECT 
    cr.id,
    cr.title,
    cr.description,
    cr.video_url,
    cr.thumbnail_url,
    cr.duration,
    cr.views_count,
    cr.likes_count,
    cr.comments_count,
    cr.status,
    cr.is_private,
    cr.creator_id,
    cr.category,
    cr.tags,
    cr.created_at,
    cr.updated_at,
    cr.combined_score AS search_rank
  FROM combined_results cr
  ORDER BY cr.combined_score DESC, cr.created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 