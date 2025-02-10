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
import { StepIllustration } from './StepIllustration';
import { saveStepIllustration, getStepIllustrations } from '@/services/stepIllustrations';
import { safeGenerateImage } from '@/services/safeImageGeneration';
import { buildStepPrompt } from '@/services/prompts/imagePrompts';
import { Image } from 'expo-image';

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

// Add preloading function
async function preloadImages(illustrations: {[key: number]: string}) {
  const urls = Object.values(illustrations);
  try {
    console.log('Preloading images:', urls);
    await Promise.all(urls.map(async (url) => {
      try {
        await Image.prefetch(url);
        console.log('Successfully preloaded:', url);
      } catch (err) {
        console.error('Failed to preload specific image:', url, err);
      }
    }));
  } catch (err) {
    console.error('Failed to preload images:', err);
  }
}

export function ExpandedRecipeCard({ recipe, onClose }: ExpandedRecipeCardProps) {
  const { user } = useAuth();
  const { addToList, isAdding } = useShoppingList(user?.id || '');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [variations, setVariations] = useState<RecipeVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<RecipeVariation | null>(null);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [showVariationHistory, setShowVariationHistory] = useState(false);
  const [generatingImageForStep, setGeneratingImageForStep] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [stepIllustrations, setStepIllustrations] = useState<{[key: number]: string}>({});
  const [isLoadingIllustrations, setIsLoadingIllustrations] = useState(true);

  // Add logging for initial recipe prop
  useEffect(() => {
    console.log('Initial recipe prop:', {
      id: recipe.id,
      metadataId: recipe.recipeMetadata?.id,
      title: recipe.title
    });
  }, []);

  // Load variations when component mounts
  useEffect(() => {
    if (user && recipe.id) {
      // Avoid logging full recipe object which may contain circular references
      console.log('Loading variations for recipe:', recipe.id);
      loadVariations();
    }
  }, [user, recipe.id]);

  // Load illustrations when component mounts
  useEffect(() => {
    if (recipe.recipeMetadata?.id) {
      console.log('Loading illustrations for recipe:', recipe.recipeMetadata.id);
      loadIllustrations();
    }
  }, [recipe.recipeMetadata?.id]);

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

  const loadIllustrations = async () => {
    setIsLoadingIllustrations(true);
    try {
      if (!recipe.recipeMetadata?.id) {
        console.log('No recipe metadata id found');
        return;
      }
      
      const illustrations = await getStepIllustrations(recipe.recipeMetadata.id);
      console.log('Loaded illustrations count:', illustrations.length);
      
      // Create a map of step index to image URL
      const illustrationMap = illustrations.reduce((acc, ill) => {
        if (ill.image_url) {
          acc[ill.step_index] = ill.image_url;
        }
        return acc;
      }, {} as {[key: number]: string});
      
      console.log('Created illustration map with keys:', Object.keys(illustrationMap));
      
      // Set the illustrations first so they start loading
      setStepIllustrations(illustrationMap);
      
      // Then preload them
      await preloadImages(illustrationMap);
      
    } catch (err) {
      console.error('Failed to load illustrations:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load recipe illustrations'
      });
    } finally {
      setIsLoadingIllustrations(false);
    }
  };

  // Add a useEffect to monitor state changes
  useEffect(() => {
    console.log('Current stepIllustrations:', stepIllustrations);
    console.log('Current expandedSteps:', expandedSteps);
  }, [stepIllustrations, expandedSteps]);

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
  
  // Avoid logging full content object
  console.log('Recipe content stats:', {
    hasTitle: !!content.title,
    ingredientsCount: content.ingredients?.length || 0,
    equipmentCount: content.equipment?.length || 0,
    stepsCount: content.steps?.length || 0,
    recipeId: selectedVariation?.id || recipe.id
  });

  const toggleStepExpansion = (stepIndex: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const handleGenerateImage = async (step: { description: string }, stepIndex: number) => {
    console.log('handleGenerateImage called with:', { step, stepIndex });
    
    if (generatingImageForStep !== null) {
      console.log('Already generating an image');
      return;
    }

    // Get the recipe metadata ID from the full recipe object
    const recipeMetadataId = recipe.recipeMetadata?.id;
    if (!recipeMetadataId) {
      console.log('No recipe metadata id found');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Recipe metadata not found. Please try refreshing the recipe.'
      });
      return;
    }
    
    setGeneratingImageForStep(stepIndex);
    try {
      const options = buildStepPrompt({
        action: step.description,
        ingredients: content.ingredients,
        equipment: content.equipment,
        style: user?.illustration_style || 'photorealistic'
      });
      
      console.log('Generated prompt options:', options);
      const result = await safeGenerateImage(options);
      console.log('Image generation result:', result);
      
      if (result.result?.sample) {
        const imageUrl = result.result.sample;
        // Save the illustration using the recipe metadata id
        console.log('Saving illustration with:', {
          recipeId: recipeMetadataId,
          stepIndex,
          imageUrl
        });
        await saveStepIllustration(recipeMetadataId, stepIndex, imageUrl);
        setStepIllustrations(prev => ({
          ...prev,
          [stepIndex]: imageUrl
        }));
        setExpandedSteps(prev => [...prev, stepIndex]);
        console.log('Successfully generated and saved illustration for step:', stepIndex);
        Toast.show({
          type: 'success',
          text1: 'Generated illustration',
          text2: `For step ${stepIndex + 1}`
        });
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to generate illustration'
      });
    } finally {
      setGeneratingImageForStep(null);
    }
  };

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
              className="bg-gray-800 p-3 rounded-full"
            >
              <Ionicons 
                name="cart-outline" 
                size={20} 
                color={isAdding ? "gray" : "white"} 
              />
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-800 p-3 rounded-full">
              <SaveButton videoId={recipe.id} userId={user.id} size={20} />
            </TouchableOpacity>
            {variations.length > 0 && (
              <TouchableOpacity 
                onPress={() => setShowVariationHistory(!showVariationHistory)}
                className="bg-gray-800 p-3 rounded-full"
              >
                <Ionicons 
                  name="git-branch-outline" 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setIsChatVisible(true)}
              className="bg-gray-800 p-3 rounded-full"
            >
              <Ionicons name="chatbubble-outline" size={20} color="white" />
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
            {!content.steps?.length ? (
              <View className="bg-gray-800 p-4 rounded-xl">
                <Text className="text-gray-200">No steps available for this recipe.</Text>
              </View>
            ) : (
              content.steps.map((step, index) => {
                const hasIllustration = !!stepIllustrations[index];
                const isExpanded = expandedSteps.includes(index);
                
                return (
                  <View key={index} className="mb-4 bg-gray-800 p-4 rounded-xl">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-lg font-semibold text-blue-400">Step {index + 1}</Text>
                      <View className="flex-row items-center gap-2">
                        {hasIllustration && (
                          <TouchableOpacity 
                            className="p-2 bg-gray-700 rounded-full"
                            onPress={() => toggleStepExpansion(index)}
                          >
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color="white" 
                            />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          className="p-2 bg-gray-700 rounded-full"
                          onPress={() => handleGenerateImage(step, index)}
                          disabled={generatingImageForStep !== null || isLoadingIllustrations}
                        >
                          {generatingImageForStep === index ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : isLoadingIllustrations ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Ionicons 
                              name={hasIllustration ? "camera" : "camera-outline"} 
                              size={20} 
                              color="white" 
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-lg text-gray-200">{step.description}</Text>
                    
                    {hasIllustration && isExpanded && (
                      <Animated.View 
                        entering={FadeIn}
                        exiting={FadeOut}
                        className="mt-4"
                      >
                        <View className="relative w-full h-[200px] bg-gray-700 rounded-xl overflow-hidden">
                          {isLoadingIllustrations && (
                            <View className="absolute inset-0 z-10 items-center justify-center">
                              <ActivityIndicator size="large" color="white" />
                            </View>
                          )}
                          <Image
                            source={{ uri: stepIllustrations[index] }}
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#1f2937'
                            }}
                            contentFit="cover"
                            transition={200}
                            onLoadStart={() => {
                              console.log('🔵 IMAGE LOAD START:', {
                                step: index,
                                url: stepIllustrations[index]
                              });
                            }}
                            onLoad={() => {
                              console.log('✅ IMAGE LOADED:', {
                                step: index,
                                url: stepIllustrations[index]
                              });
                            }}
                            onError={(error) => {
                              console.log('❌ IMAGE ERROR:', {
                                step: index,
                                url: stepIllustrations[index],
                                error
                              });
                              // When Azure URL fails, update state to remove the failed URL
                              if (error?.error?.includes('403')) {
                                setStepIllustrations(prev => {
                                  const newState = { ...prev };
                                  delete newState[index];
                                  return newState;
                                });
                                Toast.show({
                                  type: 'error',
                                  text1: 'Image expired',
                                  text2: 'Please regenerate the illustration'
                                });
                              }
                            }}
                          />
                        </View>
                      </Animated.View>
                    )}
                  </View>
                );
              })
            )}
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
