import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

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
