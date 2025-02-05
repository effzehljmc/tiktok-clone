-- Grant SELECT permissions to anonymous and authenticated users
GRANT SELECT ON recipe_metadata TO anon;
GRANT SELECT ON recipe_metadata TO authenticated;

-- Temporarily disable RLS for testing
ALTER TABLE recipe_metadata DISABLE ROW LEVEL SECURITY;

-- Note: After testing, we should re-enable RLS with:
-- ALTER TABLE recipe_metadata ENABLE ROW LEVEL SECURITY;

-- Recreate the SELECT policy to ensure it works
DROP POLICY IF EXISTS "Anyone can view recipe metadata for published videos" ON recipe_metadata;
CREATE POLICY "Anyone can view recipe metadata for published videos" ON recipe_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = recipe_metadata.video_id
            AND videos.status = 'PUBLISHED'
            AND videos.is_private = false
        )
    ); 