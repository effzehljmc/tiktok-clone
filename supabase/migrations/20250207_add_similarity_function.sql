-- Function to find similar videos based on embedding similarity
CREATE OR REPLACE FUNCTION find_similar_videos(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        videos.id,
        1 - (videos.embedding_vector <=> query_embedding) as similarity
    FROM videos
    WHERE videos.embedding_vector IS NOT NULL
    AND 1 - (videos.embedding_vector <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$; 