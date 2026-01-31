import React, { useCallback, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
  Group,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import type { RoadmapSlide, RoadmapTemplate } from '../../types/roadmap';
import { getRoadmapTemplateById, ROADMAP_BACKGROUNDS } from '../../constants/roadmapTemplates';
import RoadmapCircle from './RoadmapCircle';
import RoadmapConnector from './RoadmapConnector';

type Size = { width: number; height: number };

interface SkiaRoadmapRendererProps {
  slide: RoadmapSlide;
  style?: StyleProp<ViewStyle>;
  selectedCircleId?: string | null;
  onCircleTap?: (circleId: string, x: number, y: number) => void;
}

const SkiaRoadmapRenderer: React.FC<SkiaRoadmapRendererProps> = ({
  slide,
  style,
  selectedCircleId,
  onCircleTap,
}) => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  }, [size.height, size.width]);

  // Get the template for this slide
  const template = useMemo(() => {
    return getRoadmapTemplateById(slide.templateId);
  }, [slide.templateId]);

  // Background gradient points
  const gradientPoints = useMemo(() => {
    if (!slide.backgroundGradient) {
      // Use default dark gradient
      const defaultBg = ROADMAP_BACKGROUNDS[0];
      return {
        start: vec(size.width * defaultBg.start.x, size.height * defaultBg.start.y),
        end: vec(size.width * defaultBg.end.x, size.height * defaultBg.end.y),
        colors: defaultBg.colors,
      };
    }
    return {
      start: vec(
        size.width * slide.backgroundGradient.start.x,
        size.height * slide.backgroundGradient.start.y
      ),
      end: vec(
        size.width * slide.backgroundGradient.end.x,
        size.height * slide.backgroundGradient.end.y
      ),
      colors: slide.backgroundGradient.colors,
    };
  }, [slide.backgroundGradient, size]);

  // Load background image if needed
  const backgroundImage = useImage(
    slide.backgroundType === 'image' && slide.backgroundImageUri
      ? slide.backgroundImageUri
      : null
  );

  // Load corner images
  const cornerImages = slide.cornerImages.map(corner => ({
    ...corner,
    image: useImage(corner.imageUri),
  }));

  // Handle tap to detect which circle was tapped
  const handleCanvasTap = useCallback((event: any) => {
    if (!template || !onCircleTap) return;

    const { locationX, locationY } = event.nativeEvent;
    const minDimension = Math.min(size.width, size.height);

    // Check if tap is within any circle
    for (const circle of template.circles) {
      const cx = circle.position.x * size.width;
      const cy = circle.position.y * size.height;
      const r = circle.radius * minDimension;

      const distance = Math.sqrt(
        Math.pow(locationX - cx, 2) + Math.pow(locationY - cy, 2)
      );

      if (distance <= r * 1.2) {
        onCircleTap(circle.id, cx, cy);
        return;
      }
    }
  }, [template, size, onCircleTap]);

  if (!template) {
    return null;
  }

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
      {size.width > 0 && size.height > 0 && (
        <Canvas
          style={{ width: size.width, height: size.height }}
          onTouchEnd={handleCanvasTap}
        >
          {/* Background layer */}
          {slide.backgroundType === 'image' && backgroundImage ? (
            <Image
              image={backgroundImage}
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              fit="cover"
            />
          ) : slide.backgroundType === 'solid' && slide.backgroundColor ? (
            <Rect
              x={0}
              y={0}
              width={size.width}
              height={size.height}
              color={slide.backgroundColor}
            />
          ) : (
            <Rect x={0} y={0} width={size.width} height={size.height}>
              <LinearGradient
                start={gradientPoints.start}
                end={gradientPoints.end}
                colors={gradientPoints.colors}
              />
            </Rect>
          )}

          {/* Connectors layer (behind circles) */}
          <Group>
            {template.connectors.map((connector, index) => (
              <RoadmapConnector
                key={`connector-${index}`}
                connector={connector}
                circles={template.circles}
                width={size.width}
                height={size.height}
                strokeColor={slide.strokeColor}
                strokeWidth={slide.strokeWidth}
                dashPattern={template.defaultDashPattern}
              />
            ))}
          </Group>

          {/* Circles layer */}
          <Group>
            {template.circles.map(circle => {
              const content = slide.circles.find(c => c.circleId === circle.id);
              if (!content) return null;

              return (
                <RoadmapCircle
                  key={circle.id}
                  circle={circle}
                  content={content}
                  width={size.width}
                  height={size.height}
                  strokeColor={slide.strokeColor}
                  strokeWidth={slide.strokeWidth}
                  isSelected={selectedCircleId === circle.id}
                />
              );
            })}
          </Group>

          {/* Corner images layer */}
          <Group>
            {cornerImages.map((corner, index) => {
              if (!corner.image) return null;

              const imgSize = corner.size * Math.min(size.width, size.height);
              const padding = corner.padding * Math.min(size.width, size.height);

              let x = 0;
              let y = 0;

              switch (corner.position) {
                case 'topLeft':
                  x = padding;
                  y = padding;
                  break;
                case 'topRight':
                  x = size.width - imgSize - padding;
                  y = padding;
                  break;
                case 'bottomLeft':
                  x = padding;
                  y = size.height - imgSize - padding;
                  break;
                case 'bottomRight':
                  x = size.width - imgSize - padding;
                  y = size.height - imgSize - padding;
                  break;
              }

              return (
                <Image
                  key={`corner-${index}`}
                  image={corner.image}
                  x={x}
                  y={y}
                  width={imgSize}
                  height={imgSize}
                  fit="contain"
                />
              );
            })}
          </Group>
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default SkiaRoadmapRenderer;
