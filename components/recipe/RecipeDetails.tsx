import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from './SaveButton';
import { useAuth } from '@/hooks/useAuth';

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
              <TouchableOpacity className="p-2">
                <SaveButton 
                  videoId={recipe.id} 
                  userId={user.id} 
                  size={28} 
                />
              </TouchableOpacity>
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