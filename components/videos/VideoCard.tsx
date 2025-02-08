import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PersonalizedVideo } from '@/services/recommendations';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface VideoCardProps {
  video: PersonalizedVideo;
  showScore?: boolean;
}

export default function VideoCard({ video, showScore = false }: VideoCardProps) {
  return (
    <Link href={{
      pathname: '/(tabs)',
      params: { videoId: video.id }
    }} asChild>
      <Pressable style={styles.container}>
        {video.thumbnailUrl ? (
          <Image
            source={video.thumbnailUrl}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {video.title}
            </Text>
            {video.description && (
              <Text style={styles.description} numberOfLines={2}>
                {video.description}
              </Text>
            )}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={16} color="white" />
                <Text style={styles.statText}>{video.viewsCount}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={16} color="white" />
                <Text style={styles.statText}>{video.likesCount}</Text>
              </View>
              {showScore && (
                <View style={styles.stat}>
                  <Ionicons name="star-outline" size={16} color="white" />
                  <Text style={styles.statText}>
                    {video.personalizedScore.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
}); 
