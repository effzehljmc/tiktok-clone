import { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export function AuthListener() {
  const { getUser } = useAuth();

  useEffect(() => {
    let lastEvent: string | null = null;
    let lastUserId: string | null = null;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change detected:', {
        event,
        email: session?.user?.email,
        lastEvent,
        lastUserId,
        timestamp: new Date().toISOString()
      });
      
      // Update tracking variables
      lastEvent = event;
      lastUserId = session?.user?.id || null;

      if (event === 'SIGNED_IN' && session?.user.email_confirmed_at) {
        console.log('Processing SIGNED_IN event:', {
          userId: session.user.id,
          email: session.user.email,
          emailConfirmed: session.user.email_confirmed_at
        });

        try {
          const userData = await getUser(session.user.id);
          console.log('Fetched user data:', {
            success: !!userData,
            userId: userData?.id,
            email: userData?.email,
            timestamp: new Date().toISOString()
          });

          if (userData) {
            console.log('Navigating to tabs with user:', {
              id: userData.id,
              event,
              lastEvent,
              timestamp: new Date().toISOString()
            });
            router.replace('/(tabs)');
          } else {
            console.log('No user data found, staying on auth screen:', {
              sessionUserId: session.user.id,
              event,
              lastEvent
            });
            router.replace('/(auth)');
          }
        } catch (error) {
          console.error('Error fetching user data:', {
            error,
            userId: session.user.id,
            event,
            lastEvent
          });
          router.replace('/(auth)');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Processing SIGNED_OUT event:', {
          lastEvent,
          lastUserId,
          timestamp: new Date().toISOString()
        });
        router.replace('/(auth)');
      }
    });

    return () => {
      console.log('Cleaning up auth listener:', {
        lastEvent,
        lastUserId,
        timestamp: new Date().toISOString()
      });
      authListener.subscription.unsubscribe();
    };
  }, [getUser]);

  return null;
} 