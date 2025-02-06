import { FlashList } from '@shopify/flash-list';
import { View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSavedRecipes } from '@/hooks/useSavedRecipes';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { ErrorView } from '@/components/common/ErrorView';
import { LoadingView } from '@/components/common/LoadingView';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CookbookScreen() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthPrompt message="Sign in to save your favorite recipes" />;
  }

  const { savedRecipes, isLoading, error } = useSavedRecipes(user.id);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  // Filter out saved recipes with missing video data
  const validRecipes = savedRecipes.filter(recipe => recipe.video !== null);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="px-4 pt-2 pb-0">
        <Text className="text-2xl font-bold mb-4">Cookbook</Text>
      </View>
      
      {!validRecipes.length ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-500 text-center">
            No saved recipes yet
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Save recipes to access them quickly later
          </Text>
        </View>
      ) : (
        <FlashList
          data={validRecipes}
          renderItem={({ item }) => (
            <RecipeCard recipe={item.video!} />
          )}
          estimatedItemSize={300}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
} 