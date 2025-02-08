import { VideoStatus } from '@prisma/client';

interface Creator {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  status: VideoStatus;
  isPrivate: boolean;
  creator: Creator | null;
  recipeMetadata: {
    cookingTime: number;
    difficulty: string;
    cuisine: string;
    servings: number;
    calories: number | null;
    equipment: string[];
    dietaryTags: string[];
    ingredients: string[];
    steps: {
      timestamp: number;
      description: string;
    }[];
  } | null;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  videoId: string;
  savedAt: Date;
  video: Video | null;
} 