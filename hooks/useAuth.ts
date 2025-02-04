import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import React from 'react';

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
      if (data.session) {
        getUser(data.session.user.id);
        router.replace('/(tabs)');
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        getUser(session.user.id);
        router.replace('/(tabs)');
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function getUser(userId: string) {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('GetUser error:', error);
      return;
    }
    setUser(data);
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SignIn error:', error);
      throw error;
    }
    if (data.session?.user.id) {
      await getUser(data.session.user.id);
      router.replace('/(tabs)');
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      console.error('SignUp error:', authError);
      throw authError;
    }
    if (!authData.user?.id) {
      throw new Error('No user ID returned from signup');
    }
    const { error: dbError } = await supabase
      .from('User')
      .insert([{ id: authData.user.id, username, email }])
      .single();
    if (dbError) {
      console.error('DB Insert error:', dbError);
      throw dbError;
    }
    await getUser(authData.user.id);
    router.back();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/');
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