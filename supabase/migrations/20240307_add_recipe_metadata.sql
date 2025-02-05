-- Add COOKING to VideoCategory if it doesn't exist
DO $$ BEGIN
    ALTER TYPE "VideoCategory" ADD VALUE IF NOT EXISTS 'COOKING';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create recipe_metadata table
CREATE TABLE IF NOT EXISTS recipe_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
    ingredients TEXT[] DEFAULT '{}',
    cooking_time INTEGER NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    cuisine TEXT NOT NULL,
    servings INTEGER NOT NULL,
    calories INTEGER,
    equipment TEXT[] DEFAULT '{}',
    dietary_tags TEXT[] DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT recipe_metadata_cooking_time_check CHECK (cooking_time > 0),
    CONSTRAINT recipe_metadata_servings_check CHECK (servings > 0),
    CONSTRAINT recipe_metadata_calories_check CHECK (calories IS NULL OR calories > 0)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS recipe_metadata_video_id_idx ON recipe_metadata(video_id);

-- Add RLS policies
ALTER TABLE recipe_metadata ENABLE ROW LEVEL SECURITY;

-- Policy for viewing recipe metadata (anyone can view published recipes)
CREATE POLICY "Anyone can view recipe metadata for published videos" ON recipe_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = recipe_metadata.video_id
            AND videos.status = 'PUBLISHED'
            AND videos.is_private = false
        )
    );

-- Policy for inserting recipe metadata (only authenticated users for their own videos)
CREATE POLICY "Users can insert recipe metadata for their own videos" ON recipe_metadata
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = recipe_metadata.video_id
            AND videos.creator_id = auth.uid()
        )
    );

-- Policy for updating recipe metadata (only video owners)
CREATE POLICY "Users can update recipe metadata for their own videos" ON recipe_metadata
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = recipe_metadata.video_id
            AND videos.creator_id = auth.uid()
        )
    );

-- Policy for deleting recipe metadata (only video owners)
CREATE POLICY "Users can delete recipe metadata for their own videos" ON recipe_metadata
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM videos
            WHERE videos.id = recipe_metadata.video_id
            AND videos.creator_id = auth.uid()
        )
    );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_recipe_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
CREATE TRIGGER update_recipe_metadata_updated_at
    BEFORE UPDATE ON recipe_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_metadata_updated_at(); 