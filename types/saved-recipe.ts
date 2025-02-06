import { VideoStatus } from '@prisma/client';

interface Creator {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  status: VideoStatus;
  isPrivate: boolean;
  creator: Creator | null;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  videoId: string;
  savedAt: Date;
  video: Video | null;
} 