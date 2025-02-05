import { supabase } from './supabase'
import { router } from 'expo-router'
import { AuthError } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthResponse {
  error: AuthError | null;
  message?: string;
}

export async function handleSignUp(
  email: string, 
  password: string, 
  username: string
): Promise<AuthResponse> {
  try {
    // First check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('username')
      .eq('username', username)
      .single();

    // Only treat it as an existing user if we got actual data back
    if (existingUser && !checkError) {
      return {
        error: {
          name: 'UsernameExists',
          message: 'This username is already taken'
        } as AuthError
      };
    }

    // Sign up the user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    })

    if (signUpError) throw signUpError

    if (!user) {
      return {
        error: {
          name: 'SignUpError',
          message: 'Failed to create user account. Please try again.'
        } as AuthError
      }
    }

    return { 
      error: null, 
      message: 'Please check your email for verification. You will be able to use the app after verifying your email.' 
    };
  } catch (error) {
    console.error('Error in signup process:', error)
    return { error: error as AuthError }
  }
}

// Add this to handle email verification
export async function handleEmailVerification() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    // Now redirect to the main app
    router.replace('/(tabs)');
  } catch (error) {
    console.error('Error handling email verification:', error);
  }
}

// Helper function to check network connectivity
async function checkNetworkConnection(): Promise<boolean> {
  try {
    // Use Supabase health check endpoint instead
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`);
    return response.ok;
  } catch (error) {
    console.error('Network check error:', error);
    return false;
  }
}

// Modify handleSignIn to use this
export async function handleSignIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    if (!session) {
      return {
        error: {
          name: 'AuthError',
          message: 'No session after login. Please try again.'
        } as AuthError
      }
    }
    
    // Now we can redirect
    router.replace('/(tabs)');
    return { error: null }
  } catch (error) {
    console.error('Error in signin process:', error);
    return { error: error as AuthError }
  }
}

// Also add a function to check if user is authenticated
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    router.replace('/(tabs)');
  } else {
    router.replace('/(auth)');
  }
} 