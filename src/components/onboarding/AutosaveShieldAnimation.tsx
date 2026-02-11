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

const AutosaveShieldAnimation: React.FC = () => {
  const pulse = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    check.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 700 }),
        withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [pulse, check]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.38]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.2]) }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.06]) }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: interpolate(check.value, [0, 1], [0.7, 1]) }],
  }));

  return (
    <View style={styles.container}>
      <AnimatedView style={[styles.halo, haloStyle]} />
      <AnimatedView style={[styles.badge, badgeStyle]}>
        <View style={styles.badgeTop} />
        <View style={styles.badgeBody} />
      </AnimatedView>
      <AnimatedView style={[styles.checkWrap, checkStyle]}>
        <View style={styles.checkShort} />
        <View style={styles.checkLong} />
      </AnimatedView>
      <View style={styles.stackBack} />
      <View style={styles.stackMiddle} />
      <View style={styles.stackFront} />
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
  halo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#10b981',
  },
  badge: {
    position: 'absolute',
    top: 64,
    width: 70,
    height: 84,
    alignItems: 'center',
  },
  badgeTop: {
    width: 48,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34d399',
  },
  badgeBody: {
    marginTop: -4,
    width: 70,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#065f46',
  },
  checkWrap: {
    position: 'absolute',
    top: 92,
    width: 34,
    height: 24,
  },
  checkShort: {
    position: 'absolute',
    left: 2,
    top: 12,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '35deg' }],
  },
  checkLong: {
    position: 'absolute',
    left: 10,
    top: 8,
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-38deg' }],
  },
  stackBack: {
    position: 'absolute',
    bottom: 56,
    width: 156,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.45)',
    transform: [{ translateY: 16 }],
  },
  stackMiddle: {
    position: 'absolute',
    bottom: 56,
    width: 172,
    height: 58,
    borderRadius: 14,
    backgroundColor: 'rgba(30,41,59,0.6)',
    transform: [{ translateY: 8 }],
  },
  stackFront: {
    position: 'absolute',
    bottom: 56,
    width: 188,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1e293b',
  },
});

export default AutosaveShieldAnimation;
