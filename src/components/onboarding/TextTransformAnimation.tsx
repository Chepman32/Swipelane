import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Group, Rect, Text } from '@shopify/react-native-skia';

const TextTransformAnimation: React.FC = () => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [progress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Canvas style={styles.canvas}>
          {/* Background gradient effect */}
          <Rect
            x={0}
            y={0}
            width={300}
            height={200}
            color="#f0f9ff"
          />
          
          {/* Text particles transforming into slides */}
          <Group>
            {/* Text representation */}
            <Text
              x={50}
              y={100}
              text="Text"
              color="#3b82f6"
              opacity={interpolate(progress.value, [0, 0.5], [1, 0])}
              font={null}
            />
            
            {/* Arrow */}
            <Rect
              x={120}
              y={90}
              width={interpolate(progress.value, [0.3, 0.7], [0, 60])}
              height={2}
              color="#10b981"
            />
            
            {/* Slide representation */}
            <Rect
              x={interpolate(progress.value, [0.5, 1], [200, 150])}
              y={60}
              width={100}
              height={80}
              color="#8b5cf6"
              opacity={interpolate(progress.value, [0.5, 1], [0, 1])}
            />
            
            {/* Slide content lines */}
            <Rect
              x={interpolate(progress.value, [0.5, 1], [210, 160])}
              y={75}
              width={interpolate(progress.value, [0.5, 1], [0, 80])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.5, 1], [0, 0.8])}
            />
            <Rect
              x={interpolate(progress.value, [0.5, 1], [210, 160])}
              y={85}
              width={interpolate(progress.value, [0.5, 1], [0, 60])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.5, 1], [0, 0.8])}
            />
            <Rect
              x={interpolate(progress.value, [0.5, 1], [210, 160])}
              y={95}
              width={interpolate(progress.value, [0.5, 1], [0, 70])}
              height={2}
              color="#ffffff"
              opacity={interpolate(progress.value, [0.5, 1], [0, 0.8])}
            />
          </Group>
          
          {/* Decorative elements */}
          <Group opacity={0.3}>
            <Rect
              x={20}
              y={20}
              width={4}
              height={4}
              color="#fbbf24"
              transform={[
                { rotate: interpolate(progress.value, [0, 1], [0, Math.PI * 2]) }
              ]}
            />
            <Rect
              x={260}
              y={160}
              width={4}
              height={4}
              color="#f59e0b"
              transform={[
                { rotate: interpolate(progress.value, [0, 1], [0, -Math.PI * 2]) }
              ]}
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

export default TextTransformAnimation;
