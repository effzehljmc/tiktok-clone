import { Text, View, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-black font-bold text-3xl">Login</Text>
      <Link href="/(tabs)">This is a button</Link>
      <TouchableOpacity onPress={() => router.push('/(tabs)')}>
        <Text>This is a button</Text>
      </TouchableOpacity>
    </View>
  );
}
