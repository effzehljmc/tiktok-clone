import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWhisperVoice } from '@/hooks/useWhisperVoice';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '@rneui/themed';

interface VoiceButtonProps {
  onRecognized: (text: string) => void;
  disabled?: boolean;
  style?: any;
}

export function VoiceButton({ onRecognized, disabled, style }: VoiceButtonProps) {
  const { 
    isRecording,
    isProcessing,
    results,
    error,
    startRecording,
    stopRecording,
  } = useWhisperVoice();

  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
      if (results.length > 0) {
        onRecognized(results[results.length - 1]); // Use the latest result
      }
    } else {
      await startRecording();
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isProcessing}
        className={`p-2 rounded-full ${(disabled || isProcessing) ? 'opacity-50' : ''} flex-row items-center`}
        style={style}
      >
        {isRecording ? (
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut}
            className="flex-row items-center gap-2"
          >
            <ActivityIndicator size="small" color="red" />
            <TouchableOpacity 
              onPress={stopRecording}
              className="bg-red-100 rounded-full p-1"
            >
              <Ionicons name="stop" size={16} color="red" />
            </TouchableOpacity>
          </Animated.View>
        ) : isProcessing ? (
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut}
            className="flex-row items-center gap-2"
          >
            <ActivityIndicator size="small" color="#000" />
            <Text className="text-xs">Verarbeite...</Text>
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
      
      {isRecording && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          className="absolute -top-8 right-0 bg-blue-50 px-2 py-1 rounded-lg min-w-[80px]"
        >
          <Text className="text-blue-500 text-xs text-center">
            Aufnahme läuft...
          </Text>
        </Animated.View>
      )}

      {results.length > 0 && !isRecording && !isProcessing && (
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          className="absolute -top-8 right-0 bg-green-50 px-2 py-1 rounded-lg"
        >
          <Text className="text-green-500 text-xs">Erkannt!</Text>
        </Animated.View>
      )}
    </View>
  );
} 