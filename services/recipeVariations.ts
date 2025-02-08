import { prisma } from '../lib/prisma';
import type { RecipeMetadata, Prisma } from '@prisma/client';
import { supabase } from '@/utils/supabase';

export type VariationType = 'DIETARY' | 'INGREDIENT_SUBSTITUTION' | 'PORTION_ADJUSTMENT' | 'COOKING_METHOD' | 'FLAVOR_PROFILE';

export type RecipeVariation = {
  id: string;
  userId: string;
  recipeId: string;
  title: string | null;
  ingredients: string[];
  equipment: string[];
  steps: { timestamp: number; description: string }[];
  createdAt: Date;
  aiPrompt: string;
  originalPrompt: string;
  variationType: VariationType;
  metadata: any | null;
  recipe: RecipeMetadata;
};

export interface RecipeVariationInput {
  userId: string;
  recipeId: string;
  title?: string;
  ingredients: string[];
  equipment: string[];
  steps: { timestamp: number; description: string }[];
  aiPrompt: string;
  originalPrompt: string;
  variationType: VariationType;
  metadata?: {
    servings?: number;
    dietaryRestrictions?: string[];
    substitutedIngredients?: { original: string; replacement: string }[];
    cookingMethod?: string;
    flavorProfile?: string[];
  };
}

export interface VariationDiff {
  ingredients: {
    added: string[];
    removed: string[];
    modified: { original: string; new: string }[];
  };
  equipment: {
    added: string[];
    removed: string[];
  };
  steps: {
    added: { index: number; step: string }[];
    removed: { index: number; step: string }[];
    modified: { index: number; original: string; new: string }[];
  };
}

export async function createRecipeVariation(input: RecipeVariationInput): Promise<RecipeVariation> {
  return await prisma.$transaction(async (tx) => {
    return (tx as any).recipeVariation.create({
      data: {
        userId: input.userId,
        recipeId: input.recipeId,
        title: input.title,
        ingredients: input.ingredients,
        equipment: input.equipment,
        steps: input.steps,
        aiPrompt: input.aiPrompt,
        originalPrompt: input.originalPrompt,
        variationType: input.variationType,
        metadata: input.metadata as any,
      },
      include: {
        recipe: true,
      },
    });
  });
}

export async function getRecipeVariations(recipeId: string, userId: string): Promise<RecipeVariation[]> {
  console.log('Fetching recipe variations:', {
    recipeId,
    userId
  });

  try {
    // First, get the recipe metadata ID using the video ID
    console.log('Fetching recipe metadata for video:', recipeId);
    const { data: recipeMetadata, error: recipeError } = await supabase
      .from('recipe_metadata')
      .select('id')
      .eq('video_id', recipeId)
      .single();

    if (recipeError) {
      console.error('Error fetching recipe metadata:', {
        error: recipeError,
        videoId: recipeId
      });
      throw recipeError;
    }

    if (!recipeMetadata) {
      console.error('Recipe metadata not found:', {
        videoId: recipeId
      });
      throw new Error('Recipe metadata not found for video');
    }

    console.log('Found recipe metadata:', {
      metadataId: recipeMetadata.id,
      videoId: recipeId
    });

    // Now fetch variations using the recipe metadata ID
    console.log('Fetching variations from database:', {
      userId,
      recipeMetadataId: recipeMetadata.id
    });

    const { data: variations, error } = await supabase
      .from('recipe_variations')
      .select(`
        *,
        recipe:recipe_metadata (*)
      `)
      .eq('recipe_id', recipeMetadata.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching variations:', {
        error,
        userId,
        recipeId: recipeMetadata.id
      });
      throw error;
    }

    console.log('Successfully fetched variations:', {
      count: variations?.length || 0,
      userId,
      recipeId: recipeMetadata.id
    });

    return (variations || []).map(variation => ({
      id: variation.id,
      userId: variation.user_id,
      recipeId: variation.recipe_id,
      title: variation.title,
      ingredients: variation.ingredients,
      equipment: variation.equipment,
      steps: variation.steps,
      createdAt: new Date(variation.created_at),
      aiPrompt: variation.ai_prompt,
      originalPrompt: variation.original_prompt,
      variationType: variation.variation_type,
      metadata: variation.metadata,
      recipe: variation.recipe,
    }));
  } catch (err) {
    console.error('Failed to fetch recipe variations:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      userId,
      recipeId
    });
    throw err;
  }
}

export async function getVariationHistory(recipeId: string, userId: string) {
  const variations = await prisma.$transaction(async (tx) => {
    return (tx as any).recipeVariation.findMany({
      where: {
        recipeId,
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        recipe: true,
      },
    });
  }) as RecipeVariation[];

  return variations.map((variation, index) => ({
    ...variation,
    isLatest: index === variations.length - 1,
    diff: index > 0 ? compareVariations(variations[index - 1], variation) : null,
  }));
}

export async function deleteRecipeVariation(id: string, userId: string): Promise<void> {
  console.log('Deleting recipe variation:', {
    variationId: id,
    userId
  });

  try {
    const { error } = await supabase
      .from('recipe_variations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the variation

    if (error) {
      console.error('Error deleting variation:', {
        error,
        variationId: id,
        userId
      });
      throw error;
    }

    console.log('Successfully deleted variation:', {
      variationId: id,
      userId
    });
  } catch (err) {
    console.error('Failed to delete recipe variation:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      variationId: id,
      userId
    });
    throw err;
  }
}

