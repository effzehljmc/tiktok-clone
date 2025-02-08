-- Grant access to authenticated users for video_scores table
GRANT SELECT ON video_scores TO authenticated;
GRANT SELECT ON videos TO authenticated;

-- Grant all access to service role
GRANT ALL ON video_scores TO service_role;
GRANT ALL ON videos TO service_role;

-- If we need to access the recipe_metadata as well
GRANT SELECT ON recipe_metadata TO authenticated;
GRANT ALL ON recipe_metadata TO service_role; 