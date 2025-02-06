import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import { useToast } from '@/hooks/useToast';

interface SaveButtonProps {
  videoId: string;
  userId: string;
  size?: number;
}

export function SaveButton({ videoId, userId, size = 24 }: SaveButtonProps) {
  const { savedRecipes, saveRecipe, unsaveRecipe, isSaving } = useSavedRecipes(userId);
  const toast = useToast();
  const isSaved = savedRecipes.some(recipe => recipe.videoId === videoId);

  const handlePress = async () => {
    try {
      await Haptics.selectionAsync(); // Haptic feedback
      if (isSaved) {
        unsaveRecipe(videoId);
        toast.show({ message: 'Recipe removed from cookbook' });
      } else {
        saveRecipe(videoId);
        toast.show({ message: 'Recipe saved to cookbook' });
      }
    } catch (error) {
      toast.show({ 
        message: 'Failed to save recipe', 
        type: 'error' 
      });
    }
  };

  return (
    <Pressable 
      onPress={handlePress}
      disabled={isSaving}
      accessibilityLabel={isSaved ? 'Unsave recipe' : 'Save recipe'}
      accessibilityRole="button"
    >
      <Ionicons 
        name={isSaved ? 'bookmark' : 'bookmark-outline'} 
        size={size} 
        color={isSaved ? '#FF3B30' : '#000000'} 
      />
    </Pressable>
  );
} 