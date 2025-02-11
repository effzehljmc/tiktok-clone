import { Share } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { Video as VideoType } from '../../hooks/useVideos';
import { useVideoMetrics } from '../../hooks/useVideoMetrics';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoOverlay } from './VideoOverlay';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, FlatList, Dimensions, StyleSheet, ListRenderItemInfo, TouchableOpacity, StatusBar, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Header from '../header';
import { VideoCategory } from '@prisma/client';

interface VideoFeedProps {
  videos: VideoType[];
  renderVideoOverlay?: (video: VideoType) => React.ReactNode;
  showSearchIcon?: boolean;
}

export function VideoFeed({ videos, renderVideoOverlay, showSearchIcon = true }: VideoFeedProps) {
  const { trackVideoMetrics } = useVideoMetrics();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState<{ [key: string]: AVPlaybackStatus }>({});
  const windowHeight = Dimensions.get('window').height;
  const videoRefs = useRef<{ [key: string]: ExpoVideo | null }>({});
  const flatListRef = useRef<FlatList>(null);
  const scrollingRef = useRef(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();

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
      height: windowHeight,
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
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('light-content');
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

  // Effect to scroll to the video when videoId is provided
  useEffect(() => {
    if (videoId && videos) {
      const index = videos.findIndex(video => video.id === videoId);
      
      if (index !== -1) {
        // Use requestAnimationFrame to ensure the scroll happens after any layout updates
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0
          });
          setActiveVideoIndex(index);
        });
      }
    }
  }, [videoId, videos]);

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

  const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / windowHeight);
    
    if (index !== activeVideoIndex) {
      setActiveVideoIndex(index);
    }
    scrollingRef.current = false;
  }, [activeVideoIndex, windowHeight]);

  const handleScrollBeginDrag = useCallback(() => {
    scrollingRef.current = true;
  }, []);

  const getItemLayout = useCallback((_: ArrayLike<VideoType> | null | undefined, index: number) => ({
    length: windowHeight,
    offset: windowHeight * index,
    index,
  }), [windowHeight]);

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
    if (!creatorId) {
      console.error('No creator ID provided');
      return;
    }

    router.push({
      pathname: "/creator-profile",
      params: { id: creatorId }
    });
  }, [router]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<VideoType>) => (
    <View style={[styles.videoContainer]}>
      <ExpoVideo
        ref={(ref) => videoRefs.current[item.id] = ref}
        source={{ uri: item.url }}
        posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={index === activeVideoIndex && !scrollingRef.current}
        isLooping
        useNativeControls={false}
        onError={(error) => {
          console.error(`Video playback error for ${item.title}:`, error);
          // Fallback für iOS 18
          if (Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 18) {
            // Versuche Video neu zu laden
            const videoRef = videoRefs.current[item.id];
            if (videoRef) {
              videoRef.loadAsync({ uri: item.url }, {}, false)
                .catch(e => console.error('Reload failed:', e));
            }
          }
        }}
        onPlaybackStatusUpdate={(status) => {
          const prevStatus = videoStatus[item.id];
          setVideoStatus(prev => ({
            ...prev,
            [item.id]: status
          }));
          trackVideoMetrics(item.id, status, prevStatus);
        }}
        progressUpdateIntervalMillis={500}
        shouldCorrectPitch={false}
        isMuted={false}
        volume={1.0}
        rate={1.0}
      />
      {renderVideoOverlay ? renderVideoOverlay(item) : (
        <VideoOverlay 
          video={item} 
          bottomInset={insets.bottom}
          onShare={() => handleShare(item)}
          onCommentPress={() => handleCommentPress(item.id)}
          onProfilePress={() => handleProfilePress(item.creator.id)}
        />
      )}
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
  ), [handlePlayPause, handleShare, handleCommentPress, handleProfilePress, insets.bottom, renderVideoOverlay, videoStatus, activeVideoIndex]);

  if (!videos) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        getItemLayout={getItemLayout}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={styles.flatListContent}
      />
      {showSearchIcon && (
        <Header />
      )}
    </View>
  );
} 