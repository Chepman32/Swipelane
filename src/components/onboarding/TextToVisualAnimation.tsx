import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const timeManagementAnimation = require('../../assets/animations/Time management.json');

const TextToVisualAnimation: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={timeManagementAnimation}
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

export default TextToVisualAnimation;
