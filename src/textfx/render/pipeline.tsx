import React from 'react';
import { Canvas, Group, useCanvasRef } from '@shopify/react-native-skia';
import type { EffectInstance } from '../types';
import { NeonPass } from './passes/neon';
import { SoftShadowPass } from './passes/softShadow';
import { LongShadowPass } from './passes/longShadow';
import { BloomPass } from './passes/bloom';

 const getTextWidth = (
   font: import('@shopify/react-native-skia').SkFont,
   value: string,
 ): number => {
   const measureText = (font as any)?.measureText;
   if (typeof measureText !== 'function') {
     return 0;
   }

   const measured = measureText.call(font, value);
   if (typeof measured === 'number') {
     return measured;
   }
   if (measured && typeof measured.width === 'number') {
     return measured.width;
   }
   return 0;
 };

 const wrapText = (
   font: import('@shopify/react-native-skia').SkFont,
   text: string,
   maxWidth: number,
 ): string[] => {
   if (!text) {
     return [''];
   }
   if (!maxWidth || maxWidth <= 0) {
     return text.split('\n');
   }

   const paragraphs = text.split('\n');
   const lines: string[] = [];

   for (const paragraph of paragraphs) {
     const words = paragraph.split(/\s+/).filter(Boolean);
     if (words.length === 0) {
       lines.push('');
       continue;
     }

     let currentLine = '';
     for (const word of words) {
       const candidate = currentLine ? `${currentLine} ${word}` : word;
       if (getTextWidth(font, candidate) <= maxWidth) {
         currentLine = candidate;
         continue;
       }

       if (currentLine) {
         lines.push(currentLine);
       }

       // If the single word is too wide, hard-wrap it by characters.
       if (getTextWidth(font, word) > maxWidth) {
         let chunk = '';
         for (const char of word) {
           const nextChunk = chunk + char;
           if (getTextWidth(font, nextChunk) <= maxWidth) {
             chunk = nextChunk;
           } else {
             if (chunk) {
               lines.push(chunk);
             }
             chunk = char;
           }
         }
         if (chunk) {
           currentLine = chunk;
         } else {
           currentLine = '';
         }
       } else {
         currentLine = word;
       }
     }

     if (currentLine) {
       lines.push(currentLine);
     }
   }

   return lines.length ? lines : [''];
 };

export interface TextRenderProps {
  text: string;
  x: number;
  baselineY: number;
  font: import('@shopify/react-native-skia').SkFont;
  width: number;
  height: number;
  effects: EffectInstance[];
  textColor?: string;
  background?: string;
  lineHeight?: number;
}

export const EffectPipeline = React.forwardRef<
  { snapshot: () => any },
  TextRenderProps
>(function EffectPipeline(
  {
    text,
    x,
    baselineY,
    font,
    width,
    height,
    effects,
    textColor = '#FFFFFF',
    background,
    lineHeight,
  },
  ref,
) {
  const canvasRef = useCanvasRef();

  React.useImperativeHandle(ref, () => ({
    snapshot: () => canvasRef.current?.makeImageSnapshot(),
  }));

   const effectiveLineHeight =
     typeof lineHeight === 'number' && lineHeight > 0
       ? lineHeight
       : (((font as any)?.getSize?.() as number | undefined) ?? 24) * 1.35;

   // Keep a small left/right padding budget so Skia-wrapped text matches RN Text behavior.
   const availableWidth = Math.max(0, width - x * 2);
   const lines = React.useMemo(
     () => wrapText(font, text, availableWidth),
     [font, text, availableWidth],
   );

   // Ensure the canvas is tall enough for multiple lines to avoid clipping.
   const computedHeight = Math.max(
     height,
     baselineY + (lines.length - 1) * effectiveLineHeight + effectiveLineHeight,
   );

   const canvasBackgroundColor = background ?? 'transparent';

  return (
    <Canvas
      ref={canvasRef}
      style={{ width, height: computedHeight, backgroundColor: canvasBackgroundColor }}
    >
      <Group>
        {effects.flatMap(effect => {
          if (!effect.enabled) {
            return [];
          }

          return lines.map((line, index) => {
            const lineBaselineY = baselineY + index * effectiveLineHeight;
            const key = `${effect.id}-${index}`;

            switch (effect.id) {
              case 'neon':
                return (
                  <NeonPass
                    key={key}
                    text={line}
                    x={x}
                    baselineY={lineBaselineY}
                    font={font}
                    innerColor={String(effect.values.innerColor)}
                    glowColor={String(effect.values.glowColor)}
                    glowRadius={Number(effect.values.glowRadius)}
                    strokeWidth={Number(effect.values.strokeWidth)}
                    strokeColor={String(effect.values.strokeColor)}
                  />
                );
              case 'softShadow':
                return (
                  <SoftShadowPass
                    key={key}
                    text={line}
                    x={x}
                    baselineY={lineBaselineY}
                    font={font}
                    textColor={textColor}
                    shadowColor={String(effect.values.shadowColor)}
                    offsetX={Number(effect.values.offsetX)}
                    offsetY={Number(effect.values.offsetY)}
                    blur={Number(effect.values.blur)}
                  />
                );
              case 'longShadow':
                return (
                  <LongShadowPass
                    key={key}
                    text={line}
                    x={x}
                    baselineY={lineBaselineY}
                    font={font}
                    textColor={textColor}
                    shadowColor={String(effect.values.shadowColor)}
                    length={Number(effect.values.length)}
                    angle={Number(effect.values.angle)}
                    fade={Number(effect.values.fade)}
                  />
                );
              case 'bloomHalo':
                return (
                  <BloomPass
                    key={key}
                    text={line}
                    x={x}
                    baselineY={lineBaselineY}
                    font={font}
                    textColor={textColor}
                    threshold={Number(effect.values.threshold)}
                    radius={Number(effect.values.radius)}
                    intensity={Number(effect.values.intensity)}
                  />
                );
              default:
                return null;
            }
          });
        })}
      </Group>
    </Canvas>
  );
});
