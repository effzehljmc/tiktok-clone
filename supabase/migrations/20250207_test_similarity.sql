-- Get the embedding vector for our reference video (Avocado Toast)
WITH reference_embedding AS (
  SELECT embedding_vector
  FROM videos
  WHERE title ILIKE '%avocado toast%'
  LIMIT 1
)
-- Find similar recipes based on the embedding
SELECT 
  v.title,
  v.description,
  v.tags,
  1 - (v.embedding_vector <-> (SELECT embedding_vector FROM reference_embedding)) as similarity_score
FROM videos v
WHERE v.title NOT ILIKE '%avocado toast%' -- Exclude the reference video
  AND v.embedding_vector IS NOT NULL
ORDER BY v.embedding_vector <-> (SELECT embedding_vector FROM reference_embedding)
LIMIT 5; 