import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Rect, RoundedRect, Circle, Group, LinearGradient, vec } from '@shopify/react-native-skia';

// Slide 1: blank slide → gradient blooms across → text draws in → neon glow pulses
const TextBloomAnimation: React.FC = () => {
  const bloom = useSharedValue(0);
  const textWidth = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  useEffect(() => {
    // Card entrance
    cardScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });

    // Main bloom progress 0 → 1 → pause → back
    bloom.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 800, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    );

    // Text draws in after bloom starts
    textWidth.value = withRepeat(
      withSequence(
        withDelay(600, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })),
        withTiming(1, { duration: 700 }),
        withDelay(100, withTiming(0, { duration: 400 })),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    );

    // Glow pulse
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [bloom, textWidth, glowPulse, cardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const CARD_W = 220;
  const CARD_H = 140;
  const CX = 150;
  const CY = 130;
  const clampInterpolate = (value: number, input: number[], output: number[]) =>
    interpolate(value, input, output, Extrapolation.CLAMP);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.canvasWrapper, cardStyle]}>
        <Canvas style={styles.canvas}>
          {/* Soft ambient glow behind card */}
          <Circle
            cx={CX}
            cy={CY}
            r={interpolate(glowPulse.value, [0, 1], [85, 100])}
            opacity={interpolate(bloom.value, [0, 0.3, 1], [0, 0.12, 0.2])}
            color="#7c3aed"
          />
          <Circle
            cx={CX}
            cy={CY}
            r={interpolate(glowPulse.value, [0, 1], [65, 78])}
            opacity={interpolate(bloom.value, [0, 0.4, 1], [0, 0.1, 0.18])}
            color="#3b82f6"
          />

          {/* Card shadow */}
          <RoundedRect
            x={CX - CARD_W / 2 + 4}
            y={CY - CARD_H / 2 + 6}
            width={CARD_W}
            height={CARD_H}
            r={14}
            color="#000000"
            opacity={0.35}
          />

          {/* Card background — gray initially, gradient blooms in */}
          <RoundedRect
            x={CX - CARD_W / 2}
            y={CY - CARD_H / 2}
            width={CARD_W}
            height={CARD_H}
            r={14}
            color="#2a2a3e"
          />

          {/* Gradient bloom overlay — clip to card width */}
          <Group clip={{ x: CX - CARD_W / 2, y: CY - CARD_H / 2, width: CARD_W, height: CARD_H }}>
            <Rect
              x={CX - CARD_W / 2}
              y={CY - CARD_H / 2}
              width={clampInterpolate(bloom.value, [0, 1], [0, CARD_W])}
              height={CARD_H}
              opacity={0.9}
            >
              <LinearGradient
                start={vec(CX - CARD_W / 2, CY)}
                end={vec(CX + CARD_W / 2, CY)}
                colors={['#7c3aed', '#3b82f6', '#06b6d4']}
              />
            </Rect>

            {/* Headline text bar */}
            <Rect
              x={CX - CARD_W / 2 + 18}
              y={CY - 18}
              width={clampInterpolate(textWidth.value, [0, 1], [0, CARD_W - 52])}
              height={16}
              color="#ffffff"
              opacity={0.95}
            />

            {/* Sub-line 1 */}
            <Rect
              x={CX - CARD_W / 2 + 18}
              y={CY + 10}
              width={clampInterpolate(textWidth.value, [0, 1], [0, CARD_W - 80])}
              height={8}
              color="#ffffff"
              opacity={0.5}
            />

            {/* Sub-line 2 */}
            <Rect
              x={CX - CARD_W / 2 + 18}
              y={CY + 26}
              width={clampInterpolate(textWidth.value, [0, 1], [0, CARD_W - 100])}
              height={8}
              color="#ffffff"
              opacity={0.4}
            />
          </Group>

          {/* Neon glow line under headline */}
          <Rect
            x={CX - CARD_W / 2 + 18}
            y={CY - 4}
            width={clampInterpolate(textWidth.value, [0, 1], [0, CARD_W - 52])}
            height={3}
            color="#a78bfa"
            opacity={interpolate(glowPulse.value, [0, 1], [0.4, 0.9])}
          />

          {/* Sparkle dots */}
          <Circle
            cx={CX + CARD_W / 2 - 22}
            cy={CY - CARD_H / 2 - 12}
            r={interpolate(glowPulse.value, [0, 1], [3, 5])}
            color="#f59e0b"
            opacity={interpolate(bloom.value, [0.5, 0.8, 1], [0, 0.9, 0.3])}
          />
          <Circle
            cx={CX + CARD_W / 2 + 10}
            cy={CY - 10}
            r={interpolate(glowPulse.value, [0, 1], [2, 4])}
            color="#06b6d4"
            opacity={interpolate(bloom.value, [0.6, 0.9, 1], [0, 0.9, 0.2])}
          />
          <Circle
            cx={CX - CARD_W / 2 - 8}
            cy={CY + 20}
            r={interpolate(glowPulse.value, [0, 1], [2, 3.5])}
            color="#7c3aed"
            opacity={interpolate(bloom.value, [0.4, 0.7, 1], [0, 0.8, 0.1])}
          />
        </Canvas>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasWrapper: {
    width: 300,
    height: 260,
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default TextBloomAnimation;
