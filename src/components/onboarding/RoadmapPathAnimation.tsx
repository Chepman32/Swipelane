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
import { Canvas, RoundedRect, Circle, Group } from '@shopify/react-native-skia';

// Slide 4: 4 circles connected by lines drawing in one by one, each circle pulses when reached
const RoadmapPathAnimation: React.FC = () => {
  const line1 = useSharedValue(0);
  const line2 = useSharedValue(0);
  const line3 = useSharedValue(0);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const pulse4 = useSharedValue(0);
  const floatY = useSharedValue(0);
  const labelFade = useSharedValue(0);

  const LINE_DUR = 500;
  const PAUSE = 300;
  const PULSE_DUR = 600;
  const RESET = 800;
  const TOTAL = (LINE_DUR + PAUSE) * 3 + PULSE_DUR + RESET;

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    const lineEasing = Easing.out(Easing.cubic);

    // Lines draw in sequence
    line1.value = withRepeat(
      withSequence(
        withDelay(PAUSE, withTiming(1, { duration: LINE_DUR, easing: lineEasing })),
        withTiming(1, { duration: TOTAL - LINE_DUR - PAUSE }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
    line2.value = withRepeat(
      withSequence(
        withDelay(PAUSE + LINE_DUR + PAUSE, withTiming(1, { duration: LINE_DUR, easing: lineEasing })),
        withTiming(1, { duration: TOTAL - (PAUSE + LINE_DUR + PAUSE + LINE_DUR) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
    line3.value = withRepeat(
      withSequence(
        withDelay(PAUSE + (LINE_DUR + PAUSE) * 2, withTiming(1, { duration: LINE_DUR, easing: lineEasing })),
        withTiming(1, { duration: TOTAL - (PAUSE + (LINE_DUR + PAUSE) * 2 + LINE_DUR) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );

    // Each circle pulses when its connection arrives
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 250, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: TOTAL - 600 }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );
    pulse2.value = withRepeat(
      withSequence(
        withDelay(PAUSE + LINE_DUR, withTiming(1.4, { duration: 250, easing: Easing.out(Easing.back(2)) })),
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: TOTAL - PAUSE - LINE_DUR - 600 }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );
    pulse3.value = withRepeat(
      withSequence(
        withDelay(PAUSE + (LINE_DUR + PAUSE), withTiming(1.4, { duration: 250, easing: Easing.out(Easing.back(2)) })),
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: TOTAL - PAUSE - (LINE_DUR + PAUSE) - 600 }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );
    pulse4.value = withRepeat(
      withSequence(
        withDelay(PAUSE + (LINE_DUR + PAUSE) * 2 + LINE_DUR, withTiming(1.4, { duration: 250, easing: Easing.out(Easing.back(2)) })),
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: RESET }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );

    labelFade.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: 300 })),
        withTiming(1, { duration: TOTAL - 800 }),
        withTiming(0, { duration: 300 }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [line1, line2, line3, pulse1, pulse2, pulse3, pulse4, floatY, labelFade, TOTAL]);

  // 4 circles at y=130, evenly spaced
  const Y = 130;
  const X_POSITIONS = [44, 102, 198, 256];
  const CIRCLE_R = 20;
  const LINE_Y = Y;
  const LINE_H = 6;
  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#a78bfa'];
  const clampInterpolate = (value: number, input: number[], output: number[]) =>
    interpolate(value, input, output, Extrapolation.CLAMP);
  return (
    <View style={styles.container}>
      <Animated.View style={styles.canvasWrapper}>
        <Canvas style={styles.canvas}>
          {/* Background track (dim line) */}
          <RoundedRect
            x={X_POSITIONS[0]}
            y={LINE_Y - LINE_H / 2}
            width={X_POSITIONS[3] - X_POSITIONS[0]}
            height={LINE_H}
            r={3}
            color="#ffffff"
            opacity={0.08}
          />

          {/* Line 1 (node 1 → 2) */}
          <RoundedRect
            x={X_POSITIONS[0]}
            y={LINE_Y - LINE_H / 2}
            width={clampInterpolate(line1.value, [0, 1], [0, X_POSITIONS[1] - X_POSITIONS[0]])}
            height={LINE_H}
            r={clampInterpolate(line1.value, [0, 1], [0, 3])}
            color="#f59e0b"
            opacity={0.85}
          />

          {/* Line 2 (node 2 → 3) */}
          <RoundedRect
            x={X_POSITIONS[1]}
            y={LINE_Y - LINE_H / 2}
            width={clampInterpolate(line2.value, [0, 1], [0, X_POSITIONS[2] - X_POSITIONS[1]])}
            height={LINE_H}
            r={clampInterpolate(line2.value, [0, 1], [0, 3])}
            color="#10b981"
            opacity={0.85}
          />

          {/* Line 3 (node 3 → 4) */}
          <RoundedRect
            x={X_POSITIONS[2]}
            y={LINE_Y - LINE_H / 2}
            width={clampInterpolate(line3.value, [0, 1], [0, X_POSITIONS[3] - X_POSITIONS[2]])}
            height={LINE_H}
            r={clampInterpolate(line3.value, [0, 1], [0, 3])}
            color="#3b82f6"
            opacity={0.85}
          />

          {/* Circle 1 */}
          <Group transform={[{ translateX: X_POSITIONS[0] }, { translateY: Y }]}>
            <Circle cx={0} cy={0} r={interpolate(pulse1.value, [1, 1.4], [CIRCLE_R, CIRCLE_R * 1.4])} color={COLORS[0]} opacity={0.2} />
            <Circle cx={0} cy={0} r={CIRCLE_R} color={COLORS[0]} opacity={0.95} />
            <RoundedRect x={-7} y={-5} width={14} height={10} r={3} color="#0f172a" opacity={0} />
          </Group>

          {/* Circle 2 */}
          <Group transform={[{ translateX: X_POSITIONS[1] }, { translateY: Y }]}>
            <Circle cx={0} cy={0} r={interpolate(pulse2.value, [1, 1.4], [CIRCLE_R, CIRCLE_R * 1.4])} color={COLORS[1]} opacity={0.2} />
            <Circle cx={0} cy={0} r={CIRCLE_R} color={COLORS[1]} opacity={interpolate(line1.value, [0, 1], [0.3, 0.95])} />
          </Group>

          {/* Circle 3 */}
          <Group transform={[{ translateX: X_POSITIONS[2] }, { translateY: Y }]}>
            <Circle cx={0} cy={0} r={interpolate(pulse3.value, [1, 1.4], [CIRCLE_R, CIRCLE_R * 1.4])} color={COLORS[2]} opacity={0.2} />
            <Circle cx={0} cy={0} r={CIRCLE_R} color={COLORS[2]} opacity={interpolate(line2.value, [0, 1], [0.3, 0.95])} />
          </Group>

          {/* Circle 4 */}
          <Group transform={[{ translateX: X_POSITIONS[3] }, { translateY: Y }]}>
            <Circle cx={0} cy={0} r={interpolate(pulse4.value, [1, 1.4], [CIRCLE_R, CIRCLE_R * 1.4])} color={COLORS[3]} opacity={0.2} />
            <Circle cx={0} cy={0} r={CIRCLE_R} color={COLORS[3]} opacity={interpolate(line3.value, [0, 1], [0.3, 0.95])} />
          </Group>

          {/* Number labels inside circles */}
          {[0, 1, 2, 3].map((i) => (
            <RoundedRect
              key={i}
              x={X_POSITIONS[i] - 5}
              y={Y - 8}
              width={10}
              height={16}
              r={3}
              color="#0f172a"
              opacity={0}
            />
          ))}

          {/* Label bars below circles */}
          {[0, 1, 2, 3].map((i) => (
            <RoundedRect
              key={i}
              x={X_POSITIONS[i] - 18}
              y={Y + CIRCLE_R + 10}
              width={36}
              height={8}
              r={3}
              color={COLORS[i]}
              opacity={interpolate(labelFade.value, [0, 1], [0, 0.7])}
            />
          ))}

          {/* Connector sparkle dots */}
          <Circle
            cx={(X_POSITIONS[0] + X_POSITIONS[1]) / 2}
            cy={Y - 16}
            r={interpolate(line1.value, [0.4, 0.6, 0.8], [0, 4, 0])}
            color="#f59e0b"
            opacity={0.8}
          />
          <Circle
            cx={(X_POSITIONS[1] + X_POSITIONS[2]) / 2}
            cy={Y - 16}
            r={interpolate(line2.value, [0.4, 0.6, 0.8], [0, 4, 0])}
            color="#10b981"
            opacity={0.8}
          />
          <Circle
            cx={(X_POSITIONS[2] + X_POSITIONS[3]) / 2}
            cy={Y - 16}
            r={interpolate(line3.value, [0.4, 0.6, 0.8], [0, 4, 0])}
            color="#3b82f6"
            opacity={0.8}
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

export default RoadmapPathAnimation;
