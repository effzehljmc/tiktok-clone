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
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Initialize navigation readiness
  useEffect(() => {
    const checkNavigationReady = () => {
      try {
        // Check if router is ready by attempting to get current segment
        const segment = router.canGoBack();
        console.log('Navigation ready check succeeded');
        setIsNavigationReady(true);
      } catch (e) {
        console.log('Navigation not ready, retrying in 100ms...');
        setTimeout(checkNavigationReady, 100);
      }
    };
    checkNavigationReady();
  }, []);

  // Safe navigation function that checks readiness
  const safeNavigate = (route: '/(auth)' | '/(tabs)') => {
    console.log(`safeNavigate called with route=${route}; isNavigationReady=${isNavigationReady}`);
    
    if (!isNavigationReady) {
      console.log('Navigation not ready, re-trying in 100ms...');
      setTimeout(() => safeNavigate(route), 100);
      return;
    }

    console.log(`Replacing route with: ${route}`);
    router.replace(route);
  };

  useEffect(() => {
    console.log('Auth effect starting, isNavigationReady:', isNavigationReady);
    let isMounted = true;

    // Initialize auth state with retry logic
    const initializeAuth = async (retryCount = 0) => {
      if (!isMounted) return;
      console.log('Initializing auth, attempt:', retryCount + 1);
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Got session data:', sessionData?.session ? 'Session exists' : 'No session');
        if (!isMounted) return;

        if (sessionData.session?.user) {
          console.log('Session user found:', sessionData.session.user.email);
          if (sessionData.session.user.email_confirmed_at) {
            console.log('Email confirmed, fetching user data');
            const userData = await getUser(sessionData.session.user.id);
            if (!isMounted) return;
            
            console.log('User data fetched:', userData ? 'exists' : 'null');
            if (userData) {
              console.log('Navigating to tabs after initialization');
              safeNavigate('/(tabs)');
            }
          } else {
            console.log('Email not confirmed, setting user null');
            setUser(null);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (!isMounted) return;
        
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying initialization in ${delay}ms`);
          setTimeout(() => initializeAuth(retryCount + 1), delay);
        } else {
          console.log('Max retries reached, setting default states');
          setLoading(false);
          setUser(null);
        }
      }
    };

    // Subscribe to auth changes with retry logic
    const setupAuthListener = (retryCount = 0) => {
      if (!isMounted) return;
      console.log('Setting up auth listener, attempt:', retryCount + 1);

      try {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          console.log('Auth state change:', event, 'User:', session?.user?.email);
          console.log('Current states - loading:', loading, 'user:', user?.email);
          
          if (event === 'SIGNED_OUT') {
            console.log('Processing SIGNED_OUT event');
            setUser(null);
            setLoading(false);
            safeNavigate('/(auth)');
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('Processing SIGNED_IN/TOKEN_REFRESHED event');
            setLoading(true);
            try {
              if (session?.user.email_confirmed_at) {
                console.log('Email confirmed, fetching user data');
                const userData = await getUser(session.user.id);
                if (!isMounted) return;
                
                console.log('User data fetched:', userData ? 'exists' : 'null');
                setLoading(false);
                if (userData) {
                  console.log('Navigating to tabs after sign in');
                  safeNavigate('/(tabs)');
                } else {
                  console.log('No user data, navigating to auth');
                  safeNavigate('/(auth)');
                }
              } else {
                console.log('Email not confirmed, navigating to auth');
                setUser(null);
                setLoading(false);
                safeNavigate('/(auth)');
              }
            } catch (error) {
              if (!isMounted) return;
              console.error('Error handling auth state change:', error);
              setLoading(false);
              safeNavigate('/(auth)');
            }
          }
        });

        return authListener?.subscription;
      } catch (error) {
        console.error('Auth listener setup error:', error);
        if (!isMounted) return;

        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying listener setup in ${delay}ms`);
          setTimeout(() => {
            if (!isMounted) return;
            const subscription = setupAuthListener(retryCount + 1);
            if (subscription) {
              return () => subscription.unsubscribe();
            }
          }, delay);
        }
      }
    };

    initializeAuth();
    const subscription = setupAuthListener();

    return () => {
      console.log('Auth effect cleanup');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isNavigationReady]);

  async function getUser(userId: string) {
    console.log('Fetching user data for ID:', userId);
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('User record not found, waiting for creation');
          return null;
        }
        console.error('GetUser error:', error);
        return null;
      }
      console.log('User data retrieved:', data.email);
      setUser(data);
      return data;
    } catch (error) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  async function signIn(email: string, password: string) {
    console.log('Attempting signIn with:', email);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('signIn result:', error ? 'Error' : 'Success', data?.session ? 'Session exists' : 'No session');

      if (error) {
        console.error('SignIn error:', error);
        throw error;
      }

      if (data.session?.user.id) {
        console.log('Session found for user:', data.session.user.id);
        const userData = await getUser(data.session.user.id);
        console.log('Fetched userData:', userData ? 'exists' : 'null');

        if (userData) {
          console.log('Navigating to /(tabs)');
          safeNavigate('/(tabs)');
        } else {
          console.log('Navigating to /(auth)');
          safeNavigate('/(auth)');
        }
      } else {
        console.log('No user session found in data.session');
      }
    } catch (error) {
      console.error('SignIn function error:', error);
      throw error;
    } finally {
      console.log('signIn finished. Setting loading to false.');
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, username: string) {
    console.log('Attempting signUp with:', email);
    const response = await authHandleSignUp(email, password, username);
    if (response.error) {
      console.error('SignUp error:', response.error);
      throw response.error;
    }
    console.log('SignUp successful, waiting for email verification');
  }

  async function signOut() {
    console.log('Signing out');
    await supabase.auth.signOut();
    setUser(null);
    safeNavigate('/(auth)');
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