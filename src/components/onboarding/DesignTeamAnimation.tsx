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

const DesignTeamAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const teamScale = useSharedValue(1);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    teamScale.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, teamScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: teamScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Design team members */}
          <Group>
            {/* Team member 1 - Designer */}
            <Circle
              cx={80}
              cy={70}
              r={12}
              color="#3b82f6"
              opacity={0.9}
            />
            <Rect
              x={72}
              y={82}
              width={16}
              height={20}
              color="#3b82f6"
              opacity={0.9}
            />
            {/* Design tool */}
            <Rect
              x={85}
              y={75}
              width={interpolate(progress.value, [0.2, 0.8], [0, 15])}
              height={2}
              color="#1f2937"
              transform={[
                { rotate: interpolate(progress.value, [0.2, 0.8], [0, -0.5]) }
              ]}
            />
            
            {/* Team member 2 - Creative Director */}
            <Circle
              cx={150}
              cy={60}
              r={12}
              color="#8b5cf6"
              opacity={0.9}
            />
            <Rect
              x={142}
              y={72}
              width={16}
              height={20}
              color="#8b5cf6"
              opacity={0.9}
            />
            {/* Creative spark */}
            <Circle
              cx={155}
              cy={65}
              r={interpolate(progress.value, [0.3, 0.9], [0, 5])}
              color="#fbbf24"
            />
            
            {/* Team member 3 - Layout Expert */}
            <Circle
              cx={220}
              cy={70}
              r={12}
              color="#10b981"
              opacity={0.9}
            />
            <Rect
              x={212}
              y={82}
              width={16}
              height={20}
              color="#10b981"
              opacity={0.9}
            />
            {/* Grid lines */}
            <Rect
              x={225}
              y={75}
              width={interpolate(progress.value, [0.4, 1], [0, 12])}
              height={1}
              color="#1f2937"
            />
            <Rect
              x={220}
              y={80}
              width={interpolate(progress.value, [0.4, 1], [0, 12])}
              height={1}
              color="#1f2937"
            />
          </Group>
          
          {/* Collaboration lines */}
          <Group opacity={0.5}>
            <Rect
              x={92}
              y={70}
              width={interpolate(progress.value, [0.5, 0.8], [0, 46])}
              height={1}
              color="#6b7280"
            />
            <Rect
              x={162}
              y={60}
              width={interpolate(progress.value, [0.6, 0.9], [0, 46])}
              height={1}
              color="#6b7280"
            />
          </Group>
          
          {/* Resulting professional slide */}
          <Group opacity={interpolate(progress.value, [0.7, 1], [0, 1])}>
            <Rect
              x={100}
              y={120}
              width={100}
              height={70}
              color="#ef4444"
            />
            
            {/* Professional content */}
            <Rect
              x={110}
              y={130}
              width={interpolate(progress.value, [0.8, 1], [0, 80])}
              height={3}
              color="#ffffff"
              opacity={0.9}
            />
            <Rect
              x={110}
              y={140}
              width={interpolate(progress.value, [0.85, 1], [0, 70])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={110}
              y={148}
              width={interpolate(progress.value, [0.9, 1], [0, 75])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={110}
              y={156}
              width={interpolate(progress.value, [0.95, 1], [0, 65])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            
            {/* Quality indicators */}
            <Circle
              cx={180}
              cy={135}
              r={interpolate(progress.value, [0.8, 1], [0, 6])}
              color="#fbbf24"
            />
            <Circle
              cx={180}
              cy={150}
              r={interpolate(progress.value, [0.9, 1], [0, 5])}
              color="#10b981"
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

export default DesignTeamAnimation;
