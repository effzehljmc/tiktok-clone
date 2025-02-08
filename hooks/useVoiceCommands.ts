import { useState, useEffect, useCallback } from 'react';
import Voice, { 
  SpeechResultsEvent, 
  SpeechErrorEvent 
} from '@react-native-voice/voice';
import { Audio } from 'expo-av';

interface VoiceState {
  isListening: boolean;
  recognized: boolean;
  started: boolean;
  results: string[];
  error?: string;
}

export function useVoiceCommands() {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    recognized: false,
    started: false,
    results: [],
  });

  useEffect(() => {
    function onSpeechStart() {
      setState(prev => ({
        ...prev,
        started: true,
        isListening: true,
      }));
    }

    function onSpeechRecognized() {
      setState(prev => ({
        ...prev,
        recognized: true,
      }));
    }

    function onSpeechResults(e: SpeechResultsEvent) {
      setState(prev => ({
        ...prev,
        results: e.value ?? [],
      }));
    }

    function onSpeechError(e: SpeechErrorEvent) {
      setState(prev => ({
        ...prev,
        error: e.error?.message,
        isListening: false,
      }));
    }

    // Setup voice event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Cleanup
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const checkPermissions = useCallback(async () => {
    try {
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Audio.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }
      
      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to get microphone permission',
      }));
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      setState(prev => ({ ...prev, error: undefined }));
      await Voice.start('en-US');
    } catch (e) {
      setState(prev => ({
        ...prev,
        error: e instanceof Error ? e.message : 'Failed to start voice recognition',
        isListening: false,
      }));
    }
  }, [checkPermissions]);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setState(prev => ({
        ...prev,
        isListening: false,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        error: e instanceof Error ? e.message : 'Failed to stop voice recognition',
        isListening: false,
      }));
    }
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
  };
} 