import React from 'react';
import { Text, ViewStyle, TextStyle } from 'react-native';
import type { TextEffectInstance } from '../constants/textEffects';
import { isTextEffectSupported } from '../constants/textEffects';

export interface PreviewEffectsResult {
  overlayStyle: ViewStyle;
  textStyle: TextStyle;
  underlayElements: React.ReactNode[];
  overlayElements: React.ReactNode[];
}

const degToRad = (deg: number) => (deg * Math.PI) / 180;

export const buildPreviewEffects = (
  effects: TextEffectInstance[] = [],
  options: {
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily?: string;
    fontWeight?: TextStyle['fontWeight'];
  },
): PreviewEffectsResult => {
  const overlayStyle: ViewStyle = {};
  const textStyle: TextStyle = {};
  const underlayElements: React.ReactNode[] = [];
  const overlayElements: React.ReactNode[] = [];

  const enabledEffects = effects.filter(
    effect => effect.enabled !== false && isTextEffectSupported(effect.type),
  );

  enabledEffects.forEach(effect => {
    const params = effect.parameters || {};
    switch (effect.type) {
      case 'softShadow': {
        const color =
          typeof params.shadowColor === 'string'
            ? params.shadowColor
            : 'rgba(0,0,0,0.6)';
        const offset = params.offset || { x: 8, y: 12 };
        const blur = typeof params.blur === 'number' ? params.blur : 18;

        // Apply shadow effects only to text, not to the container
        textStyle.textShadowColor = color;
        textStyle.textShadowOffset = { width: offset.x, height: offset.y };
        textStyle.textShadowRadius = Math.max(blur, 12);
        textStyle.opacity = Math.min(1, (textStyle.opacity ?? 1) + 0.05);

        // Create shadow underlay element that matches text size
        underlayElements.push(
          <Text
            key={`${effect.instanceId}-softShadow`}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              color,
              opacity: 0.75,
              fontSize: options.fontSize,
              fontFamily: options.fontFamily,
              fontWeight: options.fontWeight,
              textShadowColor: color,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: Math.max(blur, 12),
            }}
          >
            {options.text}
          </Text>,
        );
        break;
      }
      case 'neonGlow': {
        const glowColor =
          typeof params.glowColor === 'string' ? params.glowColor : '#00FFFF';
        const intensity =
          typeof params.intensity === 'number' ? params.intensity : 0.8;
        const spread = typeof params.spread === 'number' ? params.spread : 12;

        // Create a single strong glow effect using text shadow
        // textStyle.color = '#FFFFFF'; // Keep core text white - Removed to respect user color
        textStyle.textShadowColor = glowColor;
        textStyle.textShadowOffset = { width: 0, height: 0 };
        textStyle.textShadowRadius = Math.max(8, spread);

        // Create glow underlays with transparent text and only shadows
        for (let i = 0; i < 2; i++) {
          const shadowRadius = Math.max(4, spread * (2 - i * 0.5));
          const shadowOpacity = intensity * (0.8 - i * 0.3);

          underlayElements.push(
            <Text
              key={`${effect.instanceId}-neonGlow-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: 'transparent', // Make text transparent so only shadow shows
                fontSize: options.fontSize,
                fontFamily: options.fontFamily,
                fontWeight: options.fontWeight,
                textShadowColor: glowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: shadowRadius,
                opacity: shadowOpacity,
              }}
            >
              {options.text}
            </Text>,
          );
        }
        break;
      }
      case 'longShadow': {
        const length = Math.max(4, Math.min(120, Number(params.length) || 24));
        const angle = degToRad(
          typeof params.angle === 'number' ? params.angle : 135,
        );
        const fade = typeof params.fade === 'number' ? params.fade : 0.6;
        const shadowColor =
          typeof params.shadowColor === 'string'
            ? params.shadowColor
            : 'rgba(0,0,0,0.7)';
        const steps = Math.min(25, Math.max(6, Math.round(length / 4)));
        const stepX = (Math.cos(angle) * length) / steps;
        const stepY = (Math.sin(angle) * length) / steps;
        const baseOpacity = 0.7;
        const layers = Array.from({ length: steps }).map((_, index) => {
          const opacity = baseOpacity * Math.pow(1 - fade, index);
          const translateX = stepX * (index + 1);
          const translateY = stepY * (index + 1);
          const style: TextStyle = {
            position: 'absolute',
            left: translateX,
            top: translateY,
            color: shadowColor,
            opacity,
            fontSize: options.fontSize,
            fontFamily: options.fontFamily,
            fontWeight: options.fontWeight,
          };
          return (
            <Text key={`${effect.instanceId}-long-${index}`} style={style}>
              {options.text}
            </Text>
          );
        });
        underlayElements.push(...layers);
        break;
      }
      case 'bloom': {
        const radius = typeof params.radius === 'number' ? params.radius : 16;
        const intensity =
          typeof params.intensity === 'number' ? params.intensity : 0.75;

        // Enhanced bloom effect with multiple colorful layers
        const bloomColors = ['#FF6B35', '#F7931E', '#FF1493', '#00BFFF'];

        // Main text gets white color with glow
        // textStyle.color = '#FFFFFF'; // Removed to respect user color
        textStyle.textShadowColor = '#FFFFFF';
        textStyle.textShadowOffset = { width: 0, height: 0 };
        textStyle.textShadowRadius = Math.max(4, radius * 0.3);
        textStyle.opacity = 1;

        // Create multiple bloom layers with different colors
        bloomColors.forEach((color, index) => {
          const layerRadius = radius * (2 - index * 0.3);
          const layerOpacity = (intensity * 0.4) / (index + 1);

          underlayElements.push(
            <Text
              key={`${effect.instanceId}-bloom-${index}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: 'transparent',
                fontSize: options.fontSize,
                fontFamily: options.fontFamily,
                fontWeight: options.fontWeight,
                textShadowColor: color,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: layerRadius,
                opacity: layerOpacity,
              }}
            >
              {options.text}
            </Text>,
          );
        });
        break;
      }
      case 'glassmorphism': {
        const borderColor =
          typeof params.borderColor === 'string'
            ? params.borderColor
            : 'rgba(255,255,255,0.4)';
        const borderWidth =
          typeof params.borderWidth === 'number' ? params.borderWidth : 1;
        overlayStyle.backgroundColor = 'rgba(255,255,255,0.18)';
        overlayStyle.borderWidth = borderWidth;
        overlayStyle.borderColor = borderColor;
        overlayStyle.overflow = 'hidden';
        break;
      }
      case 'letterpress': {
        const depth = typeof params.depth === 'number' ? params.depth : 4;
        const highlight =
          typeof params.highlight === 'number' ? params.highlight : 0.4;
        textStyle.textShadowColor = 'rgba(0,0,0,0.35)';
        textStyle.textShadowOffset = { width: -depth / 3, height: depth / 3 };
        textStyle.textShadowRadius = depth * 1.2;
        textStyle.color = options.textColor;
        overlayStyle.borderWidth = (overlayStyle.borderWidth ?? 0) + 0.5;
        overlayStyle.borderColor = 'rgba(255,255,255,0.1)';
        overlayStyle.backgroundColor = 'rgba(255,255,255,0.05)';
        overlayElements.push(
          <Text
            key={`${effect.instanceId}-highlight`}
            style={{
              position: 'absolute',
              color: 'rgba(255,255,255,' + highlight + ')',
              left: 1,
              top: 1,
              fontSize: options.fontSize,
              opacity: 0.4,
              fontFamily: options.fontFamily,
              fontWeight: options.fontWeight,
            }}
          >
            {options.text}
          </Text>,
        );
        break;
      }
      case 'shineSweep': {
        const shineColor =
          typeof params.shineColor === 'string'
            ? params.shineColor
            : 'rgba(255,255,255,0.8)';
        overlayElements.push(
          <Text
            key={`${effect.instanceId}-shine`}
            style={{
              position: 'absolute',
              top: -options.fontSize * 0.2,
              left: -options.fontSize * 0.5,
              fontSize: options.fontSize * 1.8,
              color: shineColor,
              opacity: 0.15,
              fontFamily: options.fontFamily,
              fontWeight: options.fontWeight,
            }}
          >
            / / / / /
          </Text>,
        );
        break;
      }
      default:
        break;
    }
  });

  return {
    overlayStyle,
    textStyle,
    underlayElements,
    overlayElements,
  };
};
