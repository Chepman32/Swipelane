import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View;

const RoadmapPathAnimation: React.FC = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const line1 = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 0.35], [0, 58], Extrapolation.CLAMP),
    opacity: interpolate(progress.value, [0, 0.08, 0.35], [0, 0.7, 1], Extrapolation.CLAMP),
  }));

  const line2 = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0.25, 0.7], [0, 96], Extrapolation.CLAMP),
    opacity: interpolate(progress.value, [0.25, 0.33, 0.7], [0, 0.7, 1], Extrapolation.CLAMP),
  }));

  const line3 = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0.55, 1], [0, 58], Extrapolation.CLAMP),
    opacity: interpolate(progress.value, [0.55, 0.63, 1], [0, 0.7, 1], Extrapolation.CLAMP),
  }));

  const node1 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0.05, 0.2], [0.86, 1.12], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [0, 0.05, 0.2], [0.4, 0.7, 1], Extrapolation.CLAMP),
    backgroundColor: '#f59e0b',
  }));

  const node2 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0.3, 0.45], [0.86, 1.12], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [0.2, 0.3, 0.45], [0.4, 0.7, 1], Extrapolation.CLAMP),
    backgroundColor: '#10b981',
  }));

  const node3 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0.55, 0.75], [0.86, 1.12], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [0.45, 0.55, 0.75], [0.4, 0.7, 1], Extrapolation.CLAMP),
    backgroundColor: '#3b82f6',
  }));

  const node4 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0.8, 1], [0.86, 1.12], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [0.7, 0.8, 1], [0.4, 0.7, 1], Extrapolation.CLAMP),
    backgroundColor: '#a78bfa',
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <AnimatedView style={[styles.node, node1]} />
        <AnimatedView style={[styles.segment, line1]} />
        <AnimatedView style={[styles.node, node2]} />
        <AnimatedView style={[styles.segmentWide, line2]} />
        <AnimatedView style={[styles.node, node3]} />
        <AnimatedView style={[styles.segment, line3]} />
        <AnimatedView style={[styles.node, node4]} />
      </View>
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
  track: {
    width: 268,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  segment: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  segmentWide: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
});

export default RoadmapPathAnimation;
