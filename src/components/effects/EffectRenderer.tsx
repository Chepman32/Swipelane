import React from 'react';
import { Image as SkiaImage, type SkImage } from '@shopify/react-native-skia';
import type { EffectDefinition } from '../../domain/effects/registry';

interface EffectRendererProps {
  image: SkImage;
  effect: EffectDefinition | null;
  params?: Record<string, any> | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const EffectRenderer: React.FC<EffectRendererProps> = ({
  image,
  x,
  y,
  width,
  height,
}) => {
  return (
    <SkiaImage image={image} x={x} y={y} width={width} height={height} />
  );
};

export default EffectRenderer;
