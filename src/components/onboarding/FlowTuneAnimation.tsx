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

const FlowTuneAnimation: React.FC = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const sourceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 0.4], [1, 1, 0.35]),
    transform: [{ translateY: interpolate(progress.value, [0, 0.4], [0, -10]) }],
  }));

  const cardAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.25, 0.45, 1], [0, 0.95, 0.95]),
    transform: [
      { translateX: interpolate(progress.value, [0.25, 0.55], [0, -64]) },
      { translateY: interpolate(progress.value, [0.25, 0.55], [0, 44]) },
    ],
  }));

  const cardBStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 0.58, 1], [0, 0.95, 0.95]),
    transform: [
      { translateX: interpolate(progress.value, [0.35, 0.68], [0, 0]) },
      { translateY: interpolate(progress.value, [0.35, 0.68], [0, 54]) },
    ],
  }));

  const cardCStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.45, 0.72, 1], [0, 0.95, 0.95]),
    transform: [
      { translateX: interpolate(progress.value, [0.45, 0.82], [0, 64]) },
      { translateY: interpolate(progress.value, [0.45, 0.82], [0, 44]) },
    ],
  }));

  return (
    <View style={styles.container}>
      <AnimatedView style={[styles.sourceCard, sourceStyle]}>
        <View style={styles.mainLine} />
        <View style={styles.subLine} />
        <View style={styles.subLineShort} />
      </AnimatedView>

      <AnimatedView style={[styles.childCard, cardAStyle]}>
        <View style={styles.childLine} />
      </AnimatedView>
      <AnimatedView style={[styles.childCard, cardBStyle]}>
        <View style={styles.childLine} />
      </AnimatedView>
      <AnimatedView style={[styles.childCard, cardCStyle]}>
        <View style={styles.childLine} />
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
  sourceCard: {
    width: 196,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 10,
  },
  mainLine: {
    width: 126,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  subLine: {
    width: 90,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  subLineShort: {
    width: 72,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  childCard: {
    position: 'absolute',
    top: 112,
    width: 80,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childLine: {
    width: 42,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    opacity: 0.85,
  },
});

export default FlowTuneAnimation;
