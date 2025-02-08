import React, { useState } from 'react';
import { View, TextInput, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { queryRecipeAgent } from '@/services/aiAgent';
import { Video } from '@/types/saved-recipe';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';

interface RecipeChatProps {
  isVisible: boolean;
  onClose: () => void;
  recipe: Video;
}

export function RecipeChat({ isVisible, onClose, recipe }: RecipeChatProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Format recipe context
      const context = `
        Recipe: ${recipe.title}
        Ingredients: ${recipe.recipeMetadata?.ingredients.join(", ")}
        Equipment: ${recipe.recipeMetadata?.equipment.join(", ")}
        Steps: ${recipe.recipeMetadata?.steps.map(step => step.description).join(". ")}
      `;

      const result = await queryRecipeAgent(prompt, context);
      
      if (result.error) {
        setError(result.error);
      } else {
        setResponse(result.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
              </Animated.View>
            ) : null}

            {response ? (
              <Animated.View 
                entering={FadeIn} 
                exiting={FadeOut}
                className="bg-gray-50 rounded-lg p-4 mb-4"
              >
                <Text>{response}</Text>
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