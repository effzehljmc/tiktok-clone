import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import { AuthListener } from '@/components/auth/AuthListener';

// Create a client
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <AuthListener />
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
              <Toast />
            </BottomSheetModalProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
