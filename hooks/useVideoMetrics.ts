import { useCallback, useRef, useEffect } from 'react';
import { AVPlaybackStatus } from 'expo-av';
import { useUser } from './useUser';
import { supabase } from '../utils/supabase';

interface PendingUpdate {
  videoId: string;
  watchedSeconds: number;
  lastPosition: number;
  completed: boolean;
  watchPercent: number;
}

// Constants for better maintainability
const BATCH_UPDATE_INTERVAL = 3000; // Consistent 3-second interval for batch updates
const VIEW_THRESHOLD = 0.9; // 90% watched = completed

// Helper functions for metric calculations
function calculateNewAverageWatchPercent(
  currentAvg: number,
  replayCount: number,
  newWatchPercent: number
): number {
  return (currentAvg * replayCount + newWatchPercent) / (replayCount + 1);
}

function calculateWatchMetrics(
  positionMillis: number,
  durationMillis: number
): { watchedSeconds: number; completed: boolean; watchPercent: number } {
  const watchedSeconds = Math.floor(positionMillis / 1000);
  const completed = positionMillis >= (durationMillis * VIEW_THRESHOLD);
  const watchPercent = durationMillis ? (positionMillis / durationMillis) * 100 : 0;
  
  return { watchedSeconds, completed, watchPercent };
}

export function useVideoMetrics() {
  const { user } = useUser();
  const viewedVideos = useRef<Set<string>>(new Set());
  const pendingUpdates = useRef<PendingUpdate[]>([]);
  const updateInterval = useRef<NodeJS.Timeout>();
  const videoStarts = useRef<{ [key: string]: number }>({});
  const userId = useRef(user?.id);
  const hasLoggedCompletion = useRef<Set<string>>(new Set());

  // Simplified batch processing without complex retry logic
  const processPendingUpdates = useCallback(async () => {
    if (!userId.current || pendingUpdates.current.length === 0) {
      return;
    }

    const updates = [...pendingUpdates.current];
    pendingUpdates.current = [];

    for (const update of updates) {
      try {
        // Get current metrics for average calculation
        const { data: currentMetrics } = await supabase
          .from('video_metrics')
          .select('average_watch_percent, replay_count')
          .match({ user_id: userId.current, video_id: update.videoId })
          .single();

        // Calculate new metrics
        const replayCount = (currentMetrics?.replay_count || 0) + (videoStarts.current[update.videoId] || 0);
        const currentAvg = currentMetrics?.average_watch_percent || 0;
        const newAvgPercent = calculateNewAverageWatchPercent(
          currentAvg,
          replayCount,
          update.watchPercent
        );

        // Update metrics in a single operation
        await supabase
          .from('video_metrics')
          .upsert({
            video_id: update.videoId,
            user_id: userId.current,
            watched_seconds: update.watchedSeconds,
            last_position: update.lastPosition,
            completed: update.completed,
            replay_count: replayCount,
            average_watch_percent: newAvgPercent
          }, {
            onConflict: 'user_id,video_id'
          });

        // Reset replay counter after successful update
        videoStarts.current[update.videoId] = 0;

      } catch (error) {
        console.error('Error updating metrics:', error);
        // Simple error handling - add back to queue only if critical
        if (update.completed) {
          pendingUpdates.current.push(update);
        }
      }
    }
  }, []); // No dependencies needed as we use refs

  // Update userId ref when user changes
  useEffect(() => {
    userId.current = user?.id;
  }, [user?.id]);

  // Setup consistent batch processing interval
  useEffect(() => {
    updateInterval.current = setInterval(processPendingUpdates, BATCH_UPDATE_INTERVAL);

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
      // Process any remaining updates before unmounting
      // Using void to explicitly handle the Promise
      void (async () => {
        try {
          await processPendingUpdates();
        } catch (error) {
          console.error('Error processing final updates:', error);
        }
      })();
    };
  }, [processPendingUpdates]);

  const trackVideoMetrics = useCallback(async (
    videoId: string, 
    status: AVPlaybackStatus,
    prevStatus?: AVPlaybackStatus
  ) => {
    if (!status.isLoaded || !userId.current) {
      return;
    }

    const positionMillis = status.positionMillis || 0;
    const durationMillis = status.durationMillis || 0;

    // Calculate watch metrics using helper function
    const { watchedSeconds, completed, watchPercent } = calculateWatchMetrics(
      positionMillis,
      durationMillis
    );

    // Track video start/replay with simplified logic
    if (!prevStatus?.isLoaded && status.isLoaded) {
      videoStarts.current[videoId] = (videoStarts.current[videoId] || 0) + 1;
      // Reset completion logging when video starts
      hasLoggedCompletion.current.delete(videoId);
      console.log('Video started:', videoId);
    }

    // Track new view with simplified atomic operation
    if (!viewedVideos.current.has(videoId)) {
      viewedVideos.current.add(videoId);
      try {
        await supabase.rpc('increment_video_views', { video_id: videoId });
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    }

    // Only track significant updates
    const shouldTrack = 
      completed || 
      !prevStatus?.isLoaded || 
      Math.abs((prevStatus?.positionMillis || 0) - positionMillis) >= 5000;

    if (!shouldTrack) {
      return;
    }

    // Log completion events only once per video session
    if (
      completed && 
      !hasLoggedCompletion.current.has(videoId) &&
      !pendingUpdates.current.some(u => u.videoId === videoId && u.completed)
    ) {
      console.log('Video completed:', videoId);
      hasLoggedCompletion.current.add(videoId);
    }

    // Add update to queue
    pendingUpdates.current.push({
      videoId,
      watchedSeconds,
      lastPosition: positionMillis,
      completed,
      watchPercent
    });
  }, []); // No dependencies needed as we use refs

  return { trackVideoMetrics };
} 


