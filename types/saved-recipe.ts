import { VideoStatus } from '@prisma/client';

export interface RecipeMetadata {
  id: string;
  cookingTime: number;
  difficulty: string;
  cuisine: string;
  servings: number;
  calories: number | null;
  equipment: string[];
  dietaryTags: string[];
  ingredients: string[];
  steps: { timestamp: number; description: string; }[];
}

export interface Creator {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Video {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  status: string;
  isPrivate: boolean;
  creator: Creator | null;
  recipeMetadata: RecipeMetadata | null;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  videoId: string;
  savedAt: Date;
  video: Video | null;
} 