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

const TextBloomAnimation: React.FC = () => {
  const pulse = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    sweep.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 900, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [pulse, sweep]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.98, 1.02]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.2, 0.45]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.18]) }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    width: `${interpolate(sweep.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <View style={styles.container}>
      <AnimatedView style={[styles.glow, glowStyle]} />
      <AnimatedView style={[styles.card, cardStyle]}>
        <AnimatedView style={[styles.headline, sweepStyle]} />
        <AnimatedView style={[styles.line, sweepStyle]} />
        <AnimatedView style={[styles.lineShort, sweepStyle]} />
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
  glow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#6d28d9',
  },
  card: {
    width: 220,
    height: 145,
    borderRadius: 16,
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 18,
    paddingVertical: 24,
    gap: 12,
  },
  headline: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    maxWidth: '100%',
  },
  line: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    maxWidth: '100%',
  },
  lineShort: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.45)',
    maxWidth: '78%',
  },
});

export default TextBloomAnimation;
