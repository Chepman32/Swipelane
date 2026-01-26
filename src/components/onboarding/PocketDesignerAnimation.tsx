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

const PocketDesignerAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const pocketScale = useSharedValue(1);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    pocketScale.value = withRepeat(
      withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, pocketScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pocketScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Phone/Pocket representation */}
          <Group>
            {/* Phone outline */}
            <Rect
              x={120}
              y={40}
              width={60}
              height={100}
              color="#1f2937"
              opacity={0.9}
            />
            <Rect
              x={125}
              y={50}
              width={50}
              height={80}
              color="#3b82f6"
              opacity={0.8}
            />
            
            {/* Designer tools inside phone */}
            <Circle
              cx={150}
              cy={70}
              r={interpolate(progress.value, [0.2, 0.8], [0, 8])}
              color="#ffffff"
            />
            <Rect
              x={135}
              y={85}
              width={interpolate(progress.value, [0.3, 0.9], [0, 30])}
              height={3}
              color="#ffffff"
              opacity={0.9}
            />
            <Rect
              x={135}
              y={95}
              width={interpolate(progress.value, [0.4, 1], [0, 25])}
              height={3}
              color="#ffffff"
              opacity={0.9}
            />
            <Rect
              x={135}
              y={105}
              width={interpolate(progress.value, [0.5, 1], [0, 28])}
              height={3}
              color="#ffffff"
              opacity={0.9}
            />
          </Group>
          
          {/* Design elements coming out */}
          <Group>
            {/* Floating slides */}
            <Rect
              x={50}
              y={60 + interpolate(progress.value, [0.6, 1], [0, -20])}
              width={40}
              height={30}
              color="#8b5cf6"
              opacity={interpolate(progress.value, [0.6, 1], [0, 0.8])}
              transform={[
                { rotate: interpolate(progress.value, [0.6, 1], [0, -0.2]) }
              ]}
            />
            
            <Rect
              x={210}
              y={80 + interpolate(progress.value, [0.7, 1], [0, -15])}
              width={40}
              height={30}
              color="#10b981"
              opacity={interpolate(progress.value, [0.7, 1], [0, 0.8])}
              transform={[
                { rotate: interpolate(progress.value, [0.7, 1], [0, 0.2]) }
              ]}
            />
            
            <Rect
              x={60}
              y={120 + interpolate(progress.value, [0.8, 1], [0, -10])}
              width={40}
              height={30}
              color="#f59e0b"
              opacity={interpolate(progress.value, [0.8, 1], [0, 0.8])}
              transform={[
                { rotate: interpolate(progress.value, [0.8, 1], [0, -0.1]) }
              ]}
            />
          </Group>
          
          {/* Pocket indicator */}
          <Group>
            <Rect
              x={100}
              y={160}
              width={100}
              height={30}
              color="#6b7280"
              opacity={0.3}
            />
            <Circle
              cx={150}
              cy={175}
              r={interpolate(progress.value, [0, 1], [0, 12])}
              color="#ef4444"
              opacity={0.7}
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

export default PocketDesignerAnimation;
