import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '@rneui/themed';

interface VoiceButtonProps {
  onRecognized: (text: string) => void;
  disabled?: boolean;
  style?: any;
}

export function VoiceButton({ onRecognized, disabled, style }: VoiceButtonProps) {
  const { 
    isListening, 
    results, 
    error,
    startListening, 
    stopListening 
  } = useVoiceCommands();

  const handlePress = async () => {
    if (isListening) {
      await stopListening();
      if (results.length > 0) {
        onRecognized(results[0]); // Use the first result
      }
    } else {
      await startListening();
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        className={`p-2 rounded-full ${disabled ? 'opacity-50' : ''}`}
        style={style}
      >
        {isListening ? (
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut}
          >
            <ActivityIndicator size="small" color="#000" />
          </Animated.View>
        ) : (
          <Ionicons 
            name="mic" 
            size={24} 
            color={disabled ? 'gray' : 'black'} 
          />
        )}
      </TouchableOpacity>
      
      {error && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          className="absolute -top-8 right-0 bg-red-50 px-2 py-1 rounded-lg"
        >
          <Text className="text-red-500 text-xs">{error}</Text>
        </Animated.View>
      )}
      
      {isListening && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          className="absolute -top-8 right-0 bg-blue-50 px-2 py-1 rounded-lg"
        >
          <Text className="text-blue-500 text-xs">Listening...</Text>
        </Animated.View>
      )}
    </View>
  );
} 