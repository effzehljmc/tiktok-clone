import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { Video } from '@/types/saved-recipe';
import { ExpandedRecipeCard } from './ExpandedRecipeCard';

interface RecipeCardProps {
  recipe: Video;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      console.log('Opening expanded recipe:', {
        id: recipe?.id,
        title: recipe?.title,
        hasMetadata: !!recipe?.recipeMetadata,
        metadata: recipe?.recipeMetadata,
        thumbnailUrl: recipe?.thumbnailUrl // Log for debugging
      });
    }
  }, [isExpanded, recipe]);

  // Early return if recipe is undefined
  if (!recipe) {
    return (
      <View className="mb-4 rounded-lg overflow-hidden bg-white shadow">
        <View className="w-full h-48 bg-gray-200 items-center justify-center">
          <Text className="text-gray-400">Recipe not available</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="mb-4 rounded-lg overflow-hidden bg-white shadow">
        {recipe?.thumbnailUrl ? (
          <Image
            source={{ uri: recipe.thumbnailUrl }}
            className="w-full h-48"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="w-full h-48 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400">No thumbnail</Text>
          </View>
        )}
        
        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <Text className="text-lg font-semibold flex-1 mr-2" numberOfLines={2}>
              {recipe?.title || 'Untitled Recipe'}
            </Text>
            <View className="flex-row items-center gap-2">
              {user && recipe?.id && (
                <SaveButton videoId={recipe.id} userId={user.id} />
              )}
              <TouchableOpacity 
                onPress={() => setIsExpanded(true)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="expand-outline" size={20} color="black" />
              </TouchableOpacity>
            </View>
          </View>
          
          {recipe?.description && (
            <Text className="text-gray-600 mt-1" numberOfLines={2}>
              {recipe.description}
            </Text>
          )}
          
          <View className="flex-row mt-2 items-center">
            <Text className="text-gray-500 text-sm">
              {recipe?.viewsCount || 0} views
            </Text>
            <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
            <Text className="text-gray-500 text-sm">
              {recipe?.likesCount || 0} likes
            </Text>
          </View>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isExpanded}
        onRequestClose={() => setIsExpanded(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 m-4">
            <ExpandedRecipeCard 
              recipe={recipe}
              onClose={() => setIsExpanded(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
} 