export async function revertToOriginal(recipeId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // Delete all variations for this recipe
    await (tx as any).recipeVariation.deleteMany({
      where: {
        recipeId,
        userId,
      },
    });

    // Return the original recipe
    return (tx as any).recipeMetadata.findUnique({
      where: {
        id: recipeId,
      },
      include: {
        video: true,
      },
    });
  });
}

function compareVariations(
  oldVersion: RecipeVariation,
  newVersion: RecipeVariation
): VariationDiff {
  const diff: VariationDiff = {
    ingredients: {
      added: [],
      removed: [],
      modified: [],
    },
    equipment: {
      added: [],
      removed: [],
    },
    steps: {
      added: [],
      removed: [],
      modified: [],
    },
  };

  // Compare ingredients
  const oldIngredients = new Set<string>(oldVersion.ingredients);
  const newIngredients = new Set<string>(newVersion.ingredients);

  diff.ingredients.added = Array.from(newIngredients).filter(i => !oldIngredients.has(i));
  diff.ingredients.removed = Array.from(oldIngredients).filter(i => !newIngredients.has(i));

  // Compare equipment
  const oldEquipment = new Set<string>(oldVersion.equipment);
  const newEquipment = new Set<string>(newVersion.equipment);

  diff.equipment.added = Array.from(newEquipment).filter(e => !oldEquipment.has(e));
  diff.equipment.removed = Array.from(oldEquipment).filter(e => !newEquipment.has(e));

  // Compare steps
  const oldSteps = oldVersion.steps as { timestamp: number; description: string }[];
  const newSteps = newVersion.steps as { timestamp: number; description: string }[];

  oldSteps.forEach((step, index) => {
    if (index >= newSteps.length) {
      diff.steps.removed.push({ index, step: step.description });
    } else if (step.description !== newSteps[index].description) {
      diff.steps.modified.push({
        index,
        original: step.description,
        new: newSteps[index].description,
      });
    }
  });

  newSteps.slice(oldSteps.length).forEach((step, index) => {
    diff.steps.added.push({
      index: oldSteps.length + index,
      step: step.description,
    });
  });

  return diff;
}

export async function getVariationsByType(
  recipeId: string,
  userId: string,
  variationType: VariationType
): Promise<RecipeVariation[]> {
  return await prisma.$transaction(async (tx) => {
    return (tx as any).recipeVariation.findMany({
      where: {
        recipeId,
        userId,
        variationType,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        recipe: true,
      },
    });
  });
}

export async function getLatestVariation(recipeId: string, userId: string): Promise<RecipeVariation | null> {
  return await prisma.$transaction(async (tx) => {
    return (tx as any).recipeVariation.findFirst({
      where: {
        recipeId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        recipe: true,
      },
    });
  });
}

export async function saveRecipeVariation(input: RecipeVariationInput): Promise<RecipeVariation> {
  console.log('Starting saveRecipeVariation:', {
    userId: input.userId,
    recipeId: input.recipeId,
    title: input.title,
    variationType: input.variationType
  });

  try {
    // First, get the recipe metadata ID using the video ID
    console.log('Fetching recipe metadata for video:', input.recipeId);
    const { data: recipeMetadata, error: recipeError } = await supabase
      .from('recipe_metadata')
      .select('id')
      .eq('video_id', input.recipeId)
      .single();

    if (recipeError) {
      console.error('Error fetching recipe metadata:', {
        error: recipeError,
        videoId: input.recipeId
      });
      throw recipeError;
    }

    if (!recipeMetadata) {
      console.error('Recipe metadata not found:', {
        videoId: input.recipeId
      });
      throw new Error('Recipe metadata not found for video');
    }

    console.log('Found recipe metadata:', {
      metadataId: recipeMetadata.id,
      videoId: input.recipeId
    });

    // Now save the variation using the recipe metadata ID
    console.log('Saving variation to database:', {
      userId: input.userId,
      recipeMetadataId: recipeMetadata.id,
      variationType: input.variationType
    });

    const { data: variation, error } = await supabase
      .from('recipe_variations')
      .insert([{
        user_id: input.userId,
        recipe_id: recipeMetadata.id,
        title: input.title,
        ingredients: input.ingredients,
        equipment: input.equipment,
        steps: input.steps,
        ai_prompt: input.aiPrompt,
        original_prompt: input.originalPrompt,
        variation_type: input.variationType,
        metadata: input.metadata || null,
      }])
      .select(`
        *,
        recipe:recipe_metadata (*)
      `)
      .single();

    if (error) {
      console.error('Error saving variation:', {
        error,
        userId: input.userId,
        recipeId: recipeMetadata.id
      });
      throw error;
    }

    if (!variation) {
      console.error('No variation returned after insert');
      throw new Error('No variation returned after insert');
    }

    console.log('Successfully saved variation:', {
      variationId: variation.id,
      userId: variation.user_id,
      recipeId: variation.recipe_id
    });

    return {
      id: variation.id,
      userId: variation.user_id,
      recipeId: variation.recipe_id,
      title: variation.title,
      ingredients: variation.ingredients,
      equipment: variation.equipment,
      steps: variation.steps,
      createdAt: new Date(variation.created_at),
      aiPrompt: variation.ai_prompt,
      originalPrompt: variation.original_prompt,
      variationType: variation.variation_type,
      metadata: variation.metadata,
      recipe: variation.recipe,
    };
  } catch (err) {
    console.error('Failed to save recipe variation:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      userId: input.userId,
      recipeId: input.recipeId
    });
    throw err;
  }
} 