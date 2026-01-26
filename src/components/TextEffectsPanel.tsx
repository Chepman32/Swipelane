import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  TEXT_EFFECT_CATEGORIES,
  TEXT_EFFECT_DEFINITIONS,
  TextEffectCategory,
  TextEffectInstance,
  TextEffectType,
  isTextEffectSupported,
} from '../constants/textEffects';
import { getEffectDisplayName } from '../textfx/registry';
import { useResponsive } from '../hooks/useResponsive';
import { useLanguage } from '../context/LanguageContext';

// Map category IDs to translation keys
const CATEGORY_TRANSLATION_MAP: Record<string, string> = {
  'fill': 'effect_category_fill',
  'stroke': 'effect_category_stroke',
  'glow': 'effect_category_glow',
  'texture': 'effect_category_texture',
  'masking': 'effect_category_masking',
  'distortion': 'effect_category_distortion',
  'compositing': 'effect_category_compositing',
  'special': 'effect_category_special',
};

// Map effect types to translation keys
const EFFECT_TRANSLATION_MAP: Record<string, string> = {
  'neonGlow': 'effect_neon_glow',
  'softShadow': 'effect_soft_shadow',
  'longShadow': 'effect_long_shadow',
  'bloom': 'effect_bloom',
  'glassmorphism': 'effect_glassmorphism',
  'gradientStroke': 'effect_gradient_stroke',
  'multiStroke': 'effect_multi_stroke',
  'dashedStroke': 'effect_dashed_stroke',
  'animatedGradient': 'effect_animated_gradient',
  'textureFill': 'effect_texture_fill',
  'proceduralShader': 'effect_procedural_shader',
  'knockout': 'effect_knockout',
  'blendMode': 'effect_blend_mode',
  'mediaMask': 'effect_media_mask',
  'clipPath': 'effect_clip_path',
  'progressFill': 'effect_progress_fill',
  'waveDistortion': 'effect_wave_distortion',
  'chromaticAberration': 'effect_chromatic_aberration',
  'glitch': 'effect_glitch',
  'crtVhs': 'effect_crt_vhs',
  'fisheye': 'effect_fisheye',
  'specularHighlight': 'effect_specular_highlight',
  'volumetricLight': 'effect_volumetric_light',
  'cmykMisprint': 'effect_cmyk_misprint',
  'letterpress': 'effect_letterpress',
  'textureOverlay': 'effect_texture_overlay',
  'chalkMarker': 'effect_chalk_marker',
  'shineSweep': 'effect_shine_sweep',
  'particles': 'effect_particles',
  'glossy3d': 'effect_glossy_3d',
  'chrome3d': 'effect_chrome_3d',
};

interface TextEffectsPanelProps {
  activeCategory: TextEffectCategory;
  onSelectCategory: (category: TextEffectCategory) => void;
  onAddEffect: (effectType: TextEffectType) => void;
  onToggleEffect: (instanceId: string) => void;
  onRemoveEffect: (instanceId: string) => void;
  currentEffects: TextEffectInstance[];
  onEditEffect: (instanceId: string) => void;
  selectedEffectId: string | null;
}

