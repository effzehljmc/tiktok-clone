import React, { useState, useCallback } from 'react';
import { View, TextInput, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { queryRecipeAgent } from '@/services/aiAgent';
import { saveRecipeVariation, type RecipeVariationInput } from '@/services/recipeVariations';
import { Video } from '@/types/saved-recipe';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { type RecipeMetadata } from '@prisma/client';
import Toast from 'react-native-toast-message';

type VariationType = 'DIETARY' | 'INGREDIENT_SUBSTITUTION' | 'PORTION_ADJUSTMENT' | 'COOKING_METHOD' | 'FLAVOR_PROFILE';

interface RecipeChatProps {
  isVisible: boolean;
  onClose: () => void;
  recipe: Video;
  onVariationCreated?: () => void;
}

interface ParsedVariation {
  ingredients: string[];
  equipment: string[];
  steps: { timestamp: number; description: string }[];
  variationType: VariationType;
}

export function RecipeChat({ isVisible, onClose, recipe, onVariationCreated }: RecipeChatProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [parsedVariation, setParsedVariation] = useState<ParsedVariation | null>(null);
  const [saveAttempts, setSaveAttempts] = useState(0);

  // Detect variation type based on prompt keywords
  const detectVariationType = useCallback((prompt: string): VariationType => {
    console.log('Detecting variation type for prompt:', prompt);
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('vegan') || lowerPrompt.includes('vegetarian') || 
        lowerPrompt.includes('gluten') || lowerPrompt.includes('dairy')) {
      console.log('Detected DIETARY variation type');
      return 'DIETARY';
    }
    if (lowerPrompt.includes('substitute') || lowerPrompt.includes('replace') || 
        lowerPrompt.includes('instead of')) {
      console.log('Detected INGREDIENT_SUBSTITUTION variation type');
      return 'INGREDIENT_SUBSTITUTION';
    }
    if (lowerPrompt.includes('portion') || lowerPrompt.includes('servings') || 
        lowerPrompt.includes('scale') || lowerPrompt.includes('half') || 
        lowerPrompt.includes('double')) {
      console.log('Detected PORTION_ADJUSTMENT variation type');
      return 'PORTION_ADJUSTMENT';
    }
    if (lowerPrompt.includes('method') || lowerPrompt.includes('technique') || 
        lowerPrompt.includes('cook') || lowerPrompt.includes('prepare')) {
      console.log('Detected COOKING_METHOD variation type');
      return 'COOKING_METHOD';
    }
    if (lowerPrompt.includes('spicy') || lowerPrompt.includes('sweet') || 
        lowerPrompt.includes('flavor') || lowerPrompt.includes('taste')) {
      console.log('Detected FLAVOR_PROFILE variation type');
      return 'FLAVOR_PROFILE';
    }

    console.log('No specific variation type detected, defaulting to INGREDIENT_SUBSTITUTION');
    return 'INGREDIENT_SUBSTITUTION';
  }, []);

  // Parse AI response into structured data
  const parseAIResponse = useCallback((response: string): ParsedVariation | null => {
    console.log('Parsing AI response...');
    try {
      const lines = response.split('\n').map(line => line.trim()).filter(Boolean);
      
      // Extract ingredients
      const ingredientsStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('modified ingredients') || 
        line.toLowerCase().includes('ingredients:')
      );
      console.log('Found ingredients section at index:', ingredientsStartIndex);
      
      let ingredients: string[] = [];
      if (ingredientsStartIndex !== -1) {
        let i = ingredientsStartIndex + 1;
        while (i < lines.length && !lines[i].startsWith('2.') && !lines[i].toLowerCase().includes('equipment')) {
          if (lines[i].trim() && !lines[i].startsWith('•')) {
            ingredients.push(lines[i].replace(/^[-•*]\s*/, '').trim());
          }
          i++;
        }
      }
      console.log('Parsed ingredients:', ingredients);

      // Extract equipment
      const equipmentStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('equipment needed') || 
        line.toLowerCase().includes('equipment:')
      );
      console.log('Found equipment section at index:', equipmentStartIndex);
      
      let equipment: string[] = [];
      if (equipmentStartIndex !== -1) {
        let i = equipmentStartIndex + 1;
        while (i < lines.length && !lines[i].startsWith('3.') && !lines[i].toLowerCase().includes('steps')) {
          if (lines[i].trim() && !lines[i].startsWith('•')) {
            equipment.push(lines[i].replace(/^[-•*]\s*/, '').trim());
          }
          i++;
        }
      }
      console.log('Parsed equipment:', equipment);

      // Extract steps
      const stepsStartIndex = lines.findIndex(line => 
        line.toLowerCase().includes('step-by-step') || 
        line.toLowerCase().includes('instructions:') ||
        line.toLowerCase().includes('steps:')
      );
      console.log('Found steps section at index:', stepsStartIndex);
      
      let steps: { timestamp: number; description: string }[] = [];
      if (stepsStartIndex !== -1) {
        let i = stepsStartIndex + 1;
        let stepNumber = 1;
        while (i < lines.length && !lines[i].toLowerCase().includes('note:')) {
          const line = lines[i].trim();
          if (line && !line.toLowerCase().startsWith('step') && !line.startsWith('•')) {
            // Remove any leading numbers or bullets
            const description = line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim();
            if (description) {
              steps.push({
                timestamp: stepNumber * 60, // Simple timestamp estimation
                description
              });
              stepNumber++;
            }
          }
          i++;
        }
      }
      console.log('Parsed steps:', steps);

      const variationType = detectVariationType(prompt);

      // Use parsed data or fall back to original recipe data
      const parsed = {
        ingredients: ingredients.length > 0 ? ingredients : recipe.recipeMetadata!.ingredients,
        equipment: equipment.length > 0 ? equipment : recipe.recipeMetadata!.equipment,
        steps: steps.length > 0 ? steps : recipe.recipeMetadata!.steps,
        variationType,
      };

      console.log('Successfully parsed variation:', {
        ingredientsCount: parsed.ingredients.length,
        equipmentCount: parsed.equipment.length,
        stepsCount: parsed.steps.length,
        variationType: parsed.variationType,
      });

      return parsed;
    } catch (err) {
      console.error('Error parsing AI response:', err);
      return null;
    }
  }, [prompt, recipe.recipeMetadata, detectVariationType]);

  const handleSubmit = async () => {
    if (!prompt.trim() || !recipe.recipeMetadata) return;

    console.log('Submitting prompt:', prompt);
    setIsLoading(true);
    setError('');
    setParsedVariation(null);

    try {
      // Convert the recipe metadata to the Prisma type
      const recipeMetadata: RecipeMetadata = {
        id: recipe.id,
        videoId: recipe.id,
        ingredients: recipe.recipeMetadata.ingredients,
        cookingTime: recipe.recipeMetadata.cookingTime,
        difficulty: recipe.recipeMetadata.difficulty,
        cuisine: recipe.recipeMetadata.cuisine,
        servings: recipe.recipeMetadata.servings,
        calories: recipe.recipeMetadata.calories,
        equipment: recipe.recipeMetadata.equipment,
        dietaryTags: recipe.recipeMetadata.dietaryTags,
        steps: recipe.recipeMetadata.steps,
      };

      console.log('Querying AI agent with metadata:', {
        recipeId: recipeMetadata.id,
        ingredients: recipeMetadata.ingredients.length,
        steps: recipeMetadata.steps,
      });

      const result = await queryRecipeAgent(prompt, recipeMetadata, {
        queryType: 'VARIATION',
      });
      
      if (result.error) {
        console.error('AI agent returned error:', result.error);
        setError(result.error);
      } else {
        console.log('AI agent returned successful response');
        setResponse(result.content);
        const parsed = parseAIResponse(result.content);
        if (parsed) {
          setParsedVariation(parsed);
        }
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVariation = async () => {
    if (!user || !response || !recipe.recipeMetadata || !parsedVariation) {
      console.error('Missing required data for saving variation:', {
        hasUser: !!user,
        hasResponse: !!response,
        hasRecipeMetadata: !!recipe.recipeMetadata,
        hasParsedVariation: !!parsedVariation,
        userId: user?.id,
        recipeId: recipe.id,
        recipeTitle: recipe.title
      });
      return;
    }

    console.log('Starting variation save process:', {
      userId: user.id,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      variationType: parsedVariation.variationType,
      ingredientsCount: parsedVariation.ingredients.length,
      equipmentCount: parsedVariation.equipment.length,
      stepsCount: parsedVariation.steps.length
    });

    setIsSaving(true);
    setError('');

    try {
      const variationInput: RecipeVariationInput = {
        userId: user.id,
        recipeId: recipe.id,
        title: `Variation of ${recipe.title}`,
        ingredients: parsedVariation.ingredients,
        equipment: parsedVariation.equipment,
        steps: parsedVariation.steps,
        aiPrompt: response,
        originalPrompt: prompt,
        variationType: parsedVariation.variationType,
        metadata: {
          servings: recipe.recipeMetadata.servings,
        },
      };

      console.log('Saving variation with input:', {
        userId: variationInput.userId,
        recipeId: variationInput.recipeId,
        title: variationInput.title,
        variationType: variationInput.variationType,
        ingredientsCount: variationInput.ingredients.length,
        equipmentCount: variationInput.equipment.length,
        stepsCount: variationInput.steps.length
      });

      const savedVariation = await saveRecipeVariation(variationInput);
      console.log('Successfully saved variation:', {
        variationId: savedVariation.id,
        recipeId: savedVariation.recipeId,
        title: savedVariation.title,
        variationType: savedVariation.variationType
      });

      onVariationCreated?.(); // Call the callback if provided
      onClose();
      
      Toast.show({
        type: 'success',
        text1: 'Variation saved successfully',
        text2: 'View it in your Cookbook'
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error saving variation:', {
        error: error.message,
        stack: error.stack,
        userId: user.id,
        recipeId: recipe.id,
        recipeTitle: recipe.title
      });
      setError('Failed to save variation. Please try again.');
      setSaveAttempts(prev => prev + 1);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    console.log('Retrying save operation, attempt:', saveAttempts + 1);
    handleSaveVariation();
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Animated.View 
        entering={SlideInRight} 
        exiting={SlideOutRight}
        className="absolute right-0 top-0 bottom-0 w-3/4 bg-white shadow-lg"
      >
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text h4 className="flex-1">Recipe Assistant</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {error ? (
              <Animated.View 
                entering={FadeIn} 
                exiting={FadeOut}
                className="bg-red-50 p-3 rounded-lg mb-4"
              >
                <Text className="text-red-500">{error}</Text>
                {saveAttempts > 0 && saveAttempts < 3 && (
                  <TouchableOpacity
                    onPress={handleRetry}
                    className="mt-2 bg-red-100 p-2 rounded-lg"
                  >
                    <Text className="text-red-700 text-center">Retry Save ({3 - saveAttempts} attempts remaining)</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            ) : null}

            {response ? (
              <Animated.View 
                entering={FadeIn} 
                exiting={FadeOut}
                className="bg-gray-50 rounded-lg p-4 mb-4"
              >
                <Text>{response}</Text>
                {parsedVariation && (
                  <View className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
                    <Text className="font-medium mb-2">Parsed Variation Summary:</Text>
                    <Text>• Type: {parsedVariation.variationType}</Text>
                    <Text>• Ingredients: {parsedVariation.ingredients.length} items</Text>
                    <Text>• Equipment: {parsedVariation.equipment.length} items</Text>
                    <Text>• Steps: {parsedVariation.steps.length} steps</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={handleSaveVariation}
                  disabled={isSaving || !parsedVariation}
                  className={`mt-4 bg-blue-500 p-3 rounded-lg flex-row justify-center items-center ${(isSaving || !parsedVariation) ? 'opacity-50' : ''}`}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">
                      {parsedVariation ? 'Save Variation' : 'Unable to Parse Variation'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-gray-500 text-center">
                  Ask me anything about this recipe!{'\n'}
                  For example:{'\n'}
                  • How can I make this vegan?{'\n'}
                  • Can I substitute X with Y?{'\n'}
                  • How do I adjust portions?
                </Text>
              </View>
            )}
          </ScrollView>

          <View className="p-4 border-t border-gray-200">
            <View className="flex-row items-end gap-2">
              <TextInput
                className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 bg-gray-100 rounded-2xl"
                placeholder="Ask about the recipe..."
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={1}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className={`p-2 rounded-full ${isLoading || !prompt.trim() ? 'opacity-50' : ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="send" size={24} color="black" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
} 