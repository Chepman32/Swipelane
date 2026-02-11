import React, { useMemo } from 'react';
import {
  Circle,
  Group,
  RoundedRect,
  Text,
  useFont,
  Image,
  useImage,
  Skia,
} from '@shopify/react-native-skia';
import type { RoadmapCircleDefinition, RoadmapCircleContent } from '../../types/roadmap';
import { ROADMAP_DEFAULTS } from '../../constants/roadmapTemplates';

interface RoadmapCircleProps {
  circle: RoadmapCircleDefinition;
  content: RoadmapCircleContent;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  isSelected?: boolean;
}

const RoadmapCircle: React.FC<RoadmapCircleProps> = ({
  circle,
  content,
  width,
  height,
  strokeColor,
  strokeWidth,
  isSelected = false,
}) => {
  // Use built-in font or load custom font
  const font = useFont(require('../../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'), 14);
  const contentFont = useFont(require('../../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'), 12);

  // Load image if content type is image
  const image = useImage(content.contentType === 'image' && content.imageUri ? content.imageUri : null);

  const dimensions = useMemo(() => {
    const safeWidth = Number.isFinite(width) ? width : 0;
    const safeHeight = Number.isFinite(height) ? height : 0;
    const minDimension = Math.max(0, Math.min(safeWidth, safeHeight));
    const rawCx = circle.position.x * safeWidth;
    const rawCy = circle.position.y * safeHeight;
    const rawR = circle.radius * minDimension;
    const cx = Number.isFinite(rawCx) ? rawCx : 0;
    const cy = Number.isFinite(rawCy) ? rawCy : 0;
    const r = Number.isFinite(rawR) ? Math.max(0, rawR) : 0;

    // Label badge dimensions
    const badgeWidth = Math.max(0, r * 1.4);
    const badgeHeight = Math.max(0, r * 0.45);
    const badgeY = circle.labelPosition === 'bottom'
      ? cy + r - badgeHeight * 0.3
      : cy - r - badgeHeight * 0.7;
    const badgeX = cx - badgeWidth / 2;

    const rawBadgeRadius = badgeHeight / 2;
    const badgeRadius = Math.max(0, Math.min(rawBadgeRadius, badgeWidth / 2, badgeHeight / 2));

    return {
      cx,
      cy,
      r,
      badgeX,
      badgeY,
      badgeWidth,
      badgeHeight,
      badgeRadius,
    };
  }, [circle, width, height]);

  const clipPath = useMemo(() => {
    const path = Skia.Path.Make();
    const clipRadius = Math.max(0, dimensions.r - strokeWidth);
    if (clipRadius > 0) {
      path.addCircle(dimensions.cx, dimensions.cy, clipRadius);
    }
    return path;
  }, [dimensions, strokeWidth]);

  // Calculate label text position
  const labelTextX = useMemo(() => {
    if (!font || !content.label) return dimensions.cx;
    const textWidth = font.measureText(content.label).width;
    return dimensions.cx - textWidth / 2;
  }, [font, content.label, dimensions.cx]);

  const labelTextY = useMemo(() => {
    return dimensions.badgeY + dimensions.badgeHeight * 0.7;
  }, [dimensions]);

  // Calculate content text position (centered in circle)
  const contentTextX = useMemo(() => {
    if (!contentFont || !content.text) return dimensions.cx;
    const textWidth = contentFont.measureText(content.text).width;
    return dimensions.cx - textWidth / 2;
  }, [contentFont, content.text, dimensions.cx]);

  return (
    <Group>
      {/* Selection highlight */}
      {isSelected && (
        <Circle
          cx={dimensions.cx}
          cy={dimensions.cy}
          r={dimensions.r + strokeWidth * 2}
          color="rgba(255, 255, 255, 0.3)"
          style="stroke"
          strokeWidth={strokeWidth}
        />
      )}

      {/* Circle outline */}
      <Circle
        cx={dimensions.cx}
        cy={dimensions.cy}
        r={dimensions.r}
        color={strokeColor}
        style="stroke"
        strokeWidth={strokeWidth}
      />

      {/* Image content (clipped to circle) */}
      {content.contentType === 'image' && image && dimensions.r > 0 && (
        <Group clip={clipPath} invertClip={false}>
          <Image
            image={image}
            x={dimensions.cx - dimensions.r}
            y={dimensions.cy - dimensions.r}
            width={dimensions.r * 2}
            height={dimensions.r * 2}
            fit="cover"
          />
        </Group>
      )}

      {/* Text content */}
      {content.contentType === 'text' && content.text && contentFont && (
        <Text
          x={contentTextX}
          y={dimensions.cy + 5}
          text={content.text}
          font={contentFont}
          color={content.textStyle?.color || '#FFFFFF'}
        />
      )}

      {/* Label badge background */}
      {dimensions.badgeWidth > 0 && dimensions.badgeHeight > 0 && (
        <RoundedRect
          x={dimensions.badgeX}
          y={dimensions.badgeY}
          width={dimensions.badgeWidth}
          height={dimensions.badgeHeight}
          r={dimensions.badgeRadius}
          color={ROADMAP_DEFAULTS.labelBadgeColor}
        />
      )}

      {/* Label text */}
      {font && content.label && (
        <Text
          x={labelTextX}
          y={labelTextY}
          text={content.label}
          font={font}
          color={ROADMAP_DEFAULTS.labelTextColor}
        />
      )}
    </Group>
  );
};

export default RoadmapCircle;
