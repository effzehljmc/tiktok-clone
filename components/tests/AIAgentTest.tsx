import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator, TouchableOpacity, Text as RNText } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { queryRecipeAgent } from '../../services/aiAgent';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface AIResponse {
  content: string;
  cached: boolean;
}

export function AIAgentTest() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testContext = `
    Recipe: Classic Chocolate Chip Cookies
    Ingredients:
    - 2 1/4 cups all-purpose flour
    - 1 cup butter, softened
    - 3/4 cup sugar
    - 3/4 cup brown sugar
    - 2 large eggs
    - 1 tsp vanilla extract
    - 1 tsp baking soda
    - 1/2 tsp salt
    - 2 cups chocolate chips
    
    Instructions:
    1. Preheat oven to 375°F
    2. Cream butter and sugars
    3. Beat in eggs and vanilla
    4. Mix in dry ingredients
    5. Stir in chocolate chips
    6. Drop by rounded tablespoons onto baking sheets
    7. Bake 9-11 minutes
  `;

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await queryRecipeAgent(prompt, testContext);
      
      if (result.error) {
        setError(result.error);
      } else {
        setResponse({
          content: result.content,
          cached: result.cached
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="p-4 flex-1">
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text h4>AI Recipe Assistant</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Ask about the recipe (e.g., 'How can I make this vegan?')"
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      <Button
        title={isLoading ? 'Loading...' : 'Ask Assistant'}
        onPress={handleSubmit}
        disabled={isLoading || !prompt.trim()}
        className="mb-4"
      />

      {isLoading && (
        <ActivityIndicator size="large" className="my-4" />
      )}

      {error ? (
        <RNText className="text-red-500 mb-4">{error}</RNText>
      ) : null}

      {response ? (
        <View className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <RNText className="font-medium mb-2">Response:</RNText>
          <RNText>{response.content}</RNText>
          {response.cached && (
            <RNText className="text-gray-500 mt-2">(Cached response)</RNText>
          )}
        </View>
      ) : null}
    </View>
  );
} 