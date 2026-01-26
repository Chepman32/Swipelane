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

const ProfessionalSlidesAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const floatY = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    floatY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress, floatY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateY: interpolate(floatY.value, [0, 0.5, 1], [0, -10, 0])
    }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Professional slides stack */}
          <Group>
            {/* Back slides */}
            <Rect
              x={60}
              y={60 + interpolate(progress.value, [0, 1], [0, 5])}
              width={100}
              height={70}
              color="#e5e7eb"
              opacity={0.6}
            />
            <Rect
              x={70}
              y={50 + interpolate(progress.value, [0, 1], [0, 3])}
              width={100}
              height={70}
              color="#d1d5db"
              opacity={0.7}
            />
            
            {/* Main slide */}
            <Rect
              x={80}
              y={40}
              width={100}
              height={70}
              color="#3b82f6"
              opacity={0.9}
            />
            
            {/* Slide content */}
            <Rect
              x={90}
              y={50}
              width={interpolate(progress.value, [0.3, 1], [0, 80])}
              height={3}
              color="#ffffff"
              opacity={0.9}
            />
            <Rect
              x={90}
              y={60}
              width={interpolate(progress.value, [0.4, 1], [0, 60])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={90}
              y={68}
              width={interpolate(progress.value, [0.5, 1], [0, 70])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
            <Rect
              x={90}
              y={76}
              width={interpolate(progress.value, [0.6, 1], [0, 50])}
              height={2}
              color="#ffffff"
              opacity={0.8}
            />
          </Group>
          
          {/* Audience figures */}
          <Group opacity={interpolate(progress.value, [0.7, 1], [0, 0.8])}>
            {/* Audience member 1 */}
            <Circle
              cx={220}
              cy={80}
              r={8}
              color="#10b981"
            />
            <Rect
              x={215}
              y={88}
              width={10}
              height={15}
              color="#10b981"
            />
            
            {/* Audience member 2 */}
            <Circle
              cx={240}
              cy={85}
              r={8}
              color="#f59e0b"
            />
            <Rect
              x={235}
              y={93}
              width={10}
              height={15}
              color="#f59e0b"
            />
            
            {/* Audience member 3 */}
            <Circle
              cx={260}
              cy={80}
              r={8}
              color="#ef4444"
            />
            <Rect
              x={255}
              y={88}
              width={10}
              height={15}
              color="#ef4444"
            />
          </Group>
          
          {/* Success indicators */}
          <Group>
            <Circle
              cx={200}
              cy={50}
              r={interpolate(progress.value, [0.8, 1], [0, 6])}
              color="#fbbf24"
            />
            <Circle
              cx={230}
              cy={120}
              r={interpolate(progress.value, [0.9, 1], [0, 5])}
              color="#fbbf24"
            />
            <Circle
              cx={250}
              cy={60}
              r={interpolate(progress.value, [0.85, 1], [0, 4])}
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

export default ProfessionalSlidesAnimation;
