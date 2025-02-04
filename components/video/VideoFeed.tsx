import { Share } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { useVideos, Video as VideoType } from '../../hooks/useVideos';
import { useVideoMetrics } from '../../hooks/useVideoMetrics';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoOverlay } from './VideoOverlay';
import { useRouter } from 'expo-router';
import { View, Text, FlatList, Dimensions, StyleSheet, ListRenderItemInfo, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Header from '../header';

export function VideoFeed() {
  const { data: videos, isLoading } = useVideos();
  const { trackVideoMetrics } = useVideoMetrics();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState<{ [key: string]: AVPlaybackStatus }>({});
  const windowHeight = Dimensions.get('window').height;
  const videoRefs = useRef<{ [key: string]: ExpoVideo | null }>({});
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    flatListContent: {
      flexGrow: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
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
      bottom: Platform.OS === 'ios' ? insets.bottom + 70 : 70,
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

  useEffect(() => {
    // StatusBar transparent und durchschimmernd machen
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('light-content');

    // Optional: Cleanup wenn gewünscht
    return () => {
      // Hier könnten wir die StatusBar zurücksetzen, wenn der VideoFeed unmountet
      // In diesem Fall lassen wir sie aber transparent
    };
  }, []);

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

  const handleShare = useCallback(async (video: VideoType) => {
    try {
      await Share.share({
        message: `Check out this video by @${video.creator.username}!`,
        url: video.url
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  }, []);

  const handleCommentPress = useCallback((videoId: string) => {
    router.push({
      pathname: "/comments",
      params: { videoId }
    });
  }, [router]);

  const handleProfilePress = useCallback((creatorId: string) => {
    router.push({
      pathname: "/(tabs)/profile",
      params: { userId: creatorId }
    } as any); // TODO: Remove 'as any' when proper type definitions are added
  }, [router]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<VideoType>) => (
    <View style={[styles.videoContainer, { height: windowHeight }]}>
      <ExpoVideo
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
          const prevStatus = videoStatus[item.id];
          setVideoStatus(prev => ({
            ...prev,
            [item.id]: status
          }));
          
          // Temporarily disable metrics tracking
          // if (status.isLoaded) {
          //   trackVideoMetrics(item.id, status, prevStatus);
          // }
        }}
        progressUpdateIntervalMillis={500}
        shouldCorrectPitch={false}
        isMuted={false}
        volume={1.0}
        rate={1.0}
      />
      <VideoOverlay 
        video={item} 
        bottomInset={insets.bottom}
        onShare={() => handleShare(item)}
        onCommentPress={() => handleCommentPress(item.id)}
        onProfilePress={() => handleProfilePress(item.creator.id)}
      />
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
  ), [activeVideoIndex, windowHeight, videoStatus, handlePlayPause, handleShare, handleCommentPress, handleProfilePress]);

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
      <Header color="white" />
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