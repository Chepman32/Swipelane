import React, { useCallback, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Image,
  LinearGradient,
  Path,
  Rect,
  Skia,
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
type FontMeasurer = { measureText: (text: string) => { width: number } };

function wrapTextToLines(text: string, font: FontMeasurer, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ').filter(Boolean);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) result.push(current);
        current = word;
      }
    }
    if (current) result.push(current);
  }
  return result;
}

interface SkiaRoadmapRendererProps {
  slide: RoadmapSlide;
  style?: StyleProp<ViewStyle>;
  selectedCircleId?: string | null;
  onCircleTap?: (circleId: string, x: number, y: number) => void;
  selectedPanelIndex?: number;
  onPanelTap?: (panelIndex: number) => void;
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
  selectedPanelIndex,
  onPanelTap,
}) => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const isCarousel = slide.templateId === 'carousel';

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

  const effectivePanelWidth = useMemo(() => {
    if (isCarousel && slide.carouselData) {
      return size.width / slide.carouselData.panelCount;
    }
    return size.width;
  }, [isCarousel, slide.carouselData, size.width]);

  const titleFontSize = useMemo(() => {
    if (isCarousel) return Math.max(10, Math.min(20, effectivePanelWidth * 0.09));
    return Math.max(12, Math.min(24, size.width * 0.04));
  }, [isCarousel, effectivePanelWidth, size.width]);

  const bodyFontSize = useMemo(() => {
    if (isCarousel) return Math.max(8, Math.min(16, effectivePanelWidth * 0.065));
    return Math.max(11, Math.min(20, size.width * 0.032));
  }, [isCarousel, effectivePanelWidth, size.width]);

  const smallFontSize = useMemo(() => {
    return Math.max(7, Math.min(12, effectivePanelWidth * 0.05));
  }, [effectivePanelWidth]);

  const titleFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
    titleFontSize,
  );
  const bodyFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
    bodyFontSize,
  );
  const boldFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Bold.ttf'),
    titleFontSize,
  );
  const smallFont = useFont(
    require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
    smallFontSize,
  );

  // Carousel-specific image hooks (always called, return null when not carousel)
  const carouselMainImage = useImage(slide.carouselData?.cover.mainImageUri ?? null);
  const carouselAvatarImage = useImage(slide.carouselData?.cover.authorAvatarUri ?? null);

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

  // Handle tap to detect which circle or panel was tapped
  const handleCanvasTap = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    // Carousel: detect which panel was tapped
    if (isCarousel && slide.carouselData && onPanelTap) {
      const panelWidth = size.width / slide.carouselData.panelCount;
      const panelIdx = Math.max(0, Math.min(
        slide.carouselData.panelCount - 1,
        Math.floor(locationX / panelWidth),
      ));
      onPanelTap(panelIdx);
      return;
    }

    if (!template || !onCircleTap) return;

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
    isCarousel,
    slide.carouselData,
    onPanelTap,
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

  // Render all carousel panels as Skia elements
  const renderCarouselPanels = () => {
    const cd = slide.carouselData!;
    const panelWidth = size.width / cd.panelCount;
    const panelHeight = size.height;
    const pad = panelWidth * 0.08;
    const textAreaWidth = panelWidth - 2 * pad;

    return Array.from({ length: cd.panelCount }, (_, panelIndex) => {
      const panelX = panelIndex * panelWidth;
      const panelClip = Skia.XYWHRect(panelX, 0, panelWidth, panelHeight);

      if (panelIndex === 0) {
        const cover = cd.cover;
        const effectiveTextW = carouselMainImage ? textAreaWidth * 0.88 : textAreaWidth;
        const subtitleY = panelHeight * 0.14;
        const titleY = panelHeight * 0.24;
        const titleLineH = titleFontSize * 1.45;
        const descTopY = titleY + titleLineH * 3 + titleFontSize * 0.3;
        const descLineH = bodyFontSize * 1.5;
        const descLines = bodyFont ? wrapTextToLines(cover.description, bodyFont, effectiveTextW) : [];
        const buttonY = descTopY + descLines.length * descLineH + titleFontSize * 0.5;
        const buttonH = titleFontSize * 1.6;
        const buttonPad = titleFontSize * 0.5;
        const avatarR = Math.min(panelWidth * 0.07, 16);
        const avatarCx = panelX + pad + avatarR;
        const avatarCy = panelHeight * 0.84;
        const avatarClipPath = Skia.Path.Make();
        avatarClipPath.addCircle(avatarCx, avatarCy, avatarR);

        return (
          <Group key="panel-0" clip={panelClip}>
            {/* Cover background */}
            {slide.backgroundType === 'image' && backgroundImage ? (
              <Image image={backgroundImage} x={0} y={0} width={size.width} height={panelHeight} fit="cover" />
            ) : slide.backgroundType === 'solid' && slide.backgroundColor ? (
              <Rect x={0} y={0} width={size.width} height={panelHeight} color={slide.backgroundColor} />
            ) : (
              <Rect x={0} y={0} width={size.width} height={panelHeight}>
                <LinearGradient start={gradientPoints.start} end={gradientPoints.end} colors={gradientPoints.colors} />
              </Rect>
            )}

            {/* Main image */}
            {carouselMainImage && (
              <Image
                image={carouselMainImage}
                x={panelX + panelWidth * 0.5}
                y={panelHeight * 0.08}
                width={panelWidth * 0.52}
                height={panelHeight * 0.78}
                fit="contain"
              />
            )}

            {/* Subtitle */}
            {smallFont && cover.subtitle ? (
              <SkiaText x={panelX + pad} y={subtitleY} text={cover.subtitle} font={smallFont} color="rgba(255,255,255,0.65)" />
            ) : null}

            {/* Title lines */}
            {boldFont && [cover.titlePart1, cover.titlePart2, cover.titleHighlight].map((line, i) =>
              line ? (
                <SkiaText
                  key={i}
                  x={panelX + pad}
                  y={titleY + i * titleLineH}
                  text={line}
                  font={boldFont}
                  color={i === 2 ? cd.accentColor : '#FFFFFF'}
                />
              ) : null
            )}

            {/* Description */}
            {bodyFont && descLines.map((line, i) =>
              line ? (
                <SkiaText key={i} x={panelX + pad} y={descTopY + i * descLineH} text={line} font={bodyFont} color="rgba(255,255,255,0.8)" />
              ) : null
            )}

            {/* Swipe button pill */}
            {boldFont && cover.buttonText && (() => {
              const bw = boldFont.measureText(cover.buttonText).width + buttonPad * 2;
              const btnPath = Skia.Path.Make();
              btnPath.addRRect(Skia.RRectXY(Skia.XYWHRect(panelX + pad, buttonY, bw, buttonH), buttonH / 2, buttonH / 2));
              return (
                <>
                  <Path path={btnPath} color={cd.accentColor} />
                  <SkiaText x={panelX + pad + buttonPad} y={buttonY + buttonH * 0.68} text={cover.buttonText} font={boldFont} color="#FFFFFF" />
                </>
              );
            })()}

            {/* Author avatar */}
            {carouselAvatarImage ? (
              <Group clip={avatarClipPath} invertClip={false}>
                <Image image={carouselAvatarImage} x={avatarCx - avatarR} y={avatarCy - avatarR} width={avatarR * 2} height={avatarR * 2} fit="cover" />
              </Group>
            ) : (
              <Circle cx={avatarCx} cy={avatarCy} r={avatarR} color="rgba(255,255,255,0.2)" />
            )}

            {/* Author name */}
            {smallFont && cover.authorName ? (
              <SkiaText x={avatarCx + avatarR + pad * 0.6} y={avatarCy - avatarR * 0.1} text={cover.authorName} font={smallFont} color="#FFFFFF" />
            ) : null}

            {/* Author title */}
            {smallFont && cover.authorTitle ? (
              <SkiaText x={avatarCx + avatarR + pad * 0.6} y={avatarCy + avatarR * 0.9} text={cover.authorTitle} font={smallFont} color="rgba(255,255,255,0.65)" />
            ) : null}

            {/* Selected panel highlight */}
            {selectedPanelIndex === 0 && (
              <Rect x={panelX + 1} y={1} width={panelWidth - 2} height={panelHeight - 2} color="rgba(0,122,255,0.1)" />
            )}

            {/* Right divider */}
            <Rect x={panelX + panelWidth - 1} y={0} width={2} height={panelHeight} color={cd.dividerColor} />
          </Group>
        );
      }

      // Step panel
      const step = cd.steps[panelIndex - 1];
      if (!step) return null;

      const badgeR = Math.min(panelWidth * 0.09, 18);
      const badgeCx = panelX + pad + badgeR;
      const badgeCy = panelHeight * 0.14 + badgeR;
      const part1W = boldFont ? boldFont.measureText(step.titlePart1).width : 0;
      const highlightW = boldFont ? boldFont.measureText(step.titleHighlight).width : 0;
      const titleFitsOneLine = part1W + titleFontSize * 0.3 + highlightW <= textAreaWidth;
      const titleTopY = badgeCy + badgeR + titleFontSize * 1.5;
      const titleTotalLines = titleFitsOneLine ? 1 : 2;
      const descTopY = titleTopY + titleTotalLines * titleFontSize * 1.45 + titleFontSize * 0.3;
      const descLineH = bodyFontSize * 1.5;
      const descLines = bodyFont ? wrapTextToLines(step.description, bodyFont, textAreaWidth) : [];
      const shapeR1 = panelWidth * 0.45;
      const shape1Cx = panelX + panelWidth * 0.82;
      const shape1Cy = panelHeight * 0.12;
      const shapeR2 = panelWidth * 0.35;
      const shape2Cx = panelX + panelWidth * 0.18;
      const shape2Cy = panelHeight * 0.88;

      return (
        <Group key={`panel-${panelIndex}`} clip={panelClip}>
          {/* Background */}
          <Rect x={panelX} y={0} width={panelWidth} height={panelHeight} color={cd.backgroundColor} />

          {/* Decorative shapes */}
          {cd.showShapes && (
            <>
              <Circle cx={shape1Cx} cy={shape1Cy} r={shapeR1} color={cd.shapeColor} />
              <Circle cx={shape2Cx} cy={shape2Cy} r={shapeR2} color={cd.shapeColor} />
            </>
          )}

          {/* Selected panel highlight */}
          {selectedPanelIndex === panelIndex && (
            <Rect x={panelX + 1} y={1} width={panelWidth - 2} height={panelHeight - 2} color="rgba(0,122,255,0.1)" />
          )}

          {/* Number badge */}
          <Circle cx={badgeCx} cy={badgeCy} r={badgeR} color={cd.accentColor} />
          {boldFont && (
            <SkiaText
              x={badgeCx - boldFont.measureText(String(panelIndex)).width / 2}
              y={badgeCy + titleFontSize * 0.38}
              text={String(panelIndex)}
              font={boldFont}
              color="#FFFFFF"
            />
          )}

          {/* Two-part title */}
          {boldFont && (
            <>
              <SkiaText x={panelX + pad} y={titleTopY} text={step.titlePart1} font={boldFont} color="#FFFFFF" />
              <SkiaText
                x={titleFitsOneLine ? panelX + pad + part1W + titleFontSize * 0.3 : panelX + pad}
                y={titleFitsOneLine ? titleTopY : titleTopY + titleFontSize * 1.45}
                text={step.titleHighlight}
                font={boldFont}
                color={cd.accentColor}
              />
            </>
          )}

          {/* Description */}
          {bodyFont && descLines.map((line, i) =>
            line ? (
              <SkiaText key={i} x={panelX + pad} y={descTopY + i * descLineH} text={line} font={bodyFont} color="rgba(255,255,255,0.82)" />
            ) : null
          )}

          {/* Right divider (not on last panel) */}
          {panelIndex < cd.panelCount - 1 && (
            <Rect x={panelX + panelWidth - 1} y={0} width={2} height={panelHeight} color={cd.dividerColor} />
          )}
        </Group>
      );
    });
  };

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
          {/* Carousel rendering */}
          {isCarousel && slide.carouselData && renderCarouselPanels()}

          {/* Non-carousel: background + template + circles */}
          {!isCarousel && (
            <>

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

          {/* Image template asset on top of selected background */}
          {imageTemplateReady && imageTemplateConfig && imageTemplateFrame && imageTemplateAsset && (
            <Image
              image={imageTemplateAsset}
              x={imageTemplateFrame.x}
              y={imageTemplateFrame.y}
              width={imageTemplateFrame.width}
              height={imageTemplateFrame.height}
              fit="fill"
            />
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
                const hideDefaultFifthStepLabel =
                  slide.templateId === 'winding_5_road' &&
                  circle.id === 'c5' &&
                  /^step\s*5$/i.test(labelText);
                const renderedLabelText = hideDefaultFifthStepLabel ? '' : labelText;
                const linearLabelXOffset =
                  slide.templateId === 'linear_4_chain' && circle.id === 'c1'
                    ? titleFontSize * 0.35
                    : 0;

                const linearLabelY = Math.min(
                  imageTemplateFrame.y + imageTemplateFrame.height - titleFontSize * 0.5,
                  cy + r * 2.7,
                );
                const windingTopCircleOffset = circle.position.y <= 0.45 ? r * 1.5 : 0;
                const windingLabelBelowY = Math.min(
                  imageTemplateFrame.y + imageTemplateFrame.height - titleFontSize * 0.5,
                  cy + r + titleFontSize * 1.4 + windingTopCircleOffset,
                );
                const windingDetailY = Math.min(
                  imageTemplateFrame.y + imageTemplateFrame.height - bodyFontSize * 0.4,
                  windingLabelBelowY + bodyFontSize * 1.4,
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
                      renderedLabelText &&
                      titleFont && (
                        <SkiaText
                          x={
                            cx -
                            titleFont.measureText(renderedLabelText).width / 2 +
                            linearLabelXOffset
                          }
                          y={linearLabelY}
                          text={renderedLabelText}
                          font={titleFont}
                          color="#2D2D2D"
                        />
                      )}

                    {imageTemplateConfig.textMode === 'winding_above_and_below' && (
                      <>
                        {renderedLabelText && titleFont && (
                          <SkiaText
                            x={cx - titleFont.measureText(renderedLabelText).width / 2}
                            y={windingLabelBelowY}
                            text={renderedLabelText}
                            font={titleFont}
                            color="#2D2D2D"
                          />
                        )}
                        {detailText && bodyFont && (
                          <SkiaText
                            x={cx - bodyFont.measureText(detailText).width / 2}
                            y={windingDetailY}
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

            </> /* end !isCarousel */
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
