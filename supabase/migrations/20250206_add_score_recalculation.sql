-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to recalculate scores for all video-user combinations
CREATE OR REPLACE FUNCTION recalculate_all_scores()
RETURNS void AS $$
DECLARE
    r RECORD;
    ref_video RECORD;
    similarity_score FLOAT;
BEGIN
    -- For each video_metrics entry
    FOR r IN 
        SELECT 
            vm.user_id,
            vm.video_id,
            vm.watched_seconds,
            vm.completed,
            vm.replay_count,
            vm.average_watch_percent,
            v.embedding_vector
        FROM video_metrics vm
        JOIN videos v ON vm.video_id = v.id
    LOOP
        -- Calculate engagement score
        DECLARE
            engagement_score FLOAT;
        BEGIN
            engagement_score := 
                r.watched_seconds * 1 + -- watchTime weight
                CASE WHEN r.completed THEN 50 ELSE 0 END + -- completion weight
                r.replay_count * 10 + -- replay weight
                r.average_watch_percent * 0.5; -- averageWatch weight

            -- Get the last watched video for content similarity
            SELECT v.* INTO ref_video
            FROM video_metrics vm
            JOIN videos v ON vm.video_id = v.id
            WHERE vm.user_id = r.user_id
            ORDER BY vm.watched_at DESC
            LIMIT 1;

            -- Calculate content similarity if we have a reference video
            IF ref_video.embedding_vector IS NOT NULL AND r.embedding_vector IS NOT NULL THEN
                similarity_score := 1 - (ref_video.embedding_vector <-> r.embedding_vector);
            ELSE
                similarity_score := 0;
            END IF;

            -- Calculate total score (70% engagement, 30% similarity)
            INSERT INTO video_scores (
                user_id,
                video_id,
                engagement_score,
                content_similarity_score,
                total_score,
                last_calculated_at
            )
            VALUES (
                r.user_id,
                r.video_id,
                engagement_score,
                similarity_score,
                engagement_score * 0.7 + similarity_score * 0.3,
                NOW()
            )
            ON CONFLICT (user_id, video_id)
            DO UPDATE SET
                engagement_score = EXCLUDED.engagement_score,
                content_similarity_score = EXCLUDED.content_similarity_score,
                total_score = EXCLUDED.total_score,
                last_calculated_at = EXCLUDED.last_calculated_at;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create the cron job to run every hour
SELECT cron.schedule(
    'recalculate-scores', -- job name
    '0 * * * *',         -- every hour
    'SELECT recalculate_all_scores();'
); 