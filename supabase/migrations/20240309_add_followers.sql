-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
    follower_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Add RLS policies
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Allow users to follow/unfollow
CREATE POLICY "Users can follow/unfollow others"
ON followers FOR ALL
USING (auth.uid() = follower_id);

-- Create function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM followers
        WHERE followers.follower_id = $1
        AND followers.following_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM followers
        WHERE following_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM followers
        WHERE follower_id = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 