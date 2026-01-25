import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
  Text,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import FeedbackService from '../services/FeedbackService';

interface MicrophoneFABProps {
  onTextReceived: (text: string) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const MicrophoneFAB: React.FC<MicrophoneFABProps> = ({
  onTextReceived,
  style,
  disabled = false,
}) => {
  const { themeDefinition } = useTheme();
  const { scale } = useResponsive();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const {
    isListening,
    isAvailable,
    startListening,
    stopListening,
  } = useSpeechRecognition(onTextReceived);

  // Pulsing animation when listening
  useEffect(() => {
    if (isListening) {
      pulseAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimRef.current.start();
    } else {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
      pulseAnim.setValue(1);
    }

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
    };
  }, [isListening, pulseAnim]);

  const handlePress = async () => {
    FeedbackService.buttonTap();

    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  if (!isAvailable) {
    return null;
  }

  const buttonSize = scale(56);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isListening
              ? '#FF3B30'
              : themeDefinition.colors.primary || '#007AFF',
          },
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, { fontSize: scale(24) }]}>
          {isListening ? '⏹' : '🎤'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    color: '#fff',
  },
});

export default MicrophoneFAB;
