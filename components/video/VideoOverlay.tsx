import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LikeButton } from './LikeButton';
import { Video } from '../../hooks/useVideos';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface VideoOverlayProps {
  video: Video;
  bottomInset: number;
  onShare?: () => void;
  onCommentPress?: () => void;
  onProfilePress?: () => void;
}

export function VideoOverlay({ 
  video, 
  bottomInset,
  onShare,
  onCommentPress,
  onProfilePress 
}: VideoOverlayProps) {
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
        {/* Like Button */}
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

        {/* Comments Button */}
        <TouchableOpacity style={styles.interactionItem} onPress={onCommentPress}>
          <MaterialCommunityIcons name="comment-outline" size={35} color="white" />
          <Text style={styles.interactionCount}>
            {video.commentsCount?.toLocaleString() || '0'}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.interactionItem} onPress={onShare}>
          <MaterialCommunityIcons name="share" size={35} color="white" />
          <Text style={styles.interactionCount}>Share</Text>
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity style={styles.interactionItem} onPress={onProfilePress}>
          {video.creator.avatarUrl ? (
            <Image
              source={video.creator.avatarUrl}
              style={styles.profileImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <FontAwesome name="user-circle-o" size={35} color="white" />
          )}
          <Text style={styles.interactionCount}>Profile</Text>
        </TouchableOpacity>
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
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#f0f0f0',
  },
}); 