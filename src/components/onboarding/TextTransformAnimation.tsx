import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const dynamicTextAnimation = require('../../assets/animations/Dynamic Text Animation.json');

const TextTransformAnimation: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={dynamicTextAnimation}
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
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
  },
});

export default TextTransformAnimation;
