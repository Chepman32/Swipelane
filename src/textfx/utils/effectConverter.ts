import type { TextEffectInstance } from '../../constants/textEffects';
import type { EffectInstance } from '../types';

/**
 * Convert old TextEffectInstance to new EffectInstance format
 */
export function convertToNewFormat(
  oldEffect: TextEffectInstance,
  textColor?: string,
): EffectInstance | null {
  // Map old effect types to new effect IDs
  const typeMapping: Record<string, string> = {
    neonGlow: 'neon',
    softShadow: 'softShadow',
    longShadow: 'longShadow',
    bloom: 'bloomHalo',
    letterpress: 'letterpress',
  };

  const newId = typeMapping[oldEffect.type];
  if (!newId) {
    return null; // Unsupported effect type
  }

  // Convert parameters based on effect type
  let values: Record<string, any> = {};

  switch (oldEffect.type) {
    case 'neonGlow':
      const defaultGlowColor = textColor || '#00FFFF';
      values = {
        innerColor: '#FFFFFF',
        glowColor: oldEffect.parameters?.glowColor || defaultGlowColor,
        glowRadius: oldEffect.parameters?.spread || 12,
        strokeWidth: 2,
        strokeColor: oldEffect.parameters?.glowColor || defaultGlowColor,
      };
      break;
    case 'softShadow':
      values = {
        shadowColor: oldEffect.parameters?.shadowColor || 'rgba(0,0,0,0.6)',
        offsetX: oldEffect.parameters?.offset?.x || 8,
        offsetY: oldEffect.parameters?.offset?.y || 12,
        blur: oldEffect.parameters?.blur || 18,
      };
      break;
    case 'longShadow':
      values = {
        shadowColor: oldEffect.parameters?.shadowColor || 'rgba(0,0,0,0.7)',
        length: oldEffect.parameters?.length || 24,
        angle: oldEffect.parameters?.angle || 135,
        fade: oldEffect.parameters?.fade || 0.6,
      };
      break;
    case 'bloom':
      values = {
        threshold: oldEffect.parameters?.threshold || 0.6,
        radius: oldEffect.parameters?.radius || 16,
        intensity: oldEffect.parameters?.intensity || 0.75,
      };
      break;
    default:
      // Copy parameters as-is for other effects
      values = oldEffect.parameters || {};
  }

  return {
    id: newId as any,
    enabled: oldEffect.enabled,
    values,
  };
}

/**
 * Convert new EffectInstance to old TextEffectInstance format
 */
export function convertToOldFormat(
  newEffect: EffectInstance,
): TextEffectInstance | null {
  // Map new effect IDs to old effect types
  const typeMapping: Record<string, string> = {
    neon: 'neonGlow',
    softShadow: 'softShadow',
    longShadow: 'longShadow',
    bloomHalo: 'bloom',
    letterpress: 'letterpress',
  };

  const oldType = typeMapping[newEffect.id];
  if (!oldType) {
    return null; // Unsupported effect type
  }

  // Convert parameters based on effect type
  let parameters: Record<string, any> = {};

  switch (newEffect.id) {
    case 'neon':
      parameters = {
        glowColor: newEffect.values.glowColor,
        intensity: 0.8, // Default intensity
        spread: newEffect.values.glowRadius,
        pulse: false, // Static version
      };
      break;
    case 'softShadow':
      parameters = {
        shadowColor: newEffect.values.shadowColor,
        offset: {
          x: newEffect.values.offsetX,
          y: newEffect.values.offsetY,
        },
        blur: newEffect.values.blur,
      };
      break;
    default:
      // Copy values as-is for other effects
      parameters = newEffect.values;
  }

  return {
    instanceId: `converted-${Date.now()}`,
    type: oldType as any,
    enabled: newEffect.enabled,
    parameters,
    createdAt: Date.now(),
  };
}
