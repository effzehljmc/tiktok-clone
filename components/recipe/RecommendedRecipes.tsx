import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRecommendedRecipes } from '@/hooks/useRecommendedRecipes';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { RecommendationExplanation } from './RecommendationExplanation';

const COLORS = {
  background: '#000000',
  surface: '#121212',
  surfaceLight: '#1a1a1a',
  cardBackground: '#1e1e1e',
  primary: '#2563eb',
  white: '#ffffff',
  whiteAlpha90: 'rgba(255,255,255,0.9)',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha30: 'rgba(255,255,255,0.3)',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha05: 'rgba(255,255,255,0.05)',
} as const;

export function RecommendedRecipes() {
  const router = useRouter();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useRecommendedRecipes();

  console.log('RecommendedRecipes render state:', {
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    pagesCount: data?.pages.length,
    error: error?.message
  });

  const allRecipes = data?.pages.flat() ?? [];

  if (isLoading) {
    console.log('Rendering loading state');
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    console.log('Rendering error state:', error);
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.whiteAlpha30} />
        <Text style={styles.errorTitle}>Failed to load recommendations</Text>
        <Text style={styles.errorSubtitle}>{error?.message}</Text>
      </View>
    );
  }

  if (!allRecipes.length) {
    console.log('Rendering empty state');
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="restaurant-outline" size={48} color={COLORS.whiteAlpha30} />
        <Text style={styles.emptyTitle}>No recommendations yet</Text>
        <Text style={styles.emptySubtitle}>
          Add some preferences in your profile to get personalized recommendations
        </Text>
      </View>
    );
  }

  console.log('Rendering recipe list with', allRecipes.length, 'items');
  return (
    <View style={styles.container}>
      <FlashList
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
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.whiteAlpha05,
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
    color: COLORS.white,
    marginRight: 12,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: COLORS.whiteAlpha90,
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
    color: COLORS.whiteAlpha60,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.whiteAlpha10,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.whiteAlpha90,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 15,
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 