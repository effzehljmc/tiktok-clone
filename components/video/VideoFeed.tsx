import { View, Text, FlatList, Dimensions, StyleSheet, ListRenderItemInfo, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { useVideos, Video as VideoType } from '../../hooks/useVideos';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export function VideoFeed() {
  const { data: videos, isLoading } = useVideos();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState<{ [key: string]: AVPlaybackStatus }>({});
  const windowHeight = Dimensions.get('window').height;
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const flatListRef = useRef<FlatList>(null);

  // Effect to pause other videos when active index changes
  useEffect(() => {
    if (!videos) return;
    
    videos.forEach((video, index) => {
      if (index !== activeVideoIndex && videoRefs.current[video.id]) {
        videoRefs.current[video.id]?.pauseAsync();
      }
    });
  }, [activeVideoIndex, videos]);

  const handlePlayPause = useCallback(async (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    const status = videoStatus[videoId];
    if (!status?.isLoaded) return;

    if ((status as AVPlaybackStatusSuccess).isPlaying) {
      await video.pauseAsync();
    } else {
      // Pause all other videos before playing the current one
      Object.entries(videoRefs.current).forEach(([id, ref]) => {
        if (id !== videoId && ref) {
          ref.pauseAsync();
        }
      });
      await video.playAsync();
    }
  }, [videoStatus]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / windowHeight);
    
    if (index !== activeVideoIndex) {
      setActiveVideoIndex(index);
      
      // Ensure proper snapping
      flatListRef.current?.scrollToOffset({
        offset: index * windowHeight,
        animated: true
      });
    }
  }, [activeVideoIndex, windowHeight]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<VideoType>) => (
    <View style={[styles.videoContainer, { height: windowHeight }]}>
      <Video
        ref={(ref) => videoRefs.current[item.id] = ref}
        source={{ uri: item.url }}
        posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={index === activeVideoIndex}
        isLooping
        useNativeControls={false}
        onError={(error) => {
          console.error(`Video playback error for ${item.title}:`, error);
        }}
        onPlaybackStatusUpdate={(status) => {
          setVideoStatus(prev => ({
            ...prev,
            [item.id]: status
          }));
        }}
        progressUpdateIntervalMillis={500}
        shouldCorrectPitch={false}
        isMuted={false}
        volume={1.0}
        rate={1.0}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>{item.caption || item.title}</Text>
        <Text style={styles.username}>@{item.creator.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.playPauseButton}
        onPress={() => handlePlayPause(item.id)}
      >
        <Ionicons 
          name={videoStatus[item.id]?.isLoaded && (videoStatus[item.id] as AVPlaybackStatusSuccess)?.isPlaying ? 'pause' : 'play'} 
          size={50} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  ), [activeVideoIndex, windowHeight, videoStatus, handlePlayPause]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!videos?.length) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>Keine Videos verfügbar</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        snapToInterval={windowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: windowHeight,
          offset: windowHeight * index,
          index,
        })}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        initialNumToRender={1}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flatListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 90, // Adjusted to be above tab bar
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: 'white',
    marginTop: 4,
    fontSize: 14,
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 10,
  },
}); 