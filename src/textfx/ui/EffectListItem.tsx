import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getEffectDisplayName } from '../registry';
import { useLanguage } from '../../context/LanguageContext';
import type { EffectInstance } from '../types';

// Map effect IDs to translation keys
const EFFECT_TRANSLATION_MAP: Record<string, string> = {
  'neon': 'effect_neon_glow',
  'soft-shadow': 'effect_soft_shadow',
  'long-shadow': 'effect_long_shadow',
  'bloom': 'effect_bloom',
  'glassmorphism': 'effect_glassmorphism',
  'gradient-stroke': 'effect_gradient_stroke',
  'multi-stroke': 'effect_multi_stroke',
  'dashed-stroke': 'effect_dashed_stroke',
  'animated-gradient': 'effect_animated_gradient',
  'texture-fill': 'effect_texture_fill',
  'procedural-shader': 'effect_procedural_shader',
  'knockout': 'effect_knockout',
  'blend-mode': 'effect_blend_mode',
  'media-mask': 'effect_media_mask',
  'clip-path': 'effect_clip_path',
  'progress-fill': 'effect_progress_fill',
  'wave-distortion': 'effect_wave_distortion',
  'chromatic-aberration': 'effect_chromatic_aberration',
  'glitch': 'effect_glitch',
  'crt-vhs': 'effect_crt_vhs',
  'fisheye': 'effect_fisheye',
  'specular-highlight': 'effect_specular_highlight',
  'volumetric-light': 'effect_volumetric_light',
  'cmyk-misprint': 'effect_cmyk_misprint',
  'letterpress': 'effect_letterpress',
  'texture-overlay': 'effect_texture_overlay',
  'chalk-marker': 'effect_chalk_marker',
  'shine-sweep': 'effect_shine_sweep',
  'particles': 'effect_particles',
  'glossy-3d': 'effect_glossy_3d',
  'chrome-3d': 'effect_chrome_3d',
};

interface EffectListItemProps {
  effect: EffectInstance;
  isSelected?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export const EffectListItem: React.FC<EffectListItemProps> = ({
  effect,
  isSelected = false,
  onToggle,
  onEdit,
  onRemove,
}) => {
  const { t } = useLanguage();
  const translationKey = EFFECT_TRANSLATION_MAP[effect.id];
  const displayName = translationKey ? t(translationKey) : getEffectDisplayName(effect.id);

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          effect.enabled && styles.toggleButtonEnabled,
        ]}
        onPress={onToggle}
      >
        <Text
          style={[
            styles.toggleText,
            effect.enabled && styles.toggleTextEnabled,
          ]}
        >
          {effect.enabled ? t('effect_toggle_on') : t('effect_toggle_off')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.content} onPress={onEdit}>
        <Text style={styles.name}>{displayName}</Text>
        {isSelected && <Text style={styles.editingBadge}>{t('text_effects_editing')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  containerSelected: {
    backgroundColor: 'rgba(0,255,204,0.12)',
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonEnabled: {
    backgroundColor: 'rgba(0,255,204,0.2)',
    borderColor: 'rgba(0,255,204,0.8)',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  toggleTextEnabled: {
    color: '#00FFCC',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editingBadge: {
    color: '#00FFCC',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
