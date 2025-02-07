-- First, check if there's any data in the 'embedding' column we want to preserve
DO $$ 
BEGIN
    -- If there's data in 'embedding' but not in 'embedding_vector', migrate it
    UPDATE videos 
    SET embedding_vector = embedding 
    WHERE embedding IS NOT NULL 
    AND embedding_vector IS NULL;
END $$;

-- Then drop the unused column
ALTER TABLE videos DROP COLUMN IF EXISTS embedding; 