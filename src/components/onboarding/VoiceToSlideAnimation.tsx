import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const micAnimation = require('../../assets/animations/Mic.json');

const VoiceToSlideAnimation: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={micAnimation}
        autoPlay
        loop
        resizeMode="contain"
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 320,
    height: 320,
  },
});

export default VoiceToSlideAnimation;
