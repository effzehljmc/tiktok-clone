-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_video_likes_count_trigger ON likes;
DROP FUNCTION IF EXISTS update_video_likes_count();

-- Recreate the function
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE videos
        SET likes_count = likes_count + 1,
            updated_at = now()
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE videos
        SET likes_count = likes_count - 1,
            updated_at = now()
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER update_video_likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_video_likes_count();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_video_likes_count() TO authenticated;

-- Recalculate all video like counts to ensure consistency
UPDATE videos v
SET likes_count = (
    SELECT COUNT(*)
    FROM likes l
    WHERE l.video_id = v.id
); 