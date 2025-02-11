import { View, Text } from 'react-native';
import { Button } from '@rneui/themed';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthConfirmationSuccess() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-black">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-3xl font-bold text-white text-center mb-4">
          Email Confirmed! 🎉
        </Text>
        <Text className="text-lg text-gray-300 text-center mb-8">
          Your email has been successfully verified. You can now sign in to your account.
        </Text>
        <Button
          title="Continue to Sign In"
          onPress={() => router.replace('/(auth)')}
          buttonStyle={{
            backgroundColor: '#FF0050',
            borderRadius: 8,
            paddingHorizontal: 32,
            paddingVertical: 12,
          }}
          titleStyle={{
            fontSize: 16,
            fontWeight: 'bold',
          }}
        />
      </View>
    </SafeAreaView>
  );
} 