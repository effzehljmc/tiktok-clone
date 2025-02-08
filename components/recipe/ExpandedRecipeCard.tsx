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
    <View className="flex-1 bg-white rounded-3xl overflow-hidden">
      {/* Header */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-3xl font-bold flex-1">
            {selectedVariation ? selectedVariation.title || 'Recipe Variation' : 'Recipe Details'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
        </View>
        {user && (
          <View className="flex-row items-center gap-6 mt-2">
            <TouchableOpacity 
              onPress={handleAddToShoppingList}
              disabled={isAdding}
              className="flex-row items-center"
            >
              <Ionicons 
                name="cart-outline" 
                size={24} 
                color={isAdding ? "gray" : "black"} 
              />
              <Text className="ml-2 text-sm">Add to Cart</Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <SaveButton videoId={recipe.id} userId={user.id} size={24} />
              <Text className="ml-2 text-sm">Save</Text>
            </View>
            {variations.length > 0 && (
              <TouchableOpacity 
                onPress={() => setShowVariationHistory(!showVariationHistory)}
                className="flex-row items-center"
              >
                <Ionicons 
                  name="git-branch-outline" 
                  size={24} 
                  color="black" 
                />
                <Text className="ml-2 text-sm">Variations</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setIsChatVisible(true)}
              className="flex-row items-center"
            >
              <Ionicons name="chatbubble-outline" size={24} color="black" />
              <Text className="ml-2 text-sm">Chat</Text>
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
            className="bg-gray-50 p-4 border-b border-gray-200"
          >
            <Text className="text-lg font-semibold mb-3">Variations</Text>
            {isLoadingVariations ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => handleVariationSelect(null)}
                  className={`mr-2 px-4 py-2 rounded-full ${!selectedVariation ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <Text className={`${!selectedVariation ? 'text-white' : 'text-gray-800'}`}>
                    Original
                  </Text>
                </TouchableOpacity>
                {variations.map((variation) => (
                  <View key={variation.id} className="flex-row items-center mr-2">
                    <TouchableOpacity
                      onPress={() => handleVariationSelect(variation)}
                      className={`px-4 py-2 rounded-l-full ${selectedVariation?.id === variation.id ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                      <Text className={`${selectedVariation?.id === variation.id ? 'text-white' : 'text-gray-800'}`}>
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
                                  // If the deleted variation was selected, switch back to original
                                  if (selectedVariation?.id === variation.id) {
                                    handleVariationSelect(null);
                                  }
                                  // Reload variations
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
                        selectedVariation?.id === variation.id ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={16} 
                        color={selectedVariation?.id === variation.id ? 'white' : 'black'} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}

        <View className="px-4">
          {/* Title */}
          <Text className="text-3xl font-bold mt-6 mb-6">{content.title}</Text>

          {/* Ingredients */}
          <View className="mb-8">
            <Text className="text-3xl font-bold mb-4">Ingredients</Text>
            {content.ingredients?.map((ingredient, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
                <Text className="text-xl">{ingredient}</Text>
              </View>
            ))}
          </View>

          {/* Equipment */}
          <View className="mb-8">
            <Text className="text-3xl font-bold mb-4">Equipment Needed</Text>
            {content.equipment?.map((item, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
                <Text className="text-xl">{item}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View className="mb-8">
            <Text className="text-3xl font-bold mb-4">Steps</Text>
            {content.steps?.map((step, index) => (
              <View key={index} className="mb-4">
                <Text className="text-xl font-semibold mb-2">{index + 1}.</Text>
                <Text className="text-xl">{step.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Minimize Button */}
      <TouchableOpacity 
        onPress={onClose}
        className="absolute bottom-4 right-4 bg-black rounded-full p-4 shadow-lg"
      >
        <Ionicons name="chevron-down" size={28} color="white" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <RecipeChat 
        isVisible={isChatVisible}
        onClose={() => {
          setIsChatVisible(false);
          loadVariations(); // Reload variations after chat closes
        }}
        recipe={recipe}
      />
    </View>
  );
} 
