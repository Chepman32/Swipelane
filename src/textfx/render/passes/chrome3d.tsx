import React from 'react';
import {
  Group,
  Text as SkText,
  LinearGradient,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';

interface Chrome3DPassProps {
  text: string;
  x: number;
  baselineY: number;
  font: SkFont;
  metallicLight: string;
  metallicMid: string;
  metallicDark: string;
  extrusionDepth: number;
  extrusionColor: string;
  outerStrokeColor: string;
  outerStrokeWidth: number;
  innerStrokeColor: string;
  innerStrokeWidth: number;
  shineIntensity: number;
  shineAngle: number;
}

export const Chrome3DPass: React.FC<Chrome3DPassProps> = ({
  text,
  x,
  baselineY,
  font,
  metallicLight,
  metallicMid,
  metallicDark,
  extrusionDepth,
  extrusionColor,
  outerStrokeColor,
  outerStrokeWidth,
  innerStrokeColor,
  innerStrokeWidth,
  shineIntensity,
  shineAngle,
}) => {
  // Calculate text height from font size for gradient positioning
  const fontSize = (font as any)?.getSize?.() ?? 24;
  const textHeight = fontSize;
  const topY = baselineY - textHeight;

  // 3D extrusion: diagonal down-left (225 degrees)
  const extrusionAngle = 225;
  const angleRad = (extrusionAngle * Math.PI) / 180;
  const extrusionSteps = Math.max(6, Math.round(extrusionDepth));
  const stepX = (Math.cos(angleRad) * extrusionDepth) / extrusionSteps;
  const stepY = (Math.sin(angleRad) * extrusionDepth) / extrusionSteps;

  // Shine angle calculation for diagonal highlight
  const shineAngleRad = (shineAngle * Math.PI) / 180;
  const shineOffsetX = Math.cos(shineAngleRad) * textHeight;

  return (
    <Group>
      {/* Layer 1: 3D Extrusion - Solid stacked layers going diagonally */}
      {Array.from({ length: extrusionSteps }).map((_, index) => {
        const offsetX = stepX * (extrusionSteps - index);
        const offsetY = stepY * (extrusionSteps - index);

        return (
          <Group key={`extrusion-${index}`}>
            {/* Extrusion stroke */}
            <SkText
              text={text}
              x={x + offsetX}
              y={baselineY + offsetY}
              font={font}
              color={extrusionColor}
              style="stroke"
              strokeWidth={outerStrokeWidth}
              strokeJoin="round"
              strokeCap="round"
            />
            {/* Extrusion fill */}
            <SkText
              text={text}
              x={x + offsetX}
              y={baselineY + offsetY}
              font={font}
              color={extrusionColor}
            />
          </Group>
        );
      })}

      {/* Layer 2: Outer Stroke - Dark gray for edge definition */}
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

      {/* Layer 3: Inner Stroke - Light gray for bevel effect */}
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

      {/* Layer 4: Metallic Gradient Fill - 3-stop chrome gradient */}
      <SkText text={text} x={x} y={baselineY} font={font}>
        <LinearGradient
          start={vec(x, topY)}
          end={vec(x, baselineY)}
          colors={[metallicLight, metallicMid, metallicDark]}
        />
      </SkText>

      {/* Layer 5: Diagonal Shine - Reflective highlight streak */}
      <SkText text={text} x={x} y={baselineY} font={font} opacity={shineIntensity}>
        <LinearGradient
          start={vec(x + shineOffsetX, topY)}
          end={vec(x - shineOffsetX, baselineY)}
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.8)',
            'rgba(255,255,255,0)',
          ]}
        />
      </SkText>
    </Group>
  );
};
