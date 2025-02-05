import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { VideoType } from '../types/video';
import { VideoCategory } from '@prisma/client';

// Commenting out OpenAI embedding related code
// const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
// console.log('OpenAI API Key available:', !!apiKey, 'Length:', apiKey.length);

// async function generateEmbedding(text: string): Promise<number[]> {
//   const response = await fetch('https://api.openai.com/v1/embeddings', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${apiKey}`
//     },
//     body: JSON.stringify({
//       model: "text-embedding-3-small",
//       input: text.trim(),
//       dimensions: 384,
//     })
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
//   }

//   const data = await response.json();
//   return data.data[0].embedding;
// }

interface SearchResult extends VideoType {
  search_rank?: number;
}

interface RawSearchResult {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  is_private: boolean;
  creator_id: string;
  category: VideoCategory | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface UseVideoSearchProps {
  query: string;
  category?: VideoCategory;
  dietaryPreference?: string;
  enabled?: boolean;
}

export function useVideoSearch({ query, category, dietaryPreference, enabled = true }: UseVideoSearchProps) {
  const PAGE_SIZE = 20;

  return useInfiniteQuery<SearchResult[]>({
    queryKey: ['videoSearch', query, category, dietaryPreference],
    queryFn: async ({ pageParam }) => {
      console.log('Search params:', { query, category, dietaryPreference, pageParam });
      
      try {
        const searchParams = {
          search_query: query?.trim() || '',
          category_filter: category,
          dietary_preference: dietaryPreference,
          limit_val: PAGE_SIZE,
          offset_val: (pageParam as number) * PAGE_SIZE
        };
        
        console.log('Calling search_videos with:', searchParams);

        const { data: searchResults, error: searchError } = await supabase.rpc('search_videos', searchParams);

        if (searchError) {
          console.error('Search error:', searchError);
          throw new Error(searchError.message);
        }

        if (!searchResults?.length) {
          console.log('No search results found');
          return [];
        }

        // Then get the creator information for these videos
        const creatorIds = [...new Set(searchResults.map((video: RawSearchResult) => video.creator_id))];
        console.log('Fetching creators for IDs:', creatorIds);

        const { data: creators, error: creatorsError } = await supabase
          .from('User')
          .select('id, username, email')
          .in('id', creatorIds);

        if (creatorsError) {
          console.error('Error fetching creators:', creatorsError);
          // Continue with placeholder creator info
          return searchResults.map((video: RawSearchResult) => ({
            id: video.id,
            title: video.title,
            description: video.description || undefined,
            videoUrl: video.video_url,
            thumbnailUrl: video.thumbnail_url || undefined,
            duration: video.duration || undefined,
            viewsCount: video.views_count,
            likesCount: video.likes_count,
            commentsCount: video.comments_count,
            status: video.status,
            isPrivate: video.is_private,
            creatorId: video.creator_id,
            category: video.category,
            tags: video.tags,
            createdAt: video.created_at,
            updatedAt: video.updated_at,
            creator: {
              id: video.creator_id,
              username: 'Unknown User',
              email: ''
            }
          }));
        }

        // Map creators to a lookup object
        const creatorMap = new Map(creators?.map(creator => [creator.id, creator]));

        // Combine the data and transform to match VideoType structure
        const transformedResults = searchResults.map((video: RawSearchResult) => {
          const creator = creatorMap.get(video.creator_id);
          
          return {
            id: video.id,
            title: video.title,
            description: video.description || undefined,
            videoUrl: video.video_url,
            thumbnailUrl: video.thumbnail_url || undefined,
            duration: video.duration || undefined,
            viewsCount: video.views_count,
            likesCount: video.likes_count,
            commentsCount: video.comments_count,
            status: video.status,
            isPrivate: video.is_private,
            creatorId: video.creator_id,
            category: video.category,
            tags: video.tags,
            createdAt: video.created_at,
            updatedAt: video.updated_at,
            creator: creator || {
              id: video.creator_id,
              username: 'Unknown User',
              email: ''
            }
          };
        });

        console.log('Transformed results:', transformedResults.length, 'videos');
        return transformedResults;
      } catch (error) {
        console.error('Search failed:', error);
        throw error;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: enabled && (!!query?.trim() || !!category || !!dietaryPreference),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
} 
