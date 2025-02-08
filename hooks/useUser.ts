import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface UserPreferences {
  dietTags: string[];
  dislikedIngredients: string[];
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({ dietTags: [], dislikedIngredients: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('diet_tags, disliked_ingredients')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setPreferences({
        dietTags: data.diet_tags || [],
        dislikedIngredients: data.disliked_ingredients || []
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  }, []);

  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('User')
        .update({
          diet_tags: newPreferences.dietTags ?? preferences.dietTags,
          disliked_ingredients: newPreferences.dislikedIngredients ?? preferences.dislikedIngredients
        })
        .eq('id', user.id);

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        ...newPreferences
      }));
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }, [user, preferences]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchPreferences(currentUser.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchPreferences(currentUser.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPreferences]);

  return { 
    user, 
    isLoading,
    preferences,
    updatePreferences
  };
} 