-- CreateFunction
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE videos
        SET likes_count = likes_count + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE videos
        SET likes_count = likes_count - 1
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- DropTrigger
DROP TRIGGER IF EXISTS update_video_likes_count_trigger ON likes;

-- CreateTrigger
CREATE TRIGGER update_video_likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_video_likes_count();

-- CreateFunction
CREATE OR REPLACE FUNCTION recalculate_all_video_likes_count()
RETURNS void AS $$
BEGIN
    UPDATE videos v
    SET likes_count = (
        SELECT COUNT(*)
        FROM likes l
        WHERE l.video_id = v.id
    );
END;
$$ LANGUAGE plpgsql; 
