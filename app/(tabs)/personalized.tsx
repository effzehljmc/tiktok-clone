import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { usePersonalizedVideos } from '@/hooks/usePersonalizedVideos';
import VideoCard from '@/components/videos/VideoCard';
import { ErrorView } from '@/components/common/ErrorView';

export default function PersonalizedFeedScreen() {
  const {
    videos,
    isLoading,
    hasMore,
    error,
    loadMore
  } = usePersonalizedVideos();

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorView 
          error={error} 
          message="Couldn't load personalized videos"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Personalized Feed',
          headerShown: false,
        }}
      />
      
      <FlashList
        data={videos}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            showScore={true}
          />
        )}
        estimatedItemSize={300}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => (
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No personalized videos yet</Text>
              <Text style={styles.subtitleText}>
                Watch and interact with videos to get personalized recommendations
              </Text>
            </View>
          )
        )}
        ListFooterComponent={() => (
          hasMore && (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
}); 