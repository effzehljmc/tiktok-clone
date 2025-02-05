import React, { useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { VideoCategory } from '@prisma/client';
import { useVideoSearch } from '../../hooks/useVideoSearch';
import { formatDistanceToNow, parseISO } from 'date-fns';

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

  console.log('SearchResults render:', {
    query,
    category,
    dietaryPreference,
    hasData: !!data,
    pageCount: data?.pages.length,
    isLoading,
    isError,
    error,
    rawData: data?.pages
  });

  const allVideos = data?.pages.flat() ?? [];
  console.log('All videos:', allVideos);

  const handleVideoPress = useCallback((videoId: string) => {
    console.log('Video pressed:', videoId);
    // First close the overlay
    onClose();
    // Use setTimeout to ensure the overlay is closed before navigation
    setTimeout(() => {
      router.replace({
        pathname: "/",
        params: { videoId }
      });
    }, 100);
  }, [router, onClose]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      console.log('No date string provided');
      return 'some time ago';
    }
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, { dateString });
      return 'some time ago';
    }
  };

  if (isLoading) {
    console.log('Showing loading state');
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    console.error('Search error:', error);
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500">Failed to load search results</Text>
        <Text className="text-gray-500 text-sm mt-2">{error?.message}</Text>
      </View>
    );
  }

  if (!allVideos || allVideos.length === 0) {
    console.log('No videos found');
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500">No videos found</Text>
        <Text className="text-gray-400 text-sm mt-2">
          Try a different search term{category ? ' or category' : ''}
        </Text>
      </View>
    );
  }

  console.log('Rendering video list with:', allVideos.length, 'videos');

  return (
    <View className="flex-1 bg-white" style={{ minHeight: 200 }}>
      <FlatList
        data={allVideos}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: 20,
          flexGrow: 1
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            console.log('Loading next page');
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : null
        )}
        renderItem={({ item }) => {
          console.log('Rendering video item:', item);
          return (
            <TouchableOpacity
              key={item.id}
              className="flex-row p-4 border-b border-gray-200 bg-white active:bg-gray-100"
              onPress={() => handleVideoPress(item.id)}
            >
              <View className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                <Image
                  source={{ uri: item.thumbnailUrl || undefined }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1 ml-4 justify-between">
                <View>
                  <Text className="font-medium text-base text-gray-900" numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center mt-2">
                  <Text className="text-gray-500 text-xs">
                    {formatDate(item.createdAt)}
                  </Text>
                  <Text className="text-gray-500 text-xs mx-2">•</Text>
                  <Text className="text-gray-500 text-xs">
                    {item.viewsCount} {item.viewsCount === 1 ? 'view' : 'views'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
} 