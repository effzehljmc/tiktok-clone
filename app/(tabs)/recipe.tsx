import { StyleSheet } from 'react-native';
import { RecipeFeed } from '@/components/recipe/RecipeFeed';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecipeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <RecipeFeed />
    </SafeAreaView>
  );
} 