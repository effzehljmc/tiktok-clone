import { supabase } from '@/utils/supabase';
import { RecipeVariation } from './recipeVariations';
import { Recipe } from '@/types/recipe';

export interface ShoppingListItem {
  id: string;
  userId: string;
  recipeId: string;
  variationId?: string;
  ingredient: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  isSubstitution: boolean;
}

export interface AddToListInput {
  userId: string;
  recipeId: string;
  variationId?: string;
  ingredients: Array<{
    ingredient: string;
    quantity?: number;
    unit?: string;
    isSubstitution?: boolean;
    notes?: string;
  }>;
}

export async function addToList({ userId, recipeId, variationId, ingredients }: AddToListInput) {
  console.log('Adding to shopping list:', {
    userId,
    recipeId,
    variationId,
    ingredientCount: ingredients.length
  });

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert(
      ingredients.map(item => ({
        user_id: userId,
        recipe_id: recipeId,
        variation_id: variationId,
        ingredient: item.ingredient,
        quantity: item.quantity,
        unit: item.unit,
        is_substitution: item.isSubstitution || false,
        notes: item.notes
      }))
    )
    .select();

  if (error) {
    console.error('Error adding to shopping list:', error);
    throw error;
  }

  return data;
}

export async function diffIngredients(original: Recipe, variation: RecipeVariation) {
  const originalSet = new Set(original.recipeMetadata?.ingredients || []);
  const variationSet = new Set(variation.ingredients);

  return {
    added: variation.ingredients.filter(i => !originalSet.has(i)),
    removed: original.recipeMetadata?.ingredients.filter(i => !variationSet.has(i)) || [],
    modified: [] // To be enhanced with quantity/unit comparison
  };
}

export async function getShoppingList(userId: string) {
  console.log('Fetching shopping list for user:', userId);

  const { data, error } = await supabase
    .from('shopping_list_items')
    .select(`
      *,
      recipe:recipe_metadata!recipe_id (*),
      variation:recipe_variations!variation_id (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shopping list:', error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    recipeId: item.recipe_id,
    variationId: item.variation_id,
    ingredient: item.ingredient,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes,
    isSubstitution: item.is_substitution,
    recipe: item.recipe,
    variation: item.variation
  }));
}

export async function updateShoppingListItem(
  itemId: string,
  userId: string,
  updates: Partial<ShoppingListItem>
) {
  console.log('Updating shopping list item:', {
    itemId,
    userId,
    updates
  });

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({
      quantity: updates.quantity,
      unit: updates.unit,
      notes: updates.notes,
      is_substitution: updates.isSubstitution
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error updating shopping list item:', error);
    throw error;
  }

  return data[0];
}

export async function removeFromList(itemId: string, userId: string) {
  console.log('Removing item from shopping list:', {
    itemId,
    userId
  });

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing from shopping list:', error);
    throw error;
  }
}

export async function clearShoppingList(userId: string) {
  console.log('Clearing shopping list for user:', userId);

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing shopping list:', error);
    throw error;
  }
} 