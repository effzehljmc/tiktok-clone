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
  retryCount: number;
}

export function useVideoMetrics() {
  const { user } = useUser();
  const viewedVideos = useRef<Set<string>>(new Set());
  const pendingUpdates = useRef<PendingUpdate[]>([]);
  const updateTimeout = useRef<NodeJS.Timeout>();
  const videoStarts = useRef<{ [key: string]: number }>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      // Process any remaining updates
      if (pendingUpdates.current.length > 0) {
        processPendingUpdates();
      }
    };
  }, []);

  // Process pending updates with retry logic
  const processPendingUpdates = useCallback(async () => {
    if (!user?.id || pendingUpdates.current.length === 0) {
      return;
    }

    const updates = [...pendingUpdates.current];
    pendingUpdates.current = [];

    for (const update of updates) {
      try {
        // First get current metrics to calculate new averages
        const { data: currentMetrics, error: fetchError } = await supabase
          .from('video_metrics')
          .select('average_watch_percent, replay_count')
          .match({ user_id: user.id, video_id: update.videoId })
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no record found
          throw fetchError;
        }

        const replayCount = (currentMetrics?.replay_count || 0) + (videoStarts.current[update.videoId] || 0);
        const currentAvg = currentMetrics?.average_watch_percent || 0;
        const newAvgPercent = currentMetrics 
          ? (currentAvg * replayCount + update.watchPercent) / (replayCount + 1)
          : update.watchPercent;

        const { error } = await supabase
          .from('video_metrics')
          .upsert({
            video_id: update.videoId,
            user_id: user.id,
            watched_seconds: update.watchedSeconds,
            last_position: update.lastPosition,
            completed: update.completed,
            replay_count: replayCount,
            average_watch_percent: newAvgPercent
          }, {
            onConflict: 'user_id,video_id',
            ignoreDuplicates: false
          });

        if (error) {
          throw error;
        }
        
        // Reset replay counter after successful update
        videoStarts.current[update.videoId] = 0;
      } catch (error) {
        console.error('Error updating metrics:', error);
        if (update.retryCount < 3) {
          pendingUpdates.current.push({
            ...update,
            retryCount: update.retryCount + 1
          });
        }
      }
    }

    if (pendingUpdates.current.length > 0) {
      updateTimeout.current = setTimeout(processPendingUpdates, 5000);
    }
  }, [user?.id]);

  const trackVideoMetrics = useCallback(async (
    videoId: string, 
    status: AVPlaybackStatus,
    prevStatus?: AVPlaybackStatus
  ) => {
    if (!status.isLoaded || !user?.id) {
      return;
    }

    const positionMillis = status.positionMillis || 0;
    const durationMillis = status.durationMillis || 0;
    const watchedSeconds = Math.floor(positionMillis / 1000);
    const completed = positionMillis >= (durationMillis * 0.9); // 90% watched = completed
    const watchPercent = durationMillis ? (positionMillis / durationMillis) * 100 : 0;

    // Track video start/replay
    if (!prevStatus?.isLoaded && status.isLoaded) {
      videoStarts.current[videoId] = (videoStarts.current[videoId] || 0) + 1;
      console.log('Video started:', videoId);
    }

    // Track new view
    if (!viewedVideos.current.has(videoId)) {
      viewedVideos.current.add(videoId);
      try {
        const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });
        if (error) {
          console.error('Error incrementing views:', error);
        }
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    }

    // Only track metrics every 5 seconds or when video completes
    const shouldTrack = 
      completed || 
      !prevStatus?.isLoaded || 
      Math.abs((prevStatus.positionMillis || 0) - positionMillis) >= 5000;

    if (!shouldTrack) {
      return;
    }

    // Only log significant events
    if (completed && !pendingUpdates.current.some(u => u.videoId === videoId && u.completed)) {
      console.log('Video completed:', videoId);
    }

    pendingUpdates.current.push({
      videoId,
      watchedSeconds,
      lastPosition: positionMillis,
      completed,
      watchPercent,
      retryCount: 0
    });

    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(processPendingUpdates, 1000);
  }, [user?.id, processPendingUpdates]);

  return { trackVideoMetrics };
} 