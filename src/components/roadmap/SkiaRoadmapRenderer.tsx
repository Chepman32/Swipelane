import React, { useCallback, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  LinearGradient,
  Rect,
  Text as SkiaText,
  useFont,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import type { RoadmapCircleDefinition, RoadmapSlide } from '../../types/roadmap';
import { getRoadmapTemplateById, ROADMAP_BACKGROUNDS } from '../../constants/roadmapTemplates';
import { getRoadmapImageBackedTemplateConfig } from '../../constants/roadmapTemplateAssets';
import RoadmapCircle from './RoadmapCircle';
import RoadmapConnector from './RoadmapConnector';

type Size = { width: number; height: number };
type RectFrame = { x: number; y: number; width: number; height: number };

interface SkiaRoadmapRendererProps {
  slide: RoadmapSlide;
  style?: StyleProp<ViewStyle>;
  selectedCircleId?: string | null;
  onCircleTap?: (circleId: string, x: number, y: number) => void;
}

interface CornerImageLayerProps {
  corner: RoadmapSlide['cornerImages'][number];
  width: number;
  height: number;
}

const getContainFrame = (
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): RectFrame => {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const containerRatio = containerWidth / containerHeight;
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > containerRatio) {
    const width = containerWidth;
    const height = width / imageRatio;
    return {
      x: 0,
      y: (containerHeight - height) / 2,
      width,
      height,
    };
  }

  const height = containerHeight;
  const width = height * imageRatio;
  return {
    x: (containerWidth - width) / 2,
    y: 0,
    width,
    height,
  };
};

const getCircleGeometry = (
  circle: RoadmapCircleDefinition,
  frame: RectFrame,
) => {
  const minDimension = Math.min(frame.width, frame.height);
  return {
    cx: frame.x + circle.position.x * frame.width,
    cy: frame.y + circle.position.y * frame.height,
    r: circle.radius * minDimension,
  };
};

const CornerImageLayer: React.FC<CornerImageLayerProps> = ({ corner, width, height }) => {
  const image = useImage(corner.imageUri ?? null);
  if (!image) return null;

  const minDimension = Math.min(width, height);
  const imgSize = corner.size * minDimension;
  const padding = corner.padding * minDimension;

  let x = 0;
  let y = 0;

  switch (corner.position) {
    case 'topLeft':
      x = padding;
      y = padding;
      break;
    case 'topRight':
      x = width - imgSize - padding;
      y = padding;
      break;
    case 'bottomLeft':
      x = padding;
      y = height - imgSize - padding;
      break;
    case 'bottomRight':
      x = width - imgSize - padding;
      y = height - imgSize - padding;
      break;
  }

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={imgSize}
      height={imgSize}
      fit="contain"
    />
  );
};

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

  const imageTemplateConfig = useMemo(
    () => getRoadmapImageBackedTemplateConfig(slide.templateId),
    [slide.templateId],
  );

  const imageTemplateAsset = useImage(imageTemplateConfig ? imageTemplateConfig.source : null);

  const imageTemplateFrame = useMemo(() => {
    if (!imageTemplateConfig) return null;
    return getContainFrame(
      size.width,
      size.height,
      imageTemplateConfig.originalWidth,
      imageTemplateConfig.originalHeight,
    );
  }, [imageTemplateConfig, size.height, size.width]);

  const imageTemplateReady = Boolean(
    imageTemplateConfig &&
      imageTemplateAsset &&
      imageTemplateFrame &&
      imageTemplateFrame.width > 0 &&
      imageTemplateFrame.height > 0,
  );

  const titleFontSize = useMemo(() => {
    return Math.max(12, Math.min(24, size.width * 0.04));
  }, [size.width]);

  const bodyFontSize = useMemo(() => {
    return Math.max(11, Math.min(20, size.width * 0.032));
  }, [size.width]);

  const titleFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    titleFontSize,
  );
  const bodyFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
    bodyFontSize,
  );

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

  // Handle tap to detect which circle was tapped
  const handleCanvasTap = useCallback((event: any) => {
    if (!template || !onCircleTap) return;

    const { locationX, locationY } = event.nativeEvent;
    const frame =
      imageTemplateConfig && imageTemplateFrame
        ? imageTemplateFrame
        : { x: 0, y: 0, width: size.width, height: size.height };

    // Check if tap is within any circle
    for (const circle of template.circles) {
      const { cx, cy, r } = getCircleGeometry(circle, frame);

      const distance = Math.sqrt(
        Math.pow(locationX - cx, 2) + Math.pow(locationY - cy, 2)
      );

      if (distance <= r * 1.2) {
        onCircleTap(circle.id, cx, cy);
        return;
      }
    }
  }, [
    imageTemplateConfig,
    imageTemplateFrame,
    onCircleTap,
    size.height,
    size.width,
    template,
  ]);

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
          {imageTemplateReady && imageTemplateConfig && imageTemplateFrame && imageTemplateAsset ? (
            <>
              <Rect
                x={0}
                y={0}
                width={size.width}
                height={size.height}
                color={imageTemplateConfig.canvasBackgroundColor}
              />
              <Image
                image={imageTemplateAsset}
                x={imageTemplateFrame.x}
                y={imageTemplateFrame.y}
                width={imageTemplateFrame.width}
                height={imageTemplateFrame.height}
                fit="fill"
              />
            </>
          ) : slide.backgroundType === 'image' && backgroundImage ? (
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

          {/* Template overlays */}
          {imageTemplateReady && imageTemplateConfig && imageTemplateFrame ? (
            <Group>
              {template.circles.map(circle => {
                const content = slide.circles.find(c => c.circleId === circle.id);
                if (!content) return null;

                const { cx, cy, r } = getCircleGeometry(circle, imageTemplateFrame);
                const labelText = content.label?.trim() || '';
                const detailText = content.text?.trim() || '';

                const linearLabelY = Math.min(
                  imageTemplateFrame.y + imageTemplateFrame.height - titleFontSize * 0.5,
                  cy + r * 2.7,
                );
                const windingTopY = Math.max(
                  imageTemplateFrame.y + titleFontSize,
                  cy - r - titleFontSize * 0.5,
                );
                const windingBottomY = Math.min(
                  imageTemplateFrame.y + imageTemplateFrame.height - bodyFontSize * 0.4,
                  cy + r + bodyFontSize * 1.4,
                );

                return (
                  <Group key={circle.id}>
                    {selectedCircleId === circle.id && (
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={r + 4}
                        color="rgba(0, 122, 255, 0.75)"
                        style="stroke"
                        strokeWidth={Math.max(2, r * 0.08)}
                      />
                    )}

                    {imageTemplateConfig.textMode === 'linear_under_arrows' &&
                      labelText &&
                      titleFont && (
                        <SkiaText
                          x={cx - titleFont.measureText(labelText).width / 2}
                          y={linearLabelY}
                          text={labelText}
                          font={titleFont}
                          color="#2D2D2D"
                        />
                      )}

                    {imageTemplateConfig.textMode === 'winding_above_and_below' && (
                      <>
                        {labelText && titleFont && (
                          <SkiaText
                            x={cx - titleFont.measureText(labelText).width / 2}
                            y={windingTopY}
                            text={labelText}
                            font={titleFont}
                            color="#2D2D2D"
                          />
                        )}
                        {detailText && bodyFont && (
                          <SkiaText
                            x={cx - bodyFont.measureText(detailText).width / 2}
                            y={windingBottomY}
                            text={detailText}
                            font={bodyFont}
                            color="#3D3D3D"
                          />
                        )}
                      </>
                    )}
                  </Group>
                );
              })}
            </Group>
          ) : (
            <>
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
            </>
          )}

          {/* Corner images layer */}
          <Group>
            {slide.cornerImages.map((corner, index) => (
              <CornerImageLayer
                key={`corner-${corner.position}-${corner.imageUri || index}`}
                corner={corner}
                width={size.width}
                height={size.height}
              />
            ))}
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
