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

const TextToVisualAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const rotate = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    rotate.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, [progress, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      rotate: `${interpolate(rotate.value, [0, 1], [0, 360])}deg`
    }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Boring text representation */}
          <Group opacity={interpolate(progress.value, [0, 0.5], [1, 0.2])}>
            <Rect
              x={50}
              y={80}
              width={80}
              height={3}
              color="#6b7280"
            />
            <Rect
              x={50}
              y={90}
              width={70}
              height={3}
              color="#6b7280"
            />
            <Rect
              x={50}
              y={100}
              width={75}
              height={3}
              color="#6b7280"
            />
            <Rect
              x={50}
              y={110}
              width={65}
              height={3}
              color="#6b7280"
            />
          </Group>
          
          {/* Transformation magic */}
          <Group>
            {/* Magic sparkles */}
            <Circle
              cx={150}
              cy={90}
              r={interpolate(progress.value, [0.3, 0.7], [0, 8])}
              color="#fbbf24"
              opacity={interpolate(progress.value, [0.3, 0.7], [0, 1])}
            />
            <Circle
              cx={170}
              cy={100}
              r={interpolate(progress.value, [0.4, 0.8], [0, 6])}
              color="#f59e0b"
              opacity={interpolate(progress.value, [0.4, 0.8], [0, 1])}
            />
            <Circle
              cx={130}
              cy={105}
              r={interpolate(progress.value, [0.5, 0.9], [0, 7])}
              color="#ef4444"
              opacity={interpolate(progress.value, [0.5, 0.9], [0, 1])}
            />
          </Group>
          
          {/* Breathtaking visuals */}
          <Group opacity={interpolate(progress.value, [0.5, 1], [0, 1])}>
            {/* Colorful slide */}
            <Rect
              x={180}
              y={60}
              width={90}
              height={70}
              color="#8b5cf6"
            />
            
            {/* Visual elements */}
            <Circle
              cx={200}
              cy={80}
              r={interpolate(progress.value, [0.6, 1], [0, 12])}
              color="#fbbf24"
            />
            <Rect
              x={220}
              y={75}
              width={interpolate(progress.value, [0.7, 1], [0, 30])}
              height={20}
              color="#10b981"
            />
            <Circle
              cx={240}
              cy={110}
              r={interpolate(progress.value, [0.8, 1], [0, 8])}
              color="#ef4444"
            />
            
            {/* Decorative elements */}
            <Rect
              x={190}
              y={100}
              width={interpolate(progress.value, [0.6, 1], [0, 70])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={190}
              y={110}
              width={interpolate(progress.value, [0.7, 1], [0, 60])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={190}
              y={120}
              width={interpolate(progress.value, [0.8, 1], [0, 65])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
          </Group>
          
          {/* Time indicator */}
          <Group>
            <Circle
              cx={150}
              cy={150}
              r={15}
              color="#1f2937"
              opacity={0.8}
            />
            <Rect
              x={150}
              y={150}
              width={interpolate(progress.value, [0, 1], [0, 10])}
              height={2}
              color="#ffffff"
              transform={[
                { rotate: interpolate(progress.value, [0, 1], [0, Math.PI / 2]) }
              ]}
            />
            <Rect
              x={150}
              y={150}
              width={8}
              height={2}
              color="#ffffff"
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
    height: 200,
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default TextToVisualAnimation;
