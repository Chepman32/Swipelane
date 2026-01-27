import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const designerAnimation = require('../../assets/animations/Designer.json');

const PocketDesignerAnimation: React.FC = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={designerAnimation}
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

export default PocketDesignerAnimation;
