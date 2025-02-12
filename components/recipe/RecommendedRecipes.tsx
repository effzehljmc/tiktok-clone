import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { RecommendationExplanation } from './RecommendationExplanation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { RecommendedVideo } from '@/types/recommendation';
import { COLORS } from '@/constants/Colors';

// Define theme colors for this component
const THEME = {
  ...COLORS,
  background: '#000000',
  surface: '#121212',
  surfaceLight: '#1a1a1a',
  cardBackground: '#1e1e1e',
  primary: '#2563eb',
} as const;

export function RecommendedRecipes() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Refetch recommendations when refreshKey changes
  const { data: allRecipes, isLoading, error } = useQuery<RecommendedVideo[]>({
    queryKey: ['recommendedRecipes', refreshKey],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('get_preference_based_recommendations', {
        p_user_id: user.id
      });
      if (error) throw error;
      return data;
    }
  });

  const handleFeedbackChange = useCallback(() => {
    // Increment refreshKey to trigger a refetch
    setRefreshKey(prev => prev + 1);
  }, []);

  console.log('RecommendedRecipes render state:', {
    isLoading,
    isError: error,
    hasNextPage: false,
    isFetchingNextPage: false,
    pagesCount: 1,
    error: error?.message
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME.primary} />
      </View>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to load recommendations
        </Text>
      </View>
    );
  }

  if (!allRecipes?.length) {
    console.log('Rendering empty state');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No recommendations available
        </Text>
      </View>
    );
  }

  console.log('Rendering recipe list with', allRecipes.length, 'items');
  return (
    <View style={styles.container}>
      <FlashList<RecommendedVideo>
        data={allRecipes}
        estimatedItemSize={300}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
              pathname: "/",
              params: { videoId: item.id }
            })}
            activeOpacity={0.7}
          >
            <Image
              source={item.thumbnailUrl}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
              style={styles.gradient}
            >
              <BlurView intensity={20} tint="dark" style={styles.contentContainer}>
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>

                  <RecommendationExplanation 
                    explanation={item.explanation} 
                    videoId={item.id}
                    userFeedback={item.user_feedback}
                    onFeedbackChange={handleFeedbackChange}
                  />

                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>

                <View style={styles.metaContainer}>
                  {item.recipe_metadata?.cookingTime && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={COLORS.whiteAlpha60} />
                      <Text style={styles.metaText}>
                        {item.recipe_metadata.cookingTime} min
                      </Text>
                    </View>
                  )}
                  {item.recipe_metadata?.difficulty && (
                    <View style={styles.metaItem}>
                      <Ionicons name="speedometer-outline" size={14} color={COLORS.whiteAlpha60} />
                      <Text style={styles.metaText}>
                        {item.recipe_metadata.difficulty}
                      </Text>
                    </View>
                  )}
                  {item.recipe_metadata?.cuisine && (
                    <View style={styles.metaItem}>
                      <Ionicons name="restaurant-outline" size={14} color={COLORS.whiteAlpha60} />
                      <Text style={styles.metaText}>
                        {item.recipe_metadata.cuisine}
                      </Text>
                    </View>
                  )}
                </View>

                {item.recipe_metadata?.dietaryTags?.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {item.recipe_metadata.dietaryTags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>
                          {tag.split('_').map(word => 
                            word.charAt(0) + word.slice(1).toLowerCase()
                          ).join(' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </BlurView>
            </LinearGradient>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  errorText: {
    color: COLORS.whiteAlpha90,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  emptyText: {
    color: COLORS.whiteAlpha90,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: THEME.cardBackground,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: THEME.surfaceLight,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 200,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  header: {
    gap: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: THEME.white,
    marginRight: 12,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: THEME.whiteAlpha90,
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: THEME.whiteAlpha60,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: THEME.surfaceLight,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: THEME.whiteAlpha90,
  },
}); 