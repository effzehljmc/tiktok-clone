import { useState, useCallback } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform, NativeModules } from 'react-native';

interface WhisperVoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  results: string[];
  error?: string;
}

export function useWhisperVoice() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [state, setState] = useState<WhisperVoiceState>({
    isRecording: false,
    isProcessing: false,
    results: [],
  });

  const startRecording = useCallback(async () => {
    try {
      // Reset state first
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: undefined 
      }));
      setRecording(null);

      console.log('🎤 Requesting permissions..');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio session with more specific settings
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Wait a bit for audio session to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎙 Starting recording..');
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setState(prev => ({ 
        ...prev, 
        isRecording: true,
        error: undefined 
      }));

    } catch (err) {
      console.error('Failed to start recording', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to start recording',
        isRecording: false,
      }));
      setRecording(null);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recording) {
        console.log('No active recording to stop');
        return;
      }

      console.log('🛑 Stopping recording..');
      setState(prev => ({ ...prev, isProcessing: true, isRecording: false }));
      
      try {
        await recording.stopAndUnloadAsync();
      } catch (err) {
        console.log('Error stopping recording (might be already stopped):', err);
        // If we're in the simulator and get an error, create a mock response for testing
        if (Platform.OS === 'ios' && !NativeModules.DeviceInfo.isDevice) {
          setState(prev => ({
            ...prev,
            results: [...prev.results, "Test Aufnahme im Simulator"],
            isRecording: false,
            isProcessing: false,
            error: undefined,
          }));
          return;
        }
      }
      
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI available');

      console.log('📝 Transcribing audio...');
      const response = await transcribeAudio(uri);
      
      if (response.text) {
        setState(prev => ({
          ...prev,
          results: [...prev.results, response.text],
          isRecording: false,
          isProcessing: false,
          error: undefined,
        }));
      }

    } catch (err) {
      console.error('Failed to process recording', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to process recording',
        isRecording: false,
        isProcessing: false,
      }));
    } finally {
      // Always cleanup the recording
      setRecording(null);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.log('Error resetting audio mode:', err);
      }
    }
  }, [recording]);

  async function transcribeAudio(uri: string): Promise<{ text: string }> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'de');

      // Send to OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Transcription failed:', err);
      throw err;
    }
  }

  return {
    ...state,
    startRecording,
    stopRecording,
  };
} 