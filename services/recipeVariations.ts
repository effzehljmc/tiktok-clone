import { prisma } from '../lib/prisma';

export interface RecipeVariationInput {
  userId: string;
  recipeId: string;
  title?: string;
  ingredients: string[];
  equipment: string[];
  steps: { timestamp: number; description: string }[];
  aiPrompt: string;
  originalPrompt: string;
}

export async function createRecipeVariation(input: RecipeVariationInput) {
  return await prisma.recipeVariation.create({
    data: {
      userId: input.userId,
      recipeId: input.recipeId,
      title: input.title,
      ingredients: input.ingredients,
      equipment: input.equipment,
      steps: input.steps,
      aiPrompt: input.aiPrompt,
      originalPrompt: input.originalPrompt,
    },
    include: {
      recipe: true,
    },
  });
}

export async function getRecipeVariations(recipeId: string, userId: string) {
  return await prisma.recipeVariation.findMany({
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
}

export async function deleteRecipeVariation(id: string, userId: string) {
  return await prisma.recipeVariation.delete({
    where: {
      id,
      userId, // Ensure user owns the variation
    },
  });
} 