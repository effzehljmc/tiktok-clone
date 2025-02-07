-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure we have the embedding column with the correct type
DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'videos' 
        AND column_name = 'embedding_vector'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE videos 
        ADD COLUMN embedding_vector vector(1536);
    END IF;
END $$;

-- Create an index on the embedding column for faster similarity searches
CREATE INDEX IF NOT EXISTS videos_embedding_vector_idx 
ON videos 
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100); 