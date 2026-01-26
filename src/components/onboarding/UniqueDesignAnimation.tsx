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

const UniqueDesignAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const uniqueScale = useSharedValue(1);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    uniqueScale.value = withRepeat(
      withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, uniqueScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: uniqueScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Cliché slides fading away */}
          <Group opacity={interpolate(progress.value, [0, 0.4], [1, 0])}>
            <Rect
              x={50}
              y={60}
              width={60}
              height={45}
              color="#9ca3af"
            />
            <Rect
              x={60}
              y={70}
              width={40}
              height={2}
              color="#ffffff"
            />
            <Rect
              x={60}
              y={78}
              width={35}
              height={2}
              color="#ffffff"
            />
          </Group>
          
          <Group opacity={interpolate(progress.value, [0.1, 0.5], [1, 0])}>
            <Rect
              x={190}
              y={80}
              width={60}
              height={45}
              color="#9ca3af"
            />
            <Rect
              x={200}
              y={90}
              width={40}
              height={2}
              color="#ffffff"
            />
            <Rect
              x={200}
              y={98}
              width={35}
              height={2}
              color="#ffffff"
            />
          </Group>
          
          {/* Breaking free effect */}
          <Group>
            {/* Break lines */}
            <Rect
              x={80}
              y={82}
              width={interpolate(progress.value, [0.3, 0.7], [0, 40])}
              height={3}
              color="#ef4444"
              opacity={0.8}
              transform={[
                { rotate: interpolate(progress.value, [0.3, 0.7], [0, 0.3]) }
              ]}
            />
            <Rect
              x={180}
              y={102}
              width={interpolate(progress.value, [0.4, 0.8], [0, 40])}
              height={3}
              color="#ef4444"
              opacity={0.8}
              transform={[
                { rotate: interpolate(progress.value, [0.4, 0.8], [0, -0.3]) }
              ]}
            />
          </Group>
          
          {/* Unique stunning slides emerging */}
          <Group opacity={interpolate(progress.value, [0.6, 1], [0, 1])}>
            {/* Unique slide 1 - Diamond shape */}
            <Rect
              x={100}
              y={50}
              width={50}
              height={50}
              color="#8b5cf6"
              transform={[
                { rotate: Math.PI / 4 }
              ]}
            />
            <Circle
              cx={125}
              cy={75}
              r={interpolate(progress.value, [0.7, 1], [0, 8])}
              color="#fbbf24"
            />
            
            {/* Unique slide 2 - Triangle style */}
            <Rect
              x={180}
              y={60}
              width={40}
              height={60}
              color="#10b981"
              transform={[
                { rotate: interpolate(progress.value, [0.6, 1], [0, -0.2]) }
              ]}
            />
            <Rect
              x={190}
              y={75}
              width={interpolate(progress.value, [0.8, 1], [0, 20])}
              height={3}
              color="#ffffff"
              opacity={0.9}
            />
            
            {/* Unique slide 3 - Circular */}
            <Circle
              cx={80}
              cy={120}
              r={interpolate(progress.value, [0.7, 1], [0, 25])}
              color="#f59e0b"
            />
            <Rect
              x={70}
              y={115}
              width={interpolate(progress.value, [0.8, 1], [0, 20])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={70}
              y={122}
              width={interpolate(progress.value, [0.9, 1], [0, 20])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
          </Group>
          
          {/* Standout indicators */}
          <Group>
            <Circle
              cx={150}
              cy={40}
              r={interpolate(progress.value, [0.8, 1], [0, 6])}
              color="#fbbf24"
            />
            <Circle
              cx={220}
              cy={130}
              r={interpolate(progress.value, [0.85, 1], [0, 5])}
              color="#fbbf24"
            />
            <Circle
              cx={60}
              cy={160}
              r={interpolate(progress.value, [0.9, 1], [0, 4])}
              color="#fbbf24"
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

export default UniqueDesignAnimation;
