import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { useLike } from '../../hooks/useLike';

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

interface LikeButtonProps {
  videoId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  size?: number;
  color?: string;
}

export function LikeButton({ 
  videoId, 
  initialLikeCount, 
  initialIsLiked,
  size = 30,
  color = 'white'
}: LikeButtonProps) {
  const { isLiked, toggleLike, isLoading } = useLike({
    videoId,
    initialLikeCount,
    initialIsLiked,
  });

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = async () => {
    if (isLoading) return;

    // Trigger animation
    scale.value = withSequence(
      withSpring(1.2, { damping: 2 }),
      withSpring(0.8),
      withSpring(1)
    );

    await toggleLike();
  };

  return (
    <Pressable 
      onPress={handlePress} 
      style={styles.container}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      pressRetentionOffset={{ top: 20, left: 20, right: 20, bottom: 20 }}
    >
      <AnimatedIcon
        name={isLiked ? 'heart' : 'heart-outline'}
        size={size}
        color={isLiked ? '#ff2d55' : color}
        style={animatedStyle}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 