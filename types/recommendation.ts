import { Ionicons } from '@expo/vector-icons';
import { Video } from '@prisma/client';

/**
 * Represents a factor that contributed to a recommendation
 */
export interface RecommendationFactor {
  /** The type of factor that influenced the recommendation */
  type: 'dietary' | 'engagement' | 'ingredient' | 'similarity';
  /** The score (0-1) representing how much this factor contributed */
  score: number;
  /** Human-readable description of the factor's influence */
  description: string;
  /** Optional icon to display with the factor */
  icon?: keyof typeof Ionicons.glyphMap;
  /** i18n key for the description */
  i18n_key: string;
  /** Parameters for i18n string interpolation */
  i18n_params?: Record<string, string | number>;
}

/**
 * Represents the explanation for why a video was recommended
 */
export interface RecommendationExplanation {
  /** The primary reason for the recommendation */
  mainReason: string;
  /** Detailed breakdown of factors that led to the recommendation */
  factors: RecommendationFactor[];
  /** Optional detailed explanation with more context */
  detailedExplanation?: string;
}

/**
 * Extends the existing RecommendedVideo interface with explanation
 */
export interface RecommendedVideo extends Video {
  /** Score based on user preferences (0-1) */
  preference_score: number;
  /** Combined score from all factors (0-1) */
  total_score: number;
  /** Recipe-specific metadata */
  recipe_metadata: {
    ingredients: string[];
    cookingTime: number;
    difficulty: string;
    cuisine: string;
    servings: number;
    calories?: number;
    equipment: string[];
    dietaryTags: string[];
    steps: { timestamp: number; description: string }[];
  };
  /** Explanation for why this video was recommended */
  explanation: RecommendationExplanation;
}

/**
 * Icon mapping for different recommendation factor types
 */
export const RECOMMENDATION_FACTOR_ICONS: Record<RecommendationFactor['type'], keyof typeof Ionicons.glyphMap> = {
  dietary: 'nutrition-outline',
  engagement: 'time-outline',
  ingredient: 'restaurant-outline',
  similarity: 'thumbs-up-outline',
} as const;

/**
 * Helper function to get the appropriate icon for a factor type
 */
export function getFactorIcon(type: RecommendationFactor['type']): keyof typeof Ionicons.glyphMap {
  return RECOMMENDATION_FACTOR_ICONS[type];
} 