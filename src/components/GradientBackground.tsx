import React, { useCallback, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import type { SlideBackgroundGradient } from '../services/StorageService';

type Size = { width: number; height: number };

interface GradientBackgroundProps {
  gradient: SlideBackgroundGradient;
  style?: StyleProp<ViewStyle>;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  gradient,
  style,
}) => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }, [size.height, size.width]);

  const startPoint = useMemo(
    () => vec(size.width * gradient.start.x, size.height * gradient.start.y),
    [gradient.start.x, gradient.start.y, size.height, size.width],
  );
  const endPoint = useMemo(
    () => vec(size.width * gradient.end.x, size.height * gradient.end.y),
    [gradient.end.x, gradient.end.y, size.height, size.width],
  );

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      pointerEvents="none"
    >
      {size.width > 0 && size.height > 0 ? (
        <Canvas style={{ width: size.width, height: size.height }}>
          <Rect x={0} y={0} width={size.width} height={size.height}>
            <LinearGradient start={startPoint} end={endPoint} colors={gradient.colors} />
          </Rect>
        </Canvas>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default GradientBackground;
