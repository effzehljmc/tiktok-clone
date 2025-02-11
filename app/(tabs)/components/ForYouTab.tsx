import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { VideoFeed } from '@/components/video/VideoFeed';
import { useVideos } from '@/hooks/useVideos';

export function ForYouTab() {
  const { data: videos, isLoading, error } = useVideos();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    console.error('Error loading videos:', error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>Could not load videos. Please try again.</Text>
      </View>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>No videos available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoFeed videos={videos} showSearchIcon={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
}); 