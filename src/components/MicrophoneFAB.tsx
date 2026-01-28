import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import FeedbackService from '../services/FeedbackService';

const recordingAnimation = require('../assets/animations/Recording bubble red.json');

interface MicrophoneFABProps {
  onTextReceived: (text: string) => void;
  style?: ViewStyle;
  disabled?: boolean;
  onPress?: () => void;
}

export const MicrophoneFAB: React.FC<MicrophoneFABProps> = ({
  onTextReceived,
  style,
  disabled = false,
  onPress,
}) => {
  const { themeDefinition } = useTheme();
  const { scale } = useResponsive();

  const {
    isListening,
    isAvailable,
    startListening,
    stopListening,
  } = useSpeechRecognition(onTextReceived);

  const handlePress = async () => {
    FeedbackService.buttonTap();
    onPress?.();

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
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isListening
              ? 'transparent'
              : themeDefinition.colors.primary || '#007AFF',
          },
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {isListening ? (
          <LottieView
            source={recordingAnimation}
            autoPlay
            loop
            resizeMode="contain"
            style={{ width: buttonSize * 1.6, height: buttonSize * 1.6 }}
          />
        ) : (
          <Text style={[styles.icon, { fontSize: scale(24) }]}>🎤</Text>
        )}
      </TouchableOpacity>
    </View>
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
    overflow: 'visible',
  },
  icon: {
    color: '#fff',
  },
});

export default MicrophoneFAB;
