import { supabase } from '@/utils/supabase';
import { useQuery } from '@tanstack/react-query';

export interface Video {
  id: string;
  url: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  isPrivate: boolean;
  status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
}

export function useVideos() {
  return useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      // Berechne Timestamp für 24 Stunden zurück
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          creator:User(id, username, image)
        `)
        .eq('status', 'PUBLISHED')
        .eq('is_private', false)
        .gte('created_at', last24Hours.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw new Error('Failed to fetch videos');
      }

      return data?.map(video => ({
        id: video.id,
        url: video.video_url,
        title: video.title,
        caption: video.description,
        thumbnailUrl: video.thumbnail_url,
        createdAt: video.created_at,
        creator: {
          id: video.creator.id,
          username: video.creator.username,
          avatarUrl: video.creator.image,
        },
        likes: video.likes_count || 0,
        comments: video.comments_count || 0,
        shares: video.views_count || 0,
        isPrivate: video.is_private,
        status: video.status,
      })) || [];
    },
    // React Query Caching-Optionen
    staleTime: 5 * 60 * 1000,     // Daten sind 5 Minuten "frisch"
    gcTime: 10 * 60 * 1000,       // Unbenutzte Videos nach 10 Minuten aus Cache entfernen
    refetchOnMount: true,         // Neu laden beim Mounten
    refetchOnWindowFocus: true,   // Neu laden wenn Tab/App fokussiert wird
    refetchInterval: false,       // Kein automatisches Polling
    retry: 2,                     // Maximal 2 Retry-Versuche bei Fehlern
  });
} 