-- Create the timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create video_scores table
CREATE TABLE video_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Engagement Scores
    engagement_score FLOAT NOT NULL DEFAULT 0,
    
    -- Content Similarity Scores (für zukünftige Implementierung)
    content_similarity_score FLOAT DEFAULT 0,
    
    -- Combined Score
    total_score FLOAT NOT NULL DEFAULT 0,
    
    -- Metadata
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique score per video-user combination
    CONSTRAINT unique_video_user_score UNIQUE (video_id, user_id)
);

-- Create indexes for fast queries
CREATE INDEX idx_video_scores_user_id ON video_scores(user_id);
CREATE INDEX idx_video_scores_video_id ON video_scores(video_id);
CREATE INDEX idx_video_scores_total_score ON video_scores(total_score DESC);

-- Add the update trigger
CREATE TRIGGER set_video_scores_timestamp
    BEFORE UPDATE ON video_scores
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 