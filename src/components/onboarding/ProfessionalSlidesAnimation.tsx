import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const speechAnimation = require('../../assets/animations/Speech.json');

const ProfessionalSlidesAnimation: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={speechAnimation}
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

export default ProfessionalSlidesAnimation;
