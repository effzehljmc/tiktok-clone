import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { RecipeVariation } from '@/services/recipeVariations';

interface ShoppingListItem {
  id: string;
  user_id: string;
  ingredient: string;
  quantity?: string;
  unit?: string;
  is_checked: boolean;
  recipe_id?: string;
  variation_id?: string;
  notes?: string;
  is_substitution: boolean;
  created_at: string;
  updated_at: string;
  recipe?: {
    title: string;
    id: string;
  };
  variation?: RecipeVariation;
}

interface AddShoppingListItem {
  ingredient: string;
  quantity?: string;
  unit?: string;
  recipe_id?: string;
  variation_id?: string;
  notes?: string;
  is_substitution?: boolean;
}

// Common units for ingredient measurements
const COMMON_UNITS = [
  'cup', 'cups',
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces',
  'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms',
  'ml', 'milliliter', 'milliliters',
  'l', 'liter', 'liters',
  'lb', 'pound', 'pounds',
  'piece', 'pieces',
  'slice', 'slices',
  'can', 'cans',
  'pinch', 'pinches'
];

function parseIngredient(ingredientString: string): { ingredient: string; quantity?: string; unit?: string } {
  // Remove leading/trailing spaces and multiple spaces
  const cleaned = ingredientString.trim().replace(/\s+/g, ' ');
  
  // Try to match pattern: [quantity] [unit] ingredient
  // This regex matches:
  // - Optional number (including fractions and decimals)
  // - Optional unit from our common units
  // - The rest is considered the ingredient
  const regex = new RegExp(`^(?:(\\d+(?:/\\d+)?(?:\\.\\d+)?)\\s*)?(?:(${COMMON_UNITS.join('|')})\\s+)?(.+)$`, 'i');
  
  const match = cleaned.match(regex);
  if (!match) {
    return { ingredient: cleaned };
  }

  const [, quantity, unit, ingredient] = match;

  return {
    quantity: quantity || '1', // Default to '1' if no quantity specified
    unit: unit?.toLowerCase(), // Normalize unit to lowercase
    ingredient: ingredient.trim()
  };
}

export function useShoppingList(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['shoppingList', userId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_list')
        .select(`
          *,
          recipe:videos!recipe_id (
            id,
            title
          ),
          variation:recipe_variations!variation_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShoppingListItem[];
    },
    enabled: !!userId,
  });

  const addMutation = useMutation({
    mutationFn: async (newItems: AddShoppingListItem[]) => {
      const parsedItems = newItems.map(item => {
        // If quantity and unit are already provided, use them
        if (item.quantity || item.unit) {
          return item;
        }
        
        // Otherwise, try to parse them from the ingredient string
        const parsed = parseIngredient(item.ingredient);
        return {
          ...item,
          ...parsed,
        };
      });

      const { error } = await supabase
        .from('shopping_list')
        .insert(
          parsedItems.map(item => ({
            user_id: userId,
            ingredient: item.ingredient,
            quantity: item.quantity || '1',
            unit: item.unit || null,
            recipe_id: item.recipe_id || null,
            variation_id: item.variation_id || null,
            notes: item.notes || null,
            is_substitution: item.is_substitution || false,
            is_checked: false,
          }))
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const item = query.data?.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      const { error } = await supabase
        .from('shopping_list')
        .update({ is_checked: !item.is_checked })
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      itemId, 
      updates 
    }: { 
      itemId: string; 
      updates: Partial<Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>> 
    }) => {
      const { error } = await supabase
        .from('shopping_list')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteCheckedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('user_id', userId)
        .eq('is_checked', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addToList: addMutation.mutate,
    toggleItem: toggleMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    deleteCheckedItems: deleteCheckedMutation.mutate,
    // Mutation states for UI feedback
    isAdding: addMutation.isPending,
    isToggling: toggleMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeletingChecked: deleteCheckedMutation.isPending,
    // Helper functions
    getItemsByRecipe: (recipeId: string) => 
      query.data?.filter(item => item.recipe_id === recipeId) || [],
    getItemsByVariation: (variationId: string) => 
      query.data?.filter(item => item.variation_id === variationId) || [],
    getSubstitutions: () => 
      query.data?.filter(item => item.is_substitution) || [],
  };
} 