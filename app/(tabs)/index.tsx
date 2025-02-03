import { Image, StyleSheet, Platform } from 'react-native';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-gray-800">
        Welcome to Home Screen
      </Text>
    </View>
  );
}

