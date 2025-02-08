import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { VideoCategory } from '@prisma/client';
import { useVideoSearch } from '../../hooks/useVideoSearch';
import { formatDistanceToNow } from 'date-fns';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

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

interface SearchResultsProps {
  query: string;
  category?: VideoCategory;
  dietaryPreference?: string;
  onClose: () => void;
}

export default function SearchResults({ query, category, dietaryPreference, onClose }: SearchResultsProps) {
  const router = useRouter();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useVideoSearch({ query, category, dietaryPreference });

  const allVideos = data?.pages.flat() ?? [];

  const handleVideoPress = useCallback((videoId: string) => {
    onClose();
    setTimeout(() => {
      router.replace({
        pathname: "/",
        params: { videoId }
      });
    }, 100);
  }, [router, onClose]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'some time ago';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.whiteAlpha30} />
        <Text style={styles.errorTitle}>Failed to load search results</Text>
        <Text style={styles.errorSubtitle}>{error?.message}</Text>
      </View>
    );
  }

  if (!allVideos || allVideos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search-outline" size={48} color={COLORS.whiteAlpha30} />
        <Text style={styles.emptyTitle}>No videos found</Text>
        <Text style={styles.emptySubtitle}>
          Try a different search term{category ? ' or category' : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allVideos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleVideoPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.thumbnailContainer}>
                <Image
                  source={item.thumbnailUrl || undefined}
                  style={styles.thumbnail}
                  contentFit="cover"
                  transition={200}
                />
              </View>
              <View style={styles.textContent}>
                <View>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <View style={styles.metaContainer}>
                  <View style={styles.stat}>
                    <Ionicons name="time-outline" size={14} color={COLORS.whiteAlpha60} />
                    <Text style={styles.metaText}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="eye-outline" size={14} color={COLORS.whiteAlpha60} />
                    <Text style={styles.metaText}>
                      {item.viewsCount} {item.viewsCount === 1 ? 'view' : 'views'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
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
  resultCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha10,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.whiteAlpha05,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.whiteAlpha60,
    lineHeight: 18,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.whiteAlpha60,
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
  },
}); 