import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoadingView() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    </SafeAreaView>
  );
} 