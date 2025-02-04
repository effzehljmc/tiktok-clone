export interface VideoType {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  isPrivate: boolean;
  creatorId: string;
  creator: {
    id: string;
    username: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
} 