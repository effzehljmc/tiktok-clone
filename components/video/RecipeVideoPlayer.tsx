import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from '../recipe/SaveButton';
import { useAuth } from '@/hooks/useAuth';
import { useRef, useState } from 'react';

interface RecipeVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  onShowDetails: () => void;
}

export function RecipeVideoPlayer({ videoUrl, videoId, onShowDetails }: RecipeVideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useAuth();

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View className="flex-1 bg-black">
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={{ flex: 1 }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={false}
        onPlaybackStatusUpdate={status => {
          if (status && 'isPlaying' in status) {
            setIsPlaying(status.isPlaying);
          }
        }}
      />
      
      {/* Overlay Controls */}
      <View className="absolute inset-0 justify-center items-center">
        <Pressable onPress={togglePlayback}>
          <View className="w-20 h-20 rounded-full bg-black/50 items-center justify-center">
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="white"
            />
          </View>
        </Pressable>
      </View>

      {/* Bottom Controls */}
      <View className="absolute bottom-0 left-0 right-0 p-4 flex-row justify-between items-center bg-black/50">
        <TouchableOpacity
          onPress={onShowDetails}
          className="flex-row items-center bg-white/20 px-4 py-2 rounded-full"
        >
          <Ionicons name="information-circle-outline" size={24} color="white" />
          <Text className="text-white ml-2">Recipe Details</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity className="bg-white/20 p-3 rounded-full">
            <SaveButton
              videoId={videoId}
              userId={user.id}
              size={32}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
} 
