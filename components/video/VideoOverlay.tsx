import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LikeButton } from './LikeButton';
import { Video } from '../../hooks/useVideos';
import Animated, { FadeIn } from 'react-native-reanimated';

interface VideoOverlayProps {
  video: Video;
  bottomInset: number;
}

export function VideoOverlay({ video, bottomInset }: VideoOverlayProps) {
  return (
    <>
      {/* Video Info */}
      <Animated.View 
        entering={FadeIn.duration(200)}
        style={[
          styles.infoOverlay,
          { bottom: Platform.OS === 'ios' ? bottomInset + 70 : 70 }
        ]}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{video.caption || video.title}</Text>
          <Text style={styles.username}>@{video.creator.username}</Text>
        </View>
      </Animated.View>

      {/* Right Side Interaction Bar */}
      <Animated.View 
        entering={FadeIn.duration(200)}
        style={[
          styles.interactionBar,
          { bottom: Platform.OS === 'ios' ? bottomInset + 100 : 100 }
        ]}
      >
        <View style={styles.interactionItem}>
          <LikeButton
            videoId={video.id}
            initialLikeCount={video.likesCount}
            initialIsLiked={video.isLikedByCurrentUser || false}
            size={35}
          />
          <Text style={styles.interactionCount}>
            {video.likesCount.toLocaleString()}
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  infoOverlay: {
    position: 'absolute',
    left: 20,
    right: 80, // Make space for interaction bar
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    marginBottom: 10,
  },
  infoContainer: {
    flex: 1,
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
  interactionBar: {
    position: 'absolute',
    right: 10,
    width: 60,
    alignItems: 'center',
  },
  interactionItem: {
    alignItems: 'center',
    marginBottom: 15,
  },
  interactionCount: {
    color: 'white',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '600',
  },
}); 