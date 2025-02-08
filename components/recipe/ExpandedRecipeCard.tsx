import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import { Video } from '@/types/saved-recipe';
import { RecipeChat } from './RecipeChat';
import Toast from 'react-native-toast-message';
import { getRecipeVariations, type RecipeVariation, deleteRecipeVariation } from '@/services/recipeVariations';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ExpandedRecipeCardProps {
  recipe: Video;
  onClose: () => void;
}

interface RecipeContent {
  title: string | null;
  ingredients: string[];
  equipment: string[];
  steps: { timestamp: number; description: string }[];
}

export function ExpandedRecipeCard({ recipe, onClose }: ExpandedRecipeCardProps) {
  const { user } = useAuth();
  const { addToList, isAdding } = useShoppingList(user?.id || '');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [variations, setVariations] = useState<RecipeVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<RecipeVariation | null>(null);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [showVariationHistory, setShowVariationHistory] = useState(false);

  // Load variations when component mounts
  useEffect(() => {
    if (user && recipe.id) {
      loadVariations();
    }
  }, [user, recipe.id]);

  const loadVariations = async () => {
    if (!user || !recipe.id) return;
    
    setIsLoadingVariations(true);
    try {
      const recipeVariations = await getRecipeVariations(recipe.id, user.id);
      setVariations(recipeVariations);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load recipe variations'
      });
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const handleAddToShoppingList = async () => {
    if (!user) return;
    
    try {
      const currentIngredients = selectedVariation?.ingredients || recipe.recipeMetadata?.ingredients || [];
      await addToList(
        currentIngredients.map((ingredient: string) => ({
          ingredient,
          recipe_id: recipe.id
        }))
      );
      Toast.show({
        type: 'success',
        text1: 'Added to shopping list',
        text2: 'All ingredients have been added to your shopping list'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add ingredients to shopping list'
      });
    }
  };

  const handleVariationSelect = (variation: RecipeVariation | null) => {
    setSelectedVariation(variation);
  };

  const getCurrentContent = (): RecipeContent => {
    if (selectedVariation) {
      return {
        title: selectedVariation.title,
        ingredients: selectedVariation.ingredients,
        equipment: selectedVariation.equipment,
        steps: selectedVariation.steps,
      };
    }
    return {
      title: recipe.title,
      ingredients: recipe.recipeMetadata?.ingredients || [],
      equipment: recipe.recipeMetadata?.equipment || [],
      steps: recipe.recipeMetadata?.steps || [],
    };
  };

  const content = getCurrentContent();

  return (
    <View className="flex-1 bg-gray-900 rounded-3xl overflow-hidden">
      {/* Header */}
      <View className="p-6 border-b border-gray-800">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-3xl font-bold text-white flex-1">
            {selectedVariation ? selectedVariation.title || 'Recipe Variation' : 'Recipe Details'}
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            className="bg-gray-800 rounded-full p-2"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {user && (
          <View className="flex-row items-center justify-between mt-2">
            <TouchableOpacity 
              onPress={handleAddToShoppingList}
              disabled={isAdding}
              className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full"
            >
              <Ionicons 
                name="cart-outline" 
                size={20} 
                color={isAdding ? "gray" : "white"} 
              />
              <Text className="ml-2 text-sm text-white">Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full">
              <SaveButton videoId={recipe.id} userId={user.id} size={20} />
              <Text className="ml-2 text-sm text-white">Save</Text>
            </TouchableOpacity>
            {variations.length > 0 && (
              <TouchableOpacity 
                onPress={() => setShowVariationHistory(!showVariationHistory)}
                className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full"
              >
                <Ionicons 
                  name="git-branch-outline" 
                  size={20} 
                  color="white" 
                />
                <Text className="ml-2 text-sm text-white">Variations</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setIsChatVisible(true)}
              className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full"
            >
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text className="ml-2 text-sm text-white">Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {/* Variations Panel */}
        {showVariationHistory && variations.length > 0 && (
          <Animated.View 
            entering={FadeIn}
            exiting={FadeOut}
            className="bg-gray-800 p-6 border-b border-gray-700"
          >
            <Text className="text-lg font-semibold mb-4 text-white">Variations</Text>
            {isLoadingVariations ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => handleVariationSelect(null)}
                  className={`mr-2 px-4 py-2 rounded-full ${!selectedVariation ? 'bg-blue-500' : 'bg-gray-700'}`}
                >
                  <Text className="text-white">
                    Original
                  </Text>
                </TouchableOpacity>
                {variations.map((variation) => (
                  <View key={variation.id} className="flex-row items-center mr-2">
                    <TouchableOpacity
                      onPress={() => handleVariationSelect(variation)}
                      className={`px-4 py-2 rounded-l-full ${selectedVariation?.id === variation.id ? 'bg-blue-500' : 'bg-gray-700'}`}
                    >
                      <Text className="text-white">
                        {variation.variationType.split('_').map((word: string) => 
                          word.charAt(0) + word.slice(1).toLowerCase()
                        ).join(' ')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Delete Variation',
                          'Are you sure you want to delete this variation?',
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  if (!user) return;
                                  await deleteRecipeVariation(variation.id, user.id);
                                  if (selectedVariation?.id === variation.id) {
                                    handleVariationSelect(null);
                                  }
                                  loadVariations();
                                  Toast.show({
                                    type: 'success',
                                    text1: 'Variation deleted successfully'
                                  });
                                } catch (error) {
                                  console.error('Failed to delete variation:', error);
                                  Toast.show({
                                    type: 'error',
                                    text1: 'Failed to delete variation'
                                  });
                                }
                              },
                            },
                          ]
                        );
                      }}
                      className={`px-3 py-2 rounded-r-full ${
                        selectedVariation?.id === variation.id ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={16} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}

        <View className="p-6">
          {/* Title */}
          <Text className="text-3xl font-bold mb-8 text-white">{content.title}</Text>

          {/* Ingredients */}
          <View className="mb-8">
            <Text className="text-2xl font-bold mb-4 text-white">Ingredients</Text>
            {content.ingredients?.map((ingredient, index) => (
              <View key={index} className="flex-row items-center mb-3 bg-gray-800 p-4 rounded-xl">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
                <Text className="text-lg text-gray-200">{ingredient}</Text>
              </View>
            ))}
          </View>

          {/* Equipment */}
          <View className="mb-8">
            <Text className="text-2xl font-bold mb-4 text-white">Equipment Needed</Text>
            {content.equipment?.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3 bg-gray-800 p-4 rounded-xl">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
                <Text className="text-lg text-gray-200">{item}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View className="mb-8">
            <Text className="text-2xl font-bold mb-4 text-white">Steps</Text>
            {content.steps?.map((step, index) => (
              <View key={index} className="mb-4 bg-gray-800 p-4 rounded-xl">
                <Text className="text-lg font-semibold mb-2 text-blue-400">{index + 1}.</Text>
                <Text className="text-lg text-gray-200">{step.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Minimize Button */}
      <TouchableOpacity 
        onPress={onClose}
        className="absolute bottom-6 right-6 bg-blue-500 rounded-full p-4 shadow-lg"
      >
        <Ionicons name="chevron-down" size={24} color="white" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <RecipeChat 
        isVisible={isChatVisible}
        onClose={() => {
          setIsChatVisible(false);
          loadVariations();
        }}
        recipe={recipe}
      />
    </View>
  );
} 
