import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import * as RNLocalize from 'react-native-localize';
import { useLanguage } from '../context/LanguageContext';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isAvailable: boolean;
  error: string | null;
  partialResults: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  hasPermission: boolean;
}

export function useSpeechRecognition(
  onResult: (text: string) => void,
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partialResults, setPartialResults] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const { t } = useLanguage();
  const onResultRef = useRef(onResult);
  const availabilityCheckedRef = useRef(false);
  const hasDeliveredResult = useRef(false);

  // Keep the callback ref updated
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    const permission: Permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

    try {
      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        const granted = requestResult === RESULTS.GRANTED;
        setHasPermission(granted);
        return granted;
      }

      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          t('speech_permission_denied') || 'Permission Required',
          t('speech_permission_settings') || 'Please enable microphone access in Settings.',
          [{ text: 'OK' }],
        );
        setHasPermission(false);
        return false;
      }

      setHasPermission(false);
      return false;
    } catch (err) {
      console.error('Error checking microphone permission:', err);
      setHasPermission(false);
      return false;
    }
  }, [t]);

  // Initialize Voice
  useEffect(() => {
    const onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const recognizedText = e.value[0];
        setPartialResults(recognizedText);
        if (!hasDeliveredResult.current) {
          hasDeliveredResult.current = true;
          onResultRef.current(recognizedText);
        }
      }
    };

    const onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setPartialResults(e.value[0]);
      }
    };

    const onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Speech error:', e);
      setError(t('speech_error') || 'Speech recognition error occurred.');
      setIsListening(false);
    };

    const onSpeechEnd = () => {
      setIsListening(false);
    };

    // Set up Voice event listeners
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [t]);

  const startListening = useCallback(async () => {
    setError(null);
    setPartialResults('');
    hasDeliveredResult.current = false;

    // Check availability lazily (only on first use)
    if (!availabilityCheckedRef.current) {
      availabilityCheckedRef.current = true;
      try {
        const available = await Voice.isAvailable();
        const isVoiceAvailable = Boolean(available);
        setIsAvailable(isVoiceAvailable);
        if (!isVoiceAvailable) {
          Alert.alert(
            t('speech_not_available') || 'Not Available',
            t('speech_not_available_message') || 'Speech recognition is not available on this device.',
            [{ text: 'OK' }],
          );
          return;
        }
      } catch {
        setIsAvailable(false);
        Alert.alert(
          t('speech_not_available') || 'Not Available',
          t('speech_not_available_message') || 'Speech recognition is not available on this device.',
          [{ text: 'OK' }],
        );
        return;
      }
    } else if (!isAvailable) {
      Alert.alert(
        t('speech_not_available') || 'Not Available',
        t('speech_not_available_message') || 'Speech recognition is not available on this device.',
        [{ text: 'OK' }],
      );
      return;
    }

    const permitted = await checkMicrophonePermission();
    if (!permitted) {
      return;
    }

    try {
      // Use device locale for speech recognition (reflects keyboard language)
      const locales = RNLocalize.getLocales();
      const languageTag = locales[0]?.languageTag || 'en-US';
      await Voice.start(languageTag);
      setIsListening(true);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError(t('speech_error') || 'Failed to start speech recognition.');
    }
  }, [checkMicrophonePermission, isAvailable, t]);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, []);

  return {
    isListening,
    isAvailable,
    error,
    partialResults,
    startListening,
    stopListening,
    hasPermission,
  };
}
