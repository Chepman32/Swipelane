import React from 'react';
import {
  Group,
  Text as SkText,
  BlurMask,
  LinearGradient,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';

interface Glossy3DPassProps {
  text: string;
  x: number;
  baselineY: number;
  font: SkFont;
  fillColorTop: string;
  fillColorBottom: string;
  outerStrokeColor: string;
  outerStrokeWidth: number;
  innerStrokeColor: string;
  innerStrokeWidth: number;
  highlightIntensity: number;
  highlightHeight: number;
  shadowColor: string;
  shadowOffsetY: number;
  shadowBlur: number;
}

export const Glossy3DPass: React.FC<Glossy3DPassProps> = ({
  text,
  x,
  baselineY,
  font,
  fillColorTop,
  fillColorBottom,
  outerStrokeColor,
  outerStrokeWidth,
  innerStrokeColor,
  innerStrokeWidth,
  highlightIntensity,
  highlightHeight,
  shadowColor,
  shadowOffsetY,
  shadowBlur,
}) => {
  // Calculate text height from font size for gradient positioning
  const fontSize = (font as any)?.getSize?.() ?? 24;
  const textHeight = fontSize;

  // Calculate highlight region (top portion of text)
  const highlightTopY = baselineY - textHeight;
  const highlightBottomY = baselineY - textHeight * (1 - highlightHeight);

  return (
    <Group>
      {/* Layer 1: Shadow - Blurred text offset downward */}
      <Group>
        <BlurMask blur={shadowBlur} style="outer" />
        <SkText
          text={text}
          x={x}
          y={baselineY + shadowOffsetY}
          font={font}
          color={shadowColor}
        />
      </Group>

      {/* Layer 2: Outer Stroke - Black stroke for depth */}
      <SkText
        text={text}
        x={x}
        y={baselineY}
        font={font}
        color={outerStrokeColor}
        style="stroke"
        strokeWidth={outerStrokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />

      {/* Layer 3: Inner Stroke - White stroke for separation */}
      <SkText
        text={text}
        x={x}
        y={baselineY}
        font={font}
        color={innerStrokeColor}
        style="stroke"
        strokeWidth={innerStrokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />

      {/* Layer 4: Gradient Fill - Pink to magenta vertical gradient */}
      <SkText text={text} x={x} y={baselineY} font={font}>
        <LinearGradient
          start={vec(x, highlightTopY)}
          end={vec(x, baselineY)}
          colors={[fillColorTop, fillColorBottom]}
        />
      </SkText>

      {/* Layer 5: Highlight - White gradient at top for glossy effect */}
      <SkText text={text} x={x} y={baselineY} font={font} opacity={highlightIntensity}>
        <LinearGradient
          start={vec(x, highlightTopY)}
          end={vec(x, highlightBottomY)}
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
        />
      </SkText>
    </Group>
  );
};
