import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Circle, Rect, RoundedRect, Group, LinearGradient, vec } from '@shopify/react-native-skia';

// Slide 2: mic with voice wave rings → 3 slide cards float up
const VoiceWaveAnimation: React.FC = () => {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  const wave4 = useSharedValue(0);
  const wave5 = useSharedValue(0);
  const card1 = useSharedValue(0);
  const card2 = useSharedValue(0);
  const card3 = useSharedValue(0);
  const micPulse = useSharedValue(1);
  const recordDot = useSharedValue(0);

  const CYCLE = 2200;

  useEffect(() => {
    const waveEasing = Easing.out(Easing.cubic);

    wave1.value = withRepeat(withTiming(1, { duration: CYCLE, easing: waveEasing }), -1, false);
    wave2.value = withRepeat(withDelay(180, withTiming(1, { duration: CYCLE, easing: waveEasing })), -1, false);
    wave3.value = withRepeat(withDelay(360, withTiming(1, { duration: CYCLE, easing: waveEasing })), -1, false);
    wave4.value = withRepeat(withDelay(540, withTiming(1, { duration: CYCLE, easing: waveEasing })), -1, false);
    wave5.value = withRepeat(withDelay(720, withTiming(1, { duration: CYCLE, easing: waveEasing })), -1, false);

    // Mic pulse
    micPulse.value = withRepeat(
      withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    // Record dot blink
    recordDot.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // Cards float up one by one
    card1.value = withRepeat(
      withSequence(
        withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) })),
        withTiming(1, { duration: 1600 }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: 200 }),
      ),
      -1,
      false,
    );
    card2.value = withRepeat(
      withSequence(
        withDelay(700, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) })),
        withTiming(1, { duration: 1300 }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: 200 }),
      ),
      -1,
      false,
    );
    card3.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) })),
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: 200 }),
      ),
      -1,
      false,
    );
  }, [wave1, wave2, wave3, wave4, wave5, micPulse, recordDot, card1, card2, card3]);

  const MIC_CX = 150;
  const MIC_CY = 148;

  return (
    <View style={styles.container}>
      <Animated.View style={styles.canvasWrapper}>
        <Canvas style={styles.canvas}>
          {/* Wave rings from mic center */}
          {[wave1, wave2, wave3, wave4, wave5].map((w, i) => (
            <Circle
              key={i}
              cx={MIC_CX}
              cy={MIC_CY}
              r={interpolate(w.value, [0, 1], [32, 90 + i * 8])}
              color="#a78bfa"
              opacity={interpolate(w.value, [0, 0.2, 0.7, 1], [0, 0.35, 0.15, 0])}
              style="stroke"
              strokeWidth={interpolate(w.value, [0, 0.5, 1], [2.5, 1.5, 0.5])}
            />
          ))}

          {/* Mic glow background */}
          <Circle
            cx={MIC_CX}
            cy={MIC_CY}
            r={interpolate(micPulse.value, [1, 1.06], [28, 32])}
            color="#7c3aed"
            opacity={0.25}
          />

          {/* Mic body */}
          <RoundedRect
            x={MIC_CX - 10}
            y={MIC_CY - 24}
            width={20}
            height={30}
            r={10}
            color="#c4b5fd"
          />

          {/* Mic stand arc approximation via rects */}
          <RoundedRect
            x={MIC_CX - 18}
            y={MIC_CY + 8}
            width={36}
            height={3}
            r={2}
            color="#a78bfa"
            opacity={0.8}
          />
          <RoundedRect
            x={MIC_CX - 1.5}
            y={MIC_CY + 11}
            width={3}
            height={10}
            r={1}
            color="#a78bfa"
            opacity={0.8}
          />
          <RoundedRect
            x={MIC_CX - 10}
            y={MIC_CY + 21}
            width={20}
            height={3}
            r={1.5}
            color="#a78bfa"
            opacity={0.8}
          />

          {/* Recording red dot */}
          <Circle
            cx={MIC_CX + 14}
            cy={MIC_CY - 28}
            r={5}
            color="#ef4444"
            opacity={interpolate(recordDot.value, [0, 1], [0.4, 1])}
          />

          {/* Floating slide card 1 */}
          <Group
            transform={[
              { translateX: interpolate(card1.value, [0, 1], [10, 0]) },
              { translateY: interpolate(card1.value, [0, 1], [20, 0]) },
            ]}
            opacity={card1.value}
          >
            <RoundedRect x={180} y={60} width={66} height={44} r={8} color="#1e1b4b" />
            <RoundedRect x={180} y={60} width={66} height={44} r={8} opacity={0.7}>
              <LinearGradient
                start={vec(180, 60)}
                end={vec(246, 104)}
                colors={['#7c3aed', '#3b82f6']}
              />
            </RoundedRect>
            <RoundedRect x={187} y={72} width={40} height={5} r={2} color="#ffffff" opacity={0.9} />
            <RoundedRect x={187} y={82} width={28} height={4} r={2} color="#ffffff" opacity={0.5} />
            <RoundedRect x={187} y={90} width={34} height={4} r={2} color="#ffffff" opacity={0.4} />
          </Group>

          {/* Floating slide card 2 */}
          <Group
            transform={[
              { translateX: interpolate(card2.value, [0, 1], [10, 0]) },
              { translateY: interpolate(card2.value, [0, 1], [18, 0]) },
            ]}
            opacity={card2.value}
          >
            <RoundedRect x={26} y={46} width={66} height={44} r={8} color="#0d1f2d" />
            <RoundedRect x={26} y={46} width={66} height={44} r={8} opacity={0.7}>
              <LinearGradient
                start={vec(26, 46)}
                end={vec(92, 90)}
                colors={['#06b6d4', '#10b981']}
              />
            </RoundedRect>
            <RoundedRect x={33} y={58} width={38} height={5} r={2} color="#ffffff" opacity={0.9} />
            <RoundedRect x={33} y={68} width={26} height={4} r={2} color="#ffffff" opacity={0.5} />
            <RoundedRect x={33} y={76} width={32} height={4} r={2} color="#ffffff" opacity={0.4} />
          </Group>

          {/* Floating slide card 3 */}
          <Group
            transform={[
              { translateX: interpolate(card3.value, [0, 1], [8, 0]) },
              { translateY: interpolate(card3.value, [0, 1], [16, 0]) },
            ]}
            opacity={card3.value}
          >
            <RoundedRect x={106} y={28} width={66} height={44} r={8} color="#1a0a00" />
            <RoundedRect x={106} y={28} width={66} height={44} r={8} opacity={0.7}>
              <LinearGradient
                start={vec(106, 28)}
                end={vec(172, 72)}
                colors={['#f59e0b', '#ef4444']}
              />
            </RoundedRect>
            <RoundedRect x={113} y={40} width={42} height={5} r={2} color="#ffffff" opacity={0.9} />
            <RoundedRect x={113} y={50} width={30} height={4} r={2} color="#ffffff" opacity={0.5} />
            <RoundedRect x={113} y={58} width={36} height={4} r={2} color="#ffffff" opacity={0.4} />
          </Group>
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

export default VoiceWaveAnimation;
