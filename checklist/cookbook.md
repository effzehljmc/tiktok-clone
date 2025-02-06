I'll present a streamlined implementation plan that incorporates the most important improvements while maintaining simplicity.

# Cookbook Feature Implementation Plan

### 1. Database Schema (Using Prisma)

First, let's define our schema in `prisma/schema.prisma`:

```prisma
model SavedRecipe {
  id        String   @id @default(dbgenerated("uuid_generate_v4()"))
  userId    String   @map("user_id")
  videoId   String   @map("video_id")
  savedAt   DateTime @default(now()) @map("saved_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@map("saved_recipes")
}
```

### 2. TypeScript Types

Create `types/saved-recipe.ts`:

```typescript
export interface SavedRecipe {
  id: string;
  userId: string;
  videoId: string;
  savedAt: Date;
  video?: Video; // Include related video data
}
```

### 3. Data Management with React Query

Create `hooks/useSavedRecipes.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';

export function useSavedRecipes(userId: string) {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  
  const query = useQuery({
    queryKey: ['savedRecipes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select(`
          *,
          video:videos(*)
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('saved_recipes')
        .insert({ user_id: userId, video_id: videoId });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', userId] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .match({ user_id: userId, video_id: videoId });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', userId] });
    },
  });

  return {
    savedRecipes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    saveRecipe: saveMutation.mutate,
    unsaveRecipe: unsaveMutation.mutate,
    isSaving: saveMutation.isLoading || unsaveMutation.isLoading,
  };
}
```

### 4. UI Components

Create `components/recipe/SaveButton.tsx`:

```typescript
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';

interface SaveButtonProps {
  videoId: string;
  userId: string;
  size?: number;
}

export function SaveButton({ videoId, userId, size = 24 }: SaveButtonProps) {
  const { savedRecipes, saveRecipe, unsaveRecipe, isSaving } = useSavedRecipes(userId);
  const isSaved = savedRecipes.some(recipe => recipe.videoId === videoId);

  const handlePress = () => {
    if (isSaved) {
      unsaveRecipe(videoId);
    } else {
      saveRecipe(videoId);
    }
  };

  return (
    <Pressable 
      onPress={handlePress}
      disabled={isSaving}
      accessibilityLabel={isSaved ? 'Unsave recipe' : 'Save recipe'}
      accessibilityRole="button"
    >
      <Ionicons 
        name={isSaved ? 'bookmark' : 'bookmark-outline'} 
        size={size} 
        color={isSaved ? '#FF3B30' : '#000000'} 
      />
    </Pressable>
  );
}
```

### 5. Cookbook Screen

Create `app/(tabs)/cookbook.tsx`:

```typescript
import { FlashList } from '@shopify/flash-list';
import { View, Text } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import { RecipeCard } from '../../components/recipe/RecipeCard';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';

export default function CookbookScreen() {
  const { user } = useAuth();
  const { savedRecipes, isLoading, error } = useSavedRecipes(user?.id);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;
  if (!savedRecipes.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No saved recipes yet</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={savedRecipes}
      renderItem={({ item }) => (
        <RecipeCard recipe={item.video} />
      )}
      estimatedItemSize={300}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}
```

### 6. Update Tab Navigation

Update `app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      {/* ... existing tabs ... */}
      <Tabs.Screen
        name="cookbook"
        options={{
          title: 'Cookbook',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 7. Testing Strategy

Create basic tests in `__tests__/cookbook.test.tsx`:

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CookbookScreen } from '../app/(tabs)/cookbook';

describe('CookbookScreen', () => {
  it('shows loading state initially', () => {
    const { getByTestId } = render(<CookbookScreen />);
    expect(getByTestId('loading-view')).toBeTruthy();
  });

  it('shows empty state when no recipes are saved', async () => {
    const { getByText } = render(<CookbookScreen />);
    await waitFor(() => {
      expect(getByText('No saved recipes yet')).toBeTruthy();
    });
  });
});
```

### 8. Deployment Steps

1. Generate and run Prisma migrations:
```bash
npx prisma generate
npx prisma migrate dev --name add_saved_recipes
```

2. Update Supabase policies to secure the saved_recipes table:
```sql
CREATE POLICY "Users can read their own saved recipes"
ON saved_recipes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes"
ON saved_recipes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their recipes"
ON saved_recipes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

This implementation:
- Uses Prisma for type-safe database operations
- Leverages React Query for efficient data fetching and caching
- Uses FlashList for better performance with long lists
- Includes basic accessibility support
- Maintains a simple and clean architecture
- Includes proper TypeScript types
- Follows the established project structure
- Includes basic testing setup

Would you like me to elaborate on any part of this implementation?
