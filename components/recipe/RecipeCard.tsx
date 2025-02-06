import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { Video } from '@/types/saved-recipe';

interface RecipeCardProps {
  recipe: Video;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { user } = useAuth();

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)",
      params: { videoId: recipe.id }
    });
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="mb-4 rounded-lg overflow-hidden bg-white shadow"
    >
      {recipe.thumbnailUrl ? (
        <Image
          source={recipe.thumbnailUrl}
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
            {recipe.title}
          </Text>
          {user && (
            <SaveButton videoId={recipe.id} userId={user.id} />
          )}
        </View>
        
        {recipe.description && (
          <Text className="text-gray-600 mt-1" numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        
        <View className="flex-row mt-2 items-center">
          <Text className="text-gray-500 text-sm">
            {recipe.viewsCount} views
          </Text>
          <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
          <Text className="text-gray-500 text-sm">
            {recipe.likesCount} likes
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
} 