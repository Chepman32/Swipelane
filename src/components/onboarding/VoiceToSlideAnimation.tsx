import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Group, Rect, Circle } from '@shopify/react-native-skia';

const VoiceToSlideAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const waveScale = useSharedValue(1);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    waveScale.value = withRepeat(
      withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, waveScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Microphone representation */}
          <Group>
            {/* Mic body */}
            <Rect
              x={140}
              y={60}
              width={20}
              height={40}
              color="#1f2937"
              opacity={0.8}
            />
            
            {/* Mic head */}
            <Circle
              cx={150}
              cy={50}
              r={15}
              color="#374151"
              opacity={0.9}
            />
            
            {/* Sound waves */}
            <Circle
              cx={150}
              cy={50}
              r={interpolate(progress.value, [0, 0.5], [15, 35])}
              color="#3b82f6"
              opacity={interpolate(progress.value, [0, 0.5], [0.6, 0])}
            />
            <Circle
              cx={150}
              cy={50}
              r={interpolate(progress.value, [0.2, 0.7], [15, 45])}
              color="#10b981"
              opacity={interpolate(progress.value, [0.2, 0.7], [0.4, 0])}
            />
            <Circle
              cx={150}
              cy={50}
              r={interpolate(progress.value, [0.4, 0.9], [15, 55])}
              color="#f59e0b"
              opacity={interpolate(progress.value, [0.4, 0.9], [0.2, 0])}
            />
          </Group>
          
          {/* Speech to text transformation */}
          <Group>
            {/* Speech bubbles */}
            <Circle
              cx={80}
              cy={130}
              r={interpolate(progress.value, [0, 0.5], [0, 20])}
              color="#8b5cf6"
              opacity={0.7}
            />
            <Circle
              cx={120}
              cy={140}
              r={interpolate(progress.value, [0.1, 0.6], [0, 15])}
              color="#8b5cf6"
              opacity={0.6}
            />
            <Circle
              cx={100}
              cy={150}
              r={interpolate(progress.value, [0.2, 0.7], [0, 18])}
              color="#8b5cf6"
              opacity={0.5}
            />
            
            {/* Arrow pointing to slide */}
            <Rect
              x={150}
              y={140}
              width={interpolate(progress.value, [0.5, 0.8], [0, 40])}
              height={3}
              color="#10b981"
              opacity={0.8}
            />
            
            {/* Resulting slide */}
            <Rect
              x={200}
              y={120}
              width={70}
              height={50}
              color="#ef4444"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.9])}
            />
            
            {/* Slide content */}
            <Rect
              x={210}
              y={130}
              width={interpolate(progress.value, [0.6, 1], [0, 50])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.8])}
            />
            <Rect
              x={210}
              y={140}
              width={interpolate(progress.value, [0.6, 1], [0, 40])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.8])}
            />
            <Rect
              x={210}
              y={150}
              width={interpolate(progress.value, [0.6, 1], [0, 45])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.8])}
            />
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
  svgContainer: {
    width: 300,
    height: 220,
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default VoiceToSlideAnimation;