const TextEffectsPanel: React.FC<TextEffectsPanelProps> = ({
  activeCategory,
  onSelectCategory,
  onAddEffect,
  onToggleEffect,
  onRemoveEffect,
  currentEffects,
  onEditEffect,
  selectedEffectId,
}) => {
  const { scale, scaleFont, maxPanelHeight, smallButtonSize } = useResponsive();
  const { t } = useLanguage();

  const availableEffects = useMemo(
    () =>
      Object.values(TEXT_EFFECT_DEFINITIONS)
        .filter(
          definition =>
            definition.category === activeCategory &&
            isTextEffectSupported(definition.id),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeCategory],
  );
  const sortedCategories = useMemo(
    () => [...TEXT_EFFECT_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  return (
    <View style={[styles.panelContainer, { maxHeight: maxPanelHeight }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.panelTitle, { fontSize: scaleFont(16) }]}>{t('text_effects_title')}</Text>
        <Text style={[styles.panelSubtitle, { fontSize: scaleFont(12) }]}>
          {t('text_effects_subtitle')}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContainer}
        style={[styles.categoryTabs, { maxHeight: scale(44) }]}
      >
        {sortedCategories.map(category => {
          const isActive = category.id === activeCategory;
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
              onPress={() => onSelectCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryTabLabel,
                  isActive && styles.activeCategoryTabLabel,
                ]}
              >
                {CATEGORY_TRANSLATION_MAP[category.id] ? t(CATEGORY_TRANSLATION_MAP[category.id]) : category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.activeEffectsContainer}>
        <Text style={styles.sectionTitle}>{t('text_effects_active')}</Text>
        {currentEffects.length === 0 ? (
          <Text style={styles.emptyStateText}>{t('text_effects_no_effects')}</Text>
        ) : (
          currentEffects.map(effect => {
            const definition = TEXT_EFFECT_DEFINITIONS[effect.type];
            const isSelected = effect.instanceId === selectedEffectId;
            return (
              <View
                key={effect.instanceId}
                style={[
                  styles.activeEffectRow,
                  isSelected && styles.activeEffectRowSelected,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { width: scale(54), height: smallButtonSize },
                    effect.enabled && styles.toggleButtonEnabled,
                  ]}
                  onPress={() => onToggleEffect(effect.instanceId)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      { fontSize: scaleFont(11) },
                      effect.enabled && styles.toggleButtonTextEnabled,
                    ]}
                  >
                    {effect.enabled ? t('effect_toggle_on') : t('effect_toggle_off')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.activeEffectDetailsWrapper,
                    isSelected && styles.activeEffectDetailsWrapperSelected,
                  ]}
                  onPress={() => onEditEffect(effect.instanceId)}
                >
                  <View style={styles.activeEffectDetails}>
                    <Text style={[styles.activeEffectName, { fontSize: scaleFont(13) }]}>
                      {EFFECT_TRANSLATION_MAP[effect.type] ? t(EFFECT_TRANSLATION_MAP[effect.type]) : (definition?.name ?? getEffectDisplayName(effect.type))}
                    </Text>
                    {definition?.description ? (
                      <Text
                        style={[styles.activeEffectDescription, { fontSize: scaleFont(11) }]}
                        numberOfLines={2}
                      >
                        {definition.description}
                      </Text>
                    ) : null}
                    {isSelected ? (
                      <Text style={[styles.activeEffectSelectedBadge, { fontSize: scaleFont(10) }]}>
                        {t('text_effects_editing')}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.removeButton, { width: smallButtonSize, height: smallButtonSize, borderRadius: smallButtonSize / 2 }]}
                  onPress={() => onRemoveEffect(effect.instanceId)}
                >
                  <Text style={[styles.removeButtonText, { fontSize: scaleFont(18) }]}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <ScrollView
        style={styles.effectsList}
        contentContainerStyle={styles.effectsListContent}
        showsVerticalScrollIndicator={false}
      >
        {availableEffects.length === 0 ? (
          <Text style={styles.emptyStateText}>
            {t('text_effects_coming_soon')}
          </Text>
        ) : (
          availableEffects.map(definition => (
            <TouchableOpacity
              key={definition.id}
              style={styles.effectCard}
              onPress={() => onAddEffect(definition.id)}
            >
              <View style={styles.effectCardHeader}>
                <Text style={styles.effectName}>{EFFECT_TRANSLATION_MAP[definition.id] ? t(EFFECT_TRANSLATION_MAP[definition.id]) : definition.name}</Text>
                {definition.supportsAnimation ? (
                  <Text style={styles.pill}>{t('effect_animated')}</Text>
                ) : null}
              </View>
              <Text style={styles.effectDescription} numberOfLines={3}>
                {definition.description}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    maxHeight: 360,
    width: '95%',
    alignSelf: 'center',
  },
  headerRow: {
    gap: 4,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  panelSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  categoryTabs: {
    maxHeight: 44,
  },
  categoryTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeCategoryTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  categoryTabLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  activeCategoryTabLabel: {
    color: '#FFFFFF',
  },
  activeEffectsContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  activeEffectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 6,
  },
  activeEffectRowSelected: {
    backgroundColor: 'rgba(0,255,204,0.12)',
  },
  toggleButton: {
    width: 54,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonEnabled: {
    backgroundColor: 'rgba(0,255,204,0.2)',
    borderColor: 'rgba(0,255,204,0.8)',
  },
  toggleButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonTextEnabled: {
    color: '#00FFCC',
  },
  activeEffectDetails: {
    flex: 1,
    gap: 2,
  },
  activeEffectDetailsWrapper: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  activeEffectDetailsWrapperSelected: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  activeEffectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeEffectDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: -2,
  },
  activeEffectSelectedBadge: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#00FFCC',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  effectsList: {
    flexGrow: 0,
  },
  effectsListContent: {
    gap: 12,
    paddingBottom: 40,
  },
  effectCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  effectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  effectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  effectDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  pill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00FFCC',
    backgroundColor: 'rgba(0,255,204,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});

export default TextEffectsPanel;
