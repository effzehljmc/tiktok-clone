import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/header';

interface CreatorProfile {
  id: string;
  username: string;
  email: string;
  image?: string;
  bio?: string;
}

interface Video {
  id: string;
  thumbnailUrl: string | null;
  videoUrl: string;
  viewsCount: number;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GRID_SPACING = 1;
const THUMBNAIL_SIZE = (width - (COLUMN_COUNT + 1) * GRID_SPACING) / COLUMN_COUNT;

export default function CreatorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreatorProfile() {
      if (!id) {
        setError('No creator ID provided');
        setLoading(false);
        return;
      }

      try {
        // Load creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('User')
          .select('id, username, email, image, bio')
          .eq('id', id)
          .single();

        if (creatorError) {
          setError('Failed to load creator profile');
          throw creatorError;
        }

        if (!creatorData) {
          setError('Creator not found');
          setLoading(false);
          return;
        }

        setCreator(creatorData);

        // Load creator's videos
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('id, thumbnail_url, video_url, views_count')
          .eq('creator_id', id)
          .order('created_at', { ascending: false });

        if (videosError) {
          setError('Failed to load creator videos');
          throw videosError;
        }

        // Set video data
        const videos = (videosData || []).map(video => ({
          id: video.id,
          thumbnailUrl: video.thumbnail_url,
          videoUrl: video.video_url,
          viewsCount: video.views_count
        }));
        setVideos(videos);
      } catch (error) {
        console.error('Error loading creator profile:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadCreatorProfile();
  }, [id]);

  const handleVideoPress = (videoId: string) => {
    router.push({
      pathname: "/(tabs)",
      params: { videoId }
    });
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity 
      onPress={() => handleVideoPress(item.id)}
      style={styles.thumbnailContainer}
    >
      {item.thumbnailUrl ? (
        <Image
          source={item.thumbnailUrl}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Ionicons name="videocam" size={24} color="#666" />
        </View>
      )}
      <View style={styles.videoOverlay}>
        <Ionicons name="play" size={16} color="white" />
        <Text style={styles.viewCount}>
          {item.viewsCount >= 1000 
            ? `${(item.viewsCount / 1000).toFixed(1)}K` 
            : item.viewsCount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Header color="black" showBackButton />
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !creator) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Header color="black" showBackButton />
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorText}>{error || 'Creator not found'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header color="black" showBackButton />
      <FlatList
        ListHeaderComponent={
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {creator.image ? (
                <Image
                  source={creator.image}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
            </View>
            <Text style={styles.username}>@{creator.username}</Text>
            {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{videos.length}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
            </View>
          </View>
        }
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Noch keine Videos</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  gridContainer: {
    padding: GRID_SPACING,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    margin: GRID_SPACING / 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
  },
  viewCount: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 