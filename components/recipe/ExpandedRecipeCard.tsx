import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import { Video } from '@/types/saved-recipe';
import { RecipeChat } from './RecipeChat';
import Toast from 'react-native-toast-message';

interface ExpandedRecipeCardProps {
  recipe: Video;
  onClose: () => void;
}

export function ExpandedRecipeCard({ recipe, onClose }: ExpandedRecipeCardProps) {
  const { user } = useAuth();
  const { addToList, isAdding } = useShoppingList(user?.id || '');
  const [isChatVisible, setIsChatVisible] = useState(false);

  const handleAddToShoppingList = async () => {
    if (!user) return;
    
    try {
      await addToList(
        recipe.recipeMetadata?.ingredients.map(ingredient => ({
          ingredient,
          recipe_id: recipe.id
        })) || []
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

  return (
    <View className="flex-1 bg-white rounded-3xl overflow-hidden">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
        <Text className="text-3xl font-bold">Recipe Details</Text>
        <View className="flex-row items-center gap-4">
          {user && (
            <>
              <TouchableOpacity 
                onPress={handleAddToShoppingList}
                disabled={isAdding}
              >
                <Ionicons 
                  name="cart-outline" 
                  size={28} 
                  color={isAdding ? "gray" : "black"} 
                />
              </TouchableOpacity>
              <SaveButton videoId={recipe.id} userId={user.id} size={28} />
            </>
          )}
          <TouchableOpacity 
            onPress={() => setIsChatVisible(true)}
          >
            <Ionicons name="chatbubble-outline" size={28} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4">
        {/* Title */}
        <Text className="text-3xl font-bold mt-6 mb-6">{recipe.title}</Text>

        {/* Ingredients */}
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-4">Ingredients</Text>
          {recipe.recipeMetadata?.ingredients?.map((ingredient, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
              <Text className="text-xl">{ingredient}</Text>
            </View>
          ))}
        </View>

        {/* Equipment */}
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-4">Equipment Needed</Text>
          {recipe.recipeMetadata?.equipment?.map((item, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
              <Text className="text-xl">{item}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-4">Steps</Text>
          {recipe.recipeMetadata?.steps?.map((step, index) => (
            <View key={index} className="mb-4">
              <Text className="text-xl font-semibold mb-2">{index + 1}.</Text>
              <Text className="text-xl">{step.description}</Text>
            </View>
          ))}
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
        onClose={() => setIsChatVisible(false)}
        recipe={recipe}
      />
    </View>
  );
} 
