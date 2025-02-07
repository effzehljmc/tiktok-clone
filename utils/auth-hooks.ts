import { supabase } from './supabase'
import { AuthError } from '@supabase/supabase-js'

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
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser && !checkError) {
      return {
        error: {
          name: 'UsernameExists',
          message: 'This username is already taken'
        } as AuthError
      };
    }

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

// Also add a function to check if user is authenticated
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return { isAuthenticated: !!session, session };
} 