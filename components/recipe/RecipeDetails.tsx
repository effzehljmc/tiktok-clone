import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import Toast from 'react-native-toast-message';
import { Recipe } from '@/types/recipe';
import { RecipeChat } from './RecipeChat';
import { Video } from '@/types/saved-recipe';
import { RecipeVariation } from '@/services/recipeVariations';

interface RecipeDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  recipe: Video;
}

export function RecipeDetails({ isVisible, onClose, recipe }: RecipeDetailsProps) {
  const { user } = useAuth();
  const { addToList, isAdding } = useShoppingList(user?.id || '');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<RecipeVariation | null>(null);
  
  const handleAddToShoppingList = async () => {
    if (!user) return;
    
    try {
      console.log('Adding to shopping list:', {
        userId: user.id,
        recipeId: recipe.id,
        ingredients: recipe.recipeMetadata?.ingredients,
        hasVariation: !!selectedVariation
      });

      const items = recipe.recipeMetadata?.ingredients.map(ingredient => ({
        ingredient,
        recipe_id: recipe.id,
        variation_id: selectedVariation?.id,
        is_substitution: false,
        notes: selectedVariation ? `From ${selectedVariation.variationType.toLowerCase()} variation` : undefined
      })) || [];

      // If we have a variation, add any substituted ingredients
      if (selectedVariation) {
        const originalIngredients = new Set(recipe.recipeMetadata?.ingredients || []);
        const variationIngredients = new Set(selectedVariation.ingredients);

        // Add new ingredients from variation as substitutions
        selectedVariation.ingredients
          .filter(ingredient => !originalIngredients.has(ingredient))
          .forEach(ingredient => {
            items.push({
              ingredient,
              recipe_id: recipe.id,
              variation_id: selectedVariation.id,
              is_substitution: true,
              notes: `Added in ${selectedVariation.variationType.toLowerCase()} variation`
            });
          });
      }

      await addToList(items);
      
      Toast.show({
        type: 'success',
        text1: 'Added to shopping list',
        text2: selectedVariation 
          ? 'Variation ingredients added to your shopping list'
          : 'All ingredients have been added to your shopping list'
      });
    } catch (error) {
      console.error('Failed to add to shopping list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add ingredients to shopping list'
      });
    }
  };
  
  const handleChatPress = () => {
    console.log('Opening chat for recipe:', {
      recipeId: recipe.id,
      title: recipe.title,
      hasMetadata: !!recipe.recipeMetadata
    });
    setIsChatVisible(true);
  };

  const handleVariationCreated = (variation: RecipeVariation) => {
    console.log('Variation created for recipe:', {
      recipeId: recipe.id,
      title: recipe.title,
      variationId: variation.id,
      variationType: variation.variationType
    });
    setSelectedVariation(variation);
    Toast.show({
      type: 'success',
      text1: 'Variation Created',
      text2: 'Added to your shopping list'
    });
  };

  console.log('Rendering RecipeDetails:', {
    recipeId: recipe.id,
    title: recipe.title,
    hasUser: !!user,
    userId: user?.id,
    hasMetadata: !!recipe.recipeMetadata,
    ingredientsCount: recipe.recipeMetadata?.ingredients.length
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Title Bar */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-2xl font-bold flex-shrink-0 mr-4">
            {selectedVariation ? selectedVariation.title || 'Recipe Variation' : 'Recipe Details'}
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Controls Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2 border-b border-gray-100"
        >
          <View className="flex-row items-center gap-3">
            {user && (
              <>
                <TouchableOpacity 
                  className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full"
                  onPress={handleAddToShoppingList}
                  disabled={isAdding}
                >
                  <Ionicons 
                    name="cart-outline" 
                    size={20} 
                    color={isAdding ? "#999" : "#000"} 
                  />
                  <Text className="ml-2 text-sm font-medium text-gray-900">
                    Add to Cart
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full">
                  <SaveButton 
                    videoId={recipe.id} 
                    userId={user.id} 
                    size={20}
                  />
                  <Text className="ml-2 text-sm font-medium text-gray-900">
                    Save
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full"
              onPress={() => setIsChatVisible(true)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="black" />
              <Text className="ml-2 text-sm font-medium text-gray-900">
                Variations
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Main Content */}
        <ScrollView className="flex-1 p-4">
          {selectedVariation && (
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <Text className="text-blue-800 font-medium">
                Viewing {selectedVariation.variationType.toLowerCase()} variation
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedVariation(null)}
                className="mt-2 bg-blue-100 py-2 px-4 rounded-lg"
              >
                <Text className="text-blue-800 text-center">Back to Original Recipe</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-xl font-bold mb-3">Ingredients</Text>
            {(selectedVariation?.ingredients || recipe.recipeMetadata?.ingredients || []).map((ingredient, index) => (
              <Text key={index} className="text-gray-700 mb-1">• {ingredient}</Text>
            ))}
          </View>

          <View className="mb-6">
            <Text className="text-xl font-bold mb-3">Equipment Needed</Text>
            {(selectedVariation?.equipment || recipe.recipeMetadata?.equipment || []).map((item, index) => (
              <Text key={index} className="text-gray-700 mb-1">• {item}</Text>
            ))}
          </View>

          <View>
            <Text className="text-xl font-bold mb-3">Steps</Text>
            {(selectedVariation?.steps || recipe.recipeMetadata?.steps || []).map((step, index) => (
              <View key={index} className="mb-4">
                <Text className="text-lg font-semibold mb-2">{index + 1}.</Text>
                <Text className="text-gray-700">{step.description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <RecipeChat 
          isVisible={isChatVisible}
          onClose={() => setIsChatVisible(false)}
          recipe={recipe}
          onVariationCreated={handleVariationCreated}
        />
      </View>
    </Modal>
  );
} 