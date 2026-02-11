import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
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

// Slide 3: Big "Aa" text cycling through neon glow → chrome shimmer → glassmorphism
const EffectsShowcaseAnimation: React.FC = () => {
  const phase = useSharedValue(0);        // 0→1→2 phase cycle
  const shimmer = useSharedValue(0);      // chrome shimmer sweep
  const glowPulse = useSharedValue(0);    // neon pulse
  const floatY = useSharedValue(0);       // subtle floating
  const labelOpacity = useSharedValue(0); // effect label fade

  const PHASE_DUR = 1800;
  const TOTAL = PHASE_DUR * 3 + 600;

  useEffect(() => {
    // Phase cycling 0→3 (0=neon, 1=chrome, 2=glass)
    phase.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: PHASE_DUR }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: PHASE_DUR }),
        withTiming(2, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: PHASE_DUR }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Chrome shimmer sweep
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true,
    );

    // Neon pulse
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Float
    floatY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Label
    labelOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1, { duration: PHASE_DUR - 600 }),
        withTiming(0, { duration: 300 }),
        withTiming(0, { duration: 100 }),
      ),
      -1,
      false,
    );
  }, [phase, shimmer, glowPulse, floatY, labelOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatY.value, [0, 1], [0, -8]) }],
  }));

  const CX = 150;
  const CY = 130;
  const BOX_W = 140;
  const BOX_H = 90;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.canvasWrapper, containerStyle]}>
        <Canvas style={styles.canvas}>

          {/* === NEON GLOW (phase ~0) === */}
          {/* Outer glow rings */}
          <Circle
            cx={CX}
            cy={CY}
            r={interpolate(glowPulse.value, [0, 1], [72, 84])}
            color="#06b6d4"
            opacity={interpolate(phase.value, [0, 0.4, 1, 2], [0.18, 0.06, 0, 0])}
            style="stroke"
            strokeWidth={3}
          />
          <Circle
            cx={CX}
            cy={CY}
            r={interpolate(glowPulse.value, [0, 1], [56, 66])}
            color="#a78bfa"
            opacity={interpolate(phase.value, [0, 0.4, 1, 2], [0.22, 0.08, 0, 0])}
            style="stroke"
            strokeWidth={2}
          />

          {/* === CHROME SHIMMER (phase ~1) === */}
          <Group
            clip={{ x: CX - BOX_W / 2, y: CY - BOX_H / 2, width: BOX_W, height: BOX_H }}
          >
            <RoundedRect
              x={CX - BOX_W / 2}
              y={CY - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              r={12}
              opacity={interpolate(phase.value, [0.7, 1, 1.3, 2], [0, 1, 1, 0])}
              color="#1e293b"
            />
            {/* Chrome gradient sweep */}
            <RoundedRect
              x={interpolate(shimmer.value, [0, 1], [CX - BOX_W / 2 - 60, CX + BOX_W / 2 + 60])}
              y={CY - BOX_H / 2}
              width={60}
              height={BOX_H}
              r={0}
              opacity={interpolate(phase.value, [0.7, 1, 1.3, 2], [0, 0.55, 0.55, 0])}
            >
              <LinearGradient
                start={vec(0, CY)}
                end={vec(60, CY)}
                colors={['#00000000', '#ffffffff', '#00000000']}
              />
            </RoundedRect>
          </Group>

          {/* === GLASSMORPHISM (phase ~2) === */}
          {/* Frosted background blobs */}
          <Circle
            cx={CX - 30}
            cy={CY + 10}
            r={50}
            color="#7c3aed"
            opacity={interpolate(phase.value, [1.7, 2, 2.3, 3], [0, 0.3, 0.3, 0])}
          />
          <Circle
            cx={CX + 35}
            cy={CY - 15}
            r={40}
            color="#3b82f6"
            opacity={interpolate(phase.value, [1.7, 2, 2.3, 3], [0, 0.25, 0.25, 0])}
          />
          {/* Frosted rect */}
          <RoundedRect
            x={CX - BOX_W / 2}
            y={CY - BOX_H / 2}
            width={BOX_W}
            height={BOX_H}
            r={16}
            color="#ffffff"
            opacity={interpolate(phase.value, [1.7, 2, 2.3, 3], [0, 0.12, 0.12, 0])}
          />
          {/* Glass border */}
          <RoundedRect
            x={CX - BOX_W / 2}
            y={CY - BOX_H / 2}
            width={BOX_W}
            height={BOX_H}
            r={16}
            color="#ffffff"
            opacity={interpolate(phase.value, [1.7, 2, 2.3, 3], [0, 0.3, 0.3, 0])}
            style="stroke"
            strokeWidth={1.5}
          />

          {/* === MAIN "Aa" TEXT BOX (always present, just changes skin) === */}
          <RoundedRect
            x={CX - BOX_W / 2}
            y={CY - BOX_H / 2}
            width={BOX_W}
            height={BOX_H}
            r={12}
            color="#0f172a"
            opacity={interpolate(phase.value, [0.7, 1, 1.3], [1, 0, 1])}
          />

          {/* Aa headline bar */}
          <RoundedRect
            x={CX - 44}
            y={CY - 20}
            width={88}
            height={22}
            r={5}
            color="#ffffff"
            opacity={0.92}
          />
          {/* Thin sub bars */}
          <RoundedRect x={CX - 32} y={CY + 10} width={64} height={7} r={3} color="#ffffff" opacity={0.4} />
          <RoundedRect x={CX - 32} y={CY + 22} width={48} height={7} r={3} color="#ffffff" opacity={0.3} />

          {/* Effect label dots (small colored indicators) */}
          {/* Neon label */}
          <Circle
            cx={CX - 24}
            cy={CY - BOX_H / 2 - 18}
            r={5}
            color="#06b6d4"
            opacity={interpolate(phase.value, [0, 0.3, 0.8, 1], [0.9, 0.9, 0, 0])}
          />
          <RoundedRect
            x={CX - 14}
            y={CY - BOX_H / 2 - 21}
            width={38}
            height={7}
            r={3}
            color="#06b6d4"
            opacity={interpolate(phase.value, [0, 0.3, 0.8, 1], [0.6, 0.6, 0, 0])}
          />

          {/* Chrome label */}
          <Circle
            cx={CX - 24}
            cy={CY - BOX_H / 2 - 18}
            r={5}
            color="#94a3b8"
            opacity={interpolate(phase.value, [0.8, 1, 1.3, 1.8], [0, 0.9, 0.9, 0])}
          />
          <RoundedRect
            x={CX - 14}
            y={CY - BOX_H / 2 - 21}
            width={44}
            height={7}
            r={3}
            color="#94a3b8"
            opacity={interpolate(phase.value, [0.8, 1, 1.3, 1.8], [0, 0.6, 0.6, 0])}
          />

          {/* Glass label */}
          <Circle
            cx={CX - 24}
            cy={CY - BOX_H / 2 - 18}
            r={5}
            color="#a78bfa"
            opacity={interpolate(phase.value, [1.8, 2, 2.3, 3], [0, 0.9, 0.9, 0])}
          />
          <RoundedRect
            x={CX - 14}
            y={CY - BOX_H / 2 - 21}
            width={52}
            height={7}
            r={3}
            color="#a78bfa"
            opacity={interpolate(phase.value, [1.8, 2, 2.3, 3], [0, 0.6, 0.6, 0])}
          />

          {/* Sparkle dots */}
          <Circle
            cx={CX + BOX_W / 2 + 14}
            cy={CY - 20}
            r={interpolate(glowPulse.value, [0, 1], [2.5, 4.5])}
            color="#f59e0b"
            opacity={0.8}
          />
          <Circle
            cx={CX - BOX_W / 2 - 12}
            cy={CY + 16}
            r={interpolate(glowPulse.value, [0, 1], [2, 3.5])}
            color="#06b6d4"
            opacity={0.7}
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

export default EffectsShowcaseAnimation;
