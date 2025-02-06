import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface AuthPromptProps {
  message: string;
}

export function AuthPrompt({ message }: AuthPromptProps) {
  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-xl font-semibold text-center mb-4">
          {message}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)')}
          className="bg-black px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 
