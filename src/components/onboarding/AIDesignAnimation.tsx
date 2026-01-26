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

const AIDesignAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* AI Brain representation */}
          <Group>
            {/* Main brain circle */}
            <Circle
              cx={150}
              cy={100}
              r={interpolate(progress.value, [0, 1], [30, 50])}
              color="#8b5cf6"
              opacity={0.8}
            />
            
            {/* Neural network nodes */}
            <Circle
              cx={120}
              cy={80}
              r={interpolate(progress.value, [0.2, 0.8], [0, 8])}
              color="#3b82f6"
            />
            <Circle
              cx={180}
              cy={80}
              r={interpolate(progress.value, [0.3, 0.9], [0, 8])}
              color="#3b82f6"
            />
            <Circle
              cx={120}
              cy={120}
              r={interpolate(progress.value, [0.4, 1], [0, 8])}
              color="#3b82f6"
            />
            <Circle
              cx={180}
              cy={120}
              r={interpolate(progress.value, [0.5, 1], [0, 8])}
              color="#3b82f6"
            />
            
            {/* Connecting lines */}
            <Rect
              x={120}
              y={80}
              width={interpolate(progress.value, [0.2, 0.8], [0, 60])}
              height={2}
              color="#10b981"
              opacity={0.6}
            />
            <Rect
              x={120}
              y={120}
              width={interpolate(progress.value, [0.4, 1], [0, 60])}
              height={2}
              color="#10b981"
              opacity={0.6}
            />
          </Group>
          
          {/* Design elements being created */}
          <Group>
            {/* Slide layout */}
            <Rect
              x={50}
              y={150}
              width={80}
              height={60}
              color="#f59e0b"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.8])}
            />
            <Rect
              x={60}
              y={160}
              width={interpolate(progress.value, [0.6, 1], [0, 60])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.6])}
            />
            <Rect
              x={60}
              y={170}
              width={interpolate(progress.value, [0.6, 1], [0, 50])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.6])}
            />
            
            {/* Another slide */}
            <Rect
              x={170}
              y={150}
              width={80}
              height={60}
              color="#ef4444"
              opacity={interpolate(progress.value, [0.7, 1], [0, 0.8])}
            />
            <Rect
              x={180}
              y={160}
              width={interpolate(progress.value, [0.7, 1], [0, 60])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.7, 1], [0, 0.6])}
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
    height: 250,
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AIDesignAnimation;
