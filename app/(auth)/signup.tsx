import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function SignupScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Signup Screen
      </Text>
      <Link href="/" className="text-blue-500">
        <Text>Already have an account? Login</Text>
      </Link>
    </View>
  );
}
