import { supabase } from './supabase'
import { router } from 'expo-router'
import { AuthError } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthResponse {
  error: AuthError | null;
  message?: string;
}

export async function createUserAfterSignUp(
  email: string, 
  id: string, 
  username: string
): Promise<AuthResponse> {
  try {
    console.log('Creating user record:', { email, id, username });
    const { data, error } = await supabase
      .from('User')
      .upsert([
        {
          id: id,
          email,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    console.log('User record created:', data);
    return { error: null }
  } catch (error) {
    console.error('Error creating user:', error)
    return { error: error as AuthError }
  }
}

export async function handleSignUp(
  email: string, 
  password: string, 
  username: string
): Promise<AuthResponse> {
  try {
    // First check if username is already taken
    const { data: existingUser } = await supabase
      .from('User')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
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
          pending_user_record: true // Flag to indicate we need to create user record
        }
      }
    })

    if (signUpError) throw signUpError

    if (user) {
      // Store the user info in AsyncStorage for later
      await AsyncStorage.setItem('pendingUser', JSON.stringify({
        email,
        id: user.id,
        username
      }));

      router.replace('/');
      return { 
        error: null, 
        message: 'Please check your email for verification. You will be able to use the app after verifying your email.' 
      };
    }

    return { error: null }
  } catch (error) {
    console.error('Error in signup process:', error)
    return { error: error as AuthError }
  }
}

// Add this to handle the user record creation after email verification
export async function handleEmailVerification() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return;

    // Check if we have pending user data
    const pendingUserString = await AsyncStorage.getItem('pendingUser')
    if (!pendingUserString) return;

    const pendingUser = JSON.parse(pendingUserString);
    
    // Create the user record
    await createUserAfterSignUp(
      pendingUser.email,
      pendingUser.id,
      pendingUser.username
    );

    // Clear the pending user data
    await AsyncStorage.removeItem('pendingUser');

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

// Add this function to create user record from auth data
async function ensureUserRecord(session: any): Promise<void> {
  try {
    // First check if user record exists
    const { data: existingUser } = await supabase
      .from('User')
      .select()
      .eq('id', session.user.id)
      .single();

    if (!existingUser) {
      console.log('Creating missing user record for:', session.user.email);
      // Create user record from auth data
      const { error } = await supabase
        .from('User')
        .insert([
          {
            id: session.user.id,
            email: session.user.email,
            username: session.user.email.split('@')[0], // Default username from email
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      console.log('User record created successfully');
    }
  } catch (error) {
    console.error('Error ensuring user record:', error);
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

    // Ensure user record exists
    await ensureUserRecord(session);
    
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