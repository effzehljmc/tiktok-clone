import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import React from 'react';
import { handleSignUp as authHandleSignUp } from '@/utils/auth-hooks';

interface User {
  id: string;
  email: string;
  username: string | null;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        // Only try to get user data if email is confirmed
        if (data.session.user.email_confirmed_at) {
          getUser(data.session.user.id);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.replace('/(auth)');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user.email_confirmed_at) {
          const userData = await getUser(session.user.id);
          if (userData) {
            router.replace('/(tabs)');
          } else {
            // If we have auth but no user record, keep them on auth pages
            router.replace('/(auth)');
          }
        } else {
          setUser(null);
          router.replace('/(auth)');
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function getUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // User record doesn't exist yet, this is normal for new signups
          console.log('User record not found, waiting for creation');
          return null;
        }
        console.error('GetUser error:', error);
        return null;
      }
      setUser(data);
      return data;
    } catch (error) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SignIn error:', error);
      throw error;
    }
    if (data.session?.user.id) {
      const userData = await getUser(data.session.user.id);
      if (userData) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)');
      }
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const response = await authHandleSignUp(email, password, username);
    if (response.error) {
      throw response.error;
    }
    // Don't navigate or get user here - wait for email verification
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/(auth)');
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
} 