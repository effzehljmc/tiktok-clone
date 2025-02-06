import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import Toast from 'react-native-toast-message';

interface RecipeDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  recipe: {
    id: string;
    title: string;
    ingredients: string[];
    equipment: string[];
    steps: { timestamp: number; description: string; }[];
  };
}

export function RecipeDetails({ isVisible, onClose, recipe }: RecipeDetailsProps) {
  const { user } = useAuth();
  const { addToList, isAdding } = useShoppingList(user?.id || '');
  
  const handleAddToShoppingList = async () => {
    if (!user) return;
    
    try {
      await addToList(
        recipe.ingredients.map(ingredient => ({
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
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-2xl font-bold flex-1">Recipe Details</Text>
          <View className="flex-row items-center gap-4">
            {user && (
              <>
                <TouchableOpacity 
                  className="p-2"
                  onPress={handleAddToShoppingList}
                  disabled={isAdding}
                >
                  <Ionicons 
                    name="cart-outline" 
                    size={28} 
                    color={isAdding ? "gray" : "black"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity className="p-2">
                  <SaveButton 
                    videoId={recipe.id} 
                    userId={user.id} 
                    size={28} 
                  />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="mb-6">
            <Text className="text-xl font-bold mb-3">Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <Text key={index} className="text-gray-700 mb-1">• {ingredient}</Text>
            ))}
          </View>

          <View className="mb-6">
            <Text className="text-xl font-bold mb-3">Equipment Needed</Text>
            {recipe.equipment.map((item, index) => (
              <Text key={index} className="text-gray-700 mb-1">• {item}</Text>
            ))}
          </View>

          <View>
            <Text className="text-xl font-bold mb-3">Steps</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} className="mb-4">
                <Text className="text-lg font-semibold mb-2">{index + 1}.</Text>
                <Text className="text-gray-700">{step.description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
} 