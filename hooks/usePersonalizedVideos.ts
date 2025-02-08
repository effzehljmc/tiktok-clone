import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getPersonalizedFeed } from '@/services/personalized-feed';
import { PersonalizedVideo } from '@/services/recommendations';

interface UsePersonalizedVideosReturn {
  videos: PersonalizedVideo[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
}

export function usePersonalizedVideos(): UsePersonalizedVideosReturn {
  const { user } = useAuth();
  const [videos, setVideos] = useState<PersonalizedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  // Fetch initial videos
  const fetchInitialVideos = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getPersonalizedFeed(user.id);
      
      setVideos(response.videos);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch videos'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load more videos
  const loadMore = useCallback(async () => {
    if (!user || !hasMore || isLoading || !nextCursor) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await getPersonalizedFeed(user.id, nextCursor);
      
      setVideos(prev => [...prev, ...response.videos]);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more videos'));
    } finally {
      setIsLoading(false);
    }
  }, [user, hasMore, isLoading, nextCursor]);

  // Initial load
  useEffect(() => {
    fetchInitialVideos();
  }, [fetchInitialVideos]);

  return {
    videos,
    isLoading,
    hasMore,
    error,
    loadMore
  };
} 