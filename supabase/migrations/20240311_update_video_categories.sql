-- First, add new values to VideoCategory enum
DO $$ BEGIN
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'BREAKFAST';
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'LUNCH';
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'DINNER';
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'DESSERT';
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'SNACKS';
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'DRINKS';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop ALL existing search_videos functions to avoid conflicts
DROP FUNCTION IF EXISTS search_videos(text, "VideoCategory", integer, integer);
DROP FUNCTION IF EXISTS search_videos(text, "VideoCategory", text, integer, integer);
DROP FUNCTION IF EXISTS search_videos(text, vector, "VideoCategory", integer, integer, float, float);

-- Create a single search_videos function with all parameters
CREATE OR REPLACE FUNCTION search_videos(
  search_query TEXT,
  category_filter "VideoCategory" DEFAULT NULL,
  dietary_preference TEXT DEFAULT NULL,
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
        search_query = '' OR
        v.title ILIKE '%' || search_query || '%' OR
        v.description ILIKE '%' || search_query || '%' OR
        v.tags @> ARRAY[search_query]
      )
      AND (
        category_filter IS NULL OR 
        v.category = category_filter
      )
      AND (
        dietary_preference IS NULL OR
        (rm.dietary_tags IS NOT NULL AND rm.dietary_tags @> ARRAY[dietary_preference])
      )
  )
  SELECT *
  FROM filtered_videos
  ORDER BY 
    CASE 
      WHEN title ILIKE '%' || search_query || '%' THEN 1
      WHEN description ILIKE '%' || search_query || '%' THEN 2
      WHEN tags @> ARRAY[search_query] THEN 3
      ELSE 4
    END,
    created_at DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 