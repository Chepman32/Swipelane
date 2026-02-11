import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, RoundedRect, Circle, Group, LinearGradient, vec } from '@shopify/react-native-skia';

// Slide 5: slide card zooms → shoots to top-right → lands in IG icon with bounce
const ShareLaunchAnimation: React.FC = () => {
  const cardPhase = useSharedValue(0); // 0=idle, 0.3=scale up, 0.5=launch, 0.8=landed
  const iconFade = useSharedValue(0);
  const igBounce = useSharedValue(1);
  const glowPulse = useSharedValue(0);
  const trailOpacity = useSharedValue(0);

  const CYCLE = 3200;

  useEffect(() => {
    // Main card phase
    cardPhase.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),                                          // idle
        withTiming(0.28, { duration: 400, easing: Easing.out(Easing.cubic) }),      // scale up
        withTiming(0.52, { duration: 50 }),                                         // hold
        withTiming(1, { duration: 500, easing: Easing.in(Easing.cubic) }),          // launch
        withTiming(1, { duration: 400 }),                                           // landed hold
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),        // reset
        withTiming(0, { duration: 400 }),                                           // pause
      ),
      -1,
      false,
    );

    // Icons fade in while card is idle/scaling
    iconFade.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })),
        withTiming(1, { duration: CYCLE - 1200 }),
        withTiming(0, { duration: 400 }),
        withTiming(0, { duration: 100 }),
      ),
      -1,
      false,
    );

    // IG bounce when card lands
    igBounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(1.25, { duration: 180, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: CYCLE - 1880 }),
      ),
      -1,
      false,
    );

    // Glow pulse
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Trail
    trailOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 500 }),
        withTiming(0, { duration: CYCLE - 1600 }),
      ),
      -1,
      false,
    );
  }, [cardPhase, iconFade, igBounce, glowPulse, trailOpacity]);

  const CARD_START_X = 106;
  const CARD_START_Y = 110;
  const CARD_W = 88;
  const CARD_H = 58;
  const IG_X = 222;
  const IG_Y = 52;
  const clampInterpolate = (value: number, input: number[], output: number[]) =>
    interpolate(value, input, output, Extrapolation.CLAMP);

  return (
    <View style={styles.container}>
      <Animated.View style={styles.canvasWrapper}>
        <Canvas style={styles.canvas}>

          {/* === Platform icons (always visible) === */}
          {/* Instagram icon */}
          <Group
            transform={[
              { translateX: IG_X },
              { translateY: IG_Y },
              { scale: igBounce.value },
            ]}
            opacity={iconFade.value}
          >
            <RoundedRect x={-22} y={-22} width={44} height={44} r={12} color="#000000" opacity={0.3} />
            <RoundedRect x={-22} y={-22} width={44} height={44} r={12}>
              <LinearGradient
                start={vec(-22, 22)}
                end={vec(22, -22)}
                colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
              />
            </RoundedRect>
            <Circle cx={0} cy={0} r={11} color="#000000" opacity={0} style="stroke" strokeWidth={2.5} />
            <Circle cx={0} cy={0} r={11} color="#ffffff" style="stroke" strokeWidth={2.5} opacity={0.9} />
            <Circle cx={7} cy={-7} r={2} color="#ffffff" opacity={0.9} />
          </Group>

          {/* X (Twitter) icon */}
          <Group
            transform={[{ translateX: 78 }, { translateY: 52 }]}
            opacity={iconFade.value}
          >
            <RoundedRect x={-22} y={-22} width={44} height={44} r={12} color="#0f172a" />
            <RoundedRect x={-12} y={-10} width={10} height={20} r={2} color="#ffffff" opacity={0.85} />
            <RoundedRect x={2} y={-10} width={10} height={20} r={2} color="#ffffff" opacity={0.85} />
            <RoundedRect x={-12} y={-10} width={24} height={5} r={2} color="#ffffff" opacity={0.85} />
          </Group>

          {/* Generic share icon */}
          <Group
            transform={[{ translateX: 150 }, { translateY: 44 }]}
            opacity={iconFade.value}
          >
            <RoundedRect x={-22} y={-22} width={44} height={44} r={12} color="#1e293b" />
            <Circle cx={0} cy={-6} r={5} color="#3b82f6" style="stroke" strokeWidth={2} opacity={0.9} />
            <Circle cx={-10} cy={6} r={4} color="#3b82f6" style="stroke" strokeWidth={2} opacity={0.9} />
            <Circle cx={10} cy={6} r={4} color="#3b82f6" style="stroke" strokeWidth={2} opacity={0.9} />
            <RoundedRect x={-10} y={-2} width={22} height={2} r={1} color="#3b82f6" opacity={0.7} />
          </Group>

          {/* IG destination glow */}
          <Circle
            cx={IG_X}
            cy={IG_Y}
            r={interpolate(glowPulse.value, [0, 1], [28, 36])}
            color="#e1306c"
            opacity={interpolate(cardPhase.value, [0.8, 1], [0, 0.25])}
          />

          {/* === Motion trail === */}
          {[0, 1, 2].map((i) => (
            <RoundedRect
              key={i}
              x={clampInterpolate(cardPhase.value, [0.52, 1], [CARD_START_X + CARD_W / 2 - 4, IG_X - 8]) - i * 14}
              y={clampInterpolate(cardPhase.value, [0.52, 1], [CARD_START_Y + CARD_H / 2 - 4, IG_Y - 8]) - i * 6}
              width={16}
              height={8}
              r={4}
              color="#f9a8d4"
              opacity={interpolate(trailOpacity.value, [0, 1], [0, 0.4 - i * 0.12])}
            />
          ))}

          {/* === Main slide card === */}
          {/* Card shadow */}
          <RoundedRect
            x={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_START_X + 4, CARD_START_X + 2, CARD_START_X + 2, IG_X - CARD_W / 2 + 2])}
            y={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_START_Y + 6, CARD_START_Y + 3, CARD_START_Y + 3, IG_Y - CARD_H / 4 + 3])}
            width={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_W, CARD_W * 1.06, CARD_W * 1.06, 20])}
            height={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_H, CARD_H * 1.06, CARD_H * 1.06, 14])}
            r={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [12, 12, 12, 7])}
            color="#000000"
            opacity={interpolate(cardPhase.value, [0, 0.5, 0.85, 1], [0.3, 0.5, 0.15, 0])}
          />

          {/* Card body */}
          <RoundedRect
            x={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_START_X, CARD_START_X - 3, CARD_START_X - 3, IG_X - 10])}
            y={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_START_Y, CARD_START_Y - 2, CARD_START_Y - 2, IG_Y - 8])}
            width={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_W, CARD_W * 1.06, CARD_W * 1.06, 20])}
            height={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_H, CARD_H * 1.06, CARD_H * 1.06, 16])}
            r={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [12, 12, 12, 8])}
            opacity={interpolate(cardPhase.value, [0, 0.5, 0.85, 1], [1, 1, 0.6, 0])}
          >
            <LinearGradient
              start={vec(CARD_START_X, CARD_START_Y)}
              end={vec(CARD_START_X + CARD_W, CARD_START_Y + CARD_H)}
              colors={['#e11d48', '#7c3aed']}
            />
          </RoundedRect>

          {/* Card text lines */}
          <RoundedRect
            x={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_START_X + 10, CARD_START_X + 7, CARD_START_X + 7, IG_X - 4])}
            y={clampInterpolate(cardPhase.value, [0, 0.28, 0.52, 1], [CARD_START_Y + 14, CARD_START_Y + 11, CARD_START_Y + 11, IG_Y - 2])}
            width={clampInterpolate(cardPhase.value, [0, 1], [60, 6])}
            height={6}
            r={clampInterpolate(cardPhase.value, [0, 1], [3, 2.8])}
            color="#ffffff"
            opacity={interpolate(cardPhase.value, [0, 0.5, 0.85, 1], [0.9, 0.9, 0.5, 0])}
          />
          <RoundedRect
            x={clampInterpolate(cardPhase.value, [0, 0.28], [CARD_START_X + 10, CARD_START_X + 7])}
            y={clampInterpolate(cardPhase.value, [0, 0.28], [CARD_START_Y + 26, CARD_START_Y + 22])}
            width={44}
            height={5}
            r={2}
            color="#ffffff"
            opacity={interpolate(cardPhase.value, [0, 0.5, 0.85, 1], [0.55, 0.55, 0.1, 0])}
          />
          <RoundedRect
            x={clampInterpolate(cardPhase.value, [0, 0.28], [CARD_START_X + 10, CARD_START_X + 7])}
            y={clampInterpolate(cardPhase.value, [0, 0.28], [CARD_START_Y + 36, CARD_START_Y + 32])}
            width={52}
            height={5}
            r={2}
            color="#ffffff"
            opacity={interpolate(cardPhase.value, [0, 0.5, 0.85, 1], [0.45, 0.45, 0.05, 0])}
          />

          {/* Idle sparkles around card */}
          <Circle
            cx={CARD_START_X - 10}
            cy={CARD_START_Y + 10}
            r={interpolate(glowPulse.value, [0, 1], [2.5, 4])}
            color="#f59e0b"
            opacity={interpolate(cardPhase.value, [0, 0.28, 0.5], [0.8, 0.8, 0])}
          />
          <Circle
            cx={CARD_START_X + CARD_W + 8}
            cy={CARD_START_Y + CARD_H - 12}
            r={interpolate(glowPulse.value, [0, 1], [2, 3.5])}
            color="#a78bfa"
            opacity={interpolate(cardPhase.value, [0, 0.28, 0.5], [0.7, 0.7, 0])}
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

export default ShareLaunchAnimation;
