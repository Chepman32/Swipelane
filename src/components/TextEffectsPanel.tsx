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
        <Text style={[styles.panelTitle, { fontSize: scaleFont(16) }]}>Text Effects</Text>
        <Text style={[styles.panelSubtitle, { fontSize: scaleFont(12) }]}>
          Stack multiple looks for each slide
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
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.activeEffectsContainer}>
        <Text style={styles.sectionTitle}>Active</Text>
        {currentEffects.length === 0 ? (
          <Text style={styles.emptyStateText}>No effects applied yet</Text>
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
                    {effect.enabled ? 'On' : 'Off'}
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
                      {definition?.name ?? getEffectDisplayName(effect.type)}
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
                        Editing
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
            Effects coming soon for this category
          </Text>
        ) : (
          availableEffects.map(definition => (
            <TouchableOpacity
              key={definition.id}
              style={styles.effectCard}
              onPress={() => onAddEffect(definition.id)}
            >
              <View style={styles.effectCardHeader}>
                <Text style={styles.effectName}>{definition.name}</Text>
                {definition.supportsAnimation ? (
                  <Text style={styles.pill}>Animated</Text>
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
