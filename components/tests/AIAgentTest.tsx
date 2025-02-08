import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { queryRecipeAgent } from '../../services/aiAgent';

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
      <Text h4 className="mb-4">AI Recipe Assistant Test</Text>
      
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
        <Text className="text-red-500 mb-4">{error}</Text>
      ) : null}

      {response ? (
        <View className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <Text className="font-medium mb-2">Response:</Text>
          <Text>{response.content}</Text>
          {response.cached && (
            <Text className="text-gray-500 mt-2">(Cached response)</Text>
          )}
        </View>
      ) : null}
    </View>
  );
} 