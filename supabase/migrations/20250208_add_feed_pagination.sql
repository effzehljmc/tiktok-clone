-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_feed_videos;

-- Create a function to get paginated feed videos
CREATE OR REPLACE FUNCTION get_feed_videos(
  category_filter "VideoCategory" DEFAULT NULL,
  difficulty_filter text DEFAULT NULL,
  dietary_tag_filter text DEFAULT NULL,
  limit_val INTEGER DEFAULT 20,
  offset_val INTEGER DEFAULT 0
) RETURNS SETOF videos AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH filtered_videos AS (
    SELECT DISTINCT v.*
    FROM videos v
    LEFT JOIN recipe_metadata rm ON v.id = rm.video_id
    WHERE v.status = 'PUBLISHED'
      AND v.is_private = false
      AND (
        category_filter IS NULL OR 
        v.category = category_filter
      )
      AND (
        difficulty_filter IS NULL OR
        rm.difficulty = difficulty_filter::text
      )
      AND (
        dietary_tag_filter IS NULL OR
        (rm.dietary_tags IS NOT NULL AND rm.dietary_tags @> ARRAY[dietary_tag_filter])
      )
  )
  SELECT *
  FROM filtered_videos
  ORDER BY created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_feed_videos TO authenticated;

-- Add index to support efficient pagination if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'videos' 
    AND indexname = 'idx_videos_feed_ordering'
  ) THEN
    CREATE INDEX idx_videos_feed_ordering ON videos (created_at DESC, id)
    WHERE status = 'PUBLISHED' AND is_private = false;
  END IF;
END $$;

-- Add comment to document the function
COMMENT ON FUNCTION get_feed_videos IS 'Returns a paginated list of published videos for the main feed with optional filtering by category, difficulty, and dietary preferences. Orders by creation date (newest first).'; 