import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import React from 'react';
import { handleSignUp as authHandleSignUp } from '@/utils/auth-hooks';
import { ImageStyle } from '@/services/prompts/imagePrompts';

export interface User {
  id: string;
  username: string;
  email: string;
  image?: string | null;
  diet_tags?: string[];
  disliked_ingredients?: string[];
  illustration_style?: ImageStyle;
}

interface UpdatePreferencesParams {
  diet_tags?: string[];
  disliked_ingredients?: string[];
  illustration_style?: ImageStyle;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: (userId: string) => Promise<User | null>;
  updatePreferences: (preferences: { diet_tags?: string[]; disliked_ingredients?: string[]; illustration_style?: ImageStyle }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  getUser: async () => null,
  updatePreferences: async () => {},
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
    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (sessionData.session?.user) {
          const userData = await getUser(sessionData.session.user.id);
          if (!isMounted) return;
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
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
        console.error('GetUser error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.session?.user.id) {
        const userData = await getUser(data.session.user.id);
        setUser(userData);
      }
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const response = await authHandleSignUp(email, password, username);
    if (response.error) {
      throw response.error;
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async function updatePreferences(preferences: { diet_tags?: string[]; disliked_ingredients?: string[]; illustration_style?: ImageStyle }) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('User')
        .update({
          diet_tags: preferences.diet_tags ?? user.diet_tags ?? [],
          disliked_ingredients: preferences.disliked_ingredients ?? user.disliked_ingredients ?? [],
          illustration_style: preferences.illustration_style ?? user.illustration_style
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        diet_tags: preferences.diet_tags ?? prev.diet_tags,
        disliked_ingredients: preferences.disliked_ingredients ?? prev.disliked_ingredients,
        illustration_style: preferences.illustration_style ?? prev.illustration_style
      } : null);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getUser,
    updatePreferences,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
} 