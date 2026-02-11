import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View;

const VoiceWaveAnimation: React.FC = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const cardMainStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -12]) },
      { scale: interpolate(progress.value, [0, 1], [0.98, 1.02]) },
    ],
  }));

  const cardLeftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0.25, 0.8, 0.35]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, -62]) },
      { translateY: interpolate(progress.value, [0, 1], [0, 34]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, -8])}deg` },
    ],
  }));

  const cardRightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0.25, 0.8, 0.35]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, 62]) },
      { translateY: interpolate(progress.value, [0, 1], [0, 34]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 8])}deg` },
    ],
  }));

  const sliderGlowStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [32, 100])}%`,
    opacity: interpolate(progress.value, [0, 1], [0.45, 0.95]),
  }));

  return (
    <View style={styles.container}>
      <AnimatedView style={[styles.sideCard, cardLeftStyle]}>
        <View style={styles.sideLine} />
      </AnimatedView>

      <AnimatedView style={[styles.sideCard, cardRightStyle]}>
        <View style={styles.sideLine} />
      </AnimatedView>

      <AnimatedView style={[styles.mainCard, cardMainStyle]}>
        <View style={styles.titleLine} />
        <View style={styles.subLine} />
        <View style={styles.subLineShort} />

        <View style={styles.sliderTrack}>
          <AnimatedView style={[styles.sliderFill, sliderGlowStyle]} />
          <View style={styles.sliderThumb} />
        </View>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    width: 210,
    height: 140,
    borderRadius: 18,
    backgroundColor: '#1f1f47',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  sideCard: {
    position: 'absolute',
    width: 92,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(79,70,229,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideLine: {
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  titleLine: {
    width: 140,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  subLine: {
    width: 104,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  subLineShort: {
    width: 82,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  sliderTrack: {
    marginTop: 8,
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
  },
  sliderFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
  sliderThumb: {
    position: 'absolute',
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
  },
});

export default VoiceWaveAnimation;
