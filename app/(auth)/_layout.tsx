import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Sign In',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          title: 'Sign Up',
          headerShown: false,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}
