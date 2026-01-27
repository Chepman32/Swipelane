/**
 * Skia-based Slide Renderer Component
 * Provides advanced graphics rendering for slides using React Native Skia
 */

import React from 'react';
import { View, Text, Platform, Dimensions } from 'react-native';
import GraphicsService from '../services/GraphicsService';
import TextEffectsEngine from '../services/TextEffectsEngine';
import type { SlideFontId } from '../constants/fonts';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';
import type { TextEffectInstance } from '../constants/textEffects';
import { buildPreviewEffects } from '../utils/textEffectsPreview';
import { isTextEffectSupported } from '../constants/textEffects';
import type { SlideBackgroundGradient } from '../services/StorageService';

interface SkiaSlideRendererProps {
  slide: {
    id: number;
    text: string;
    image?: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    backgroundColor: string;
    textAlign: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
    fontFamily?: string;
    fontId?: SlideFontId;
    textEffects?: TextEffectInstance[];
    backgroundGradient?: SlideBackgroundGradient | null;
  };
  width?: number;
  height?: number;
  styleName?: string;
}

const SkiaSlideRenderer: React.FC<SkiaSlideRendererProps> = ({
  slide,
  width = 350,
  height = 600,
  styleName = 'modern',
}) => {
  const graphicsService = GraphicsService.getInstance();
  const textEffectsEngine = TextEffectsEngine.getInstance();
  const { width: screenWidth } = Dimensions.get('window');
  const slideWidth = Math.min(screenWidth - 40, width);
  const slideHeight = height;
  const platformKey =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
      ? 'android'
      : 'default';
  const legacyFontId =
    slide.fontId === LEGACY_SYSTEM_FONT_ID
      ? DEFAULT_SLIDE_FONT_ID
      : slide.fontId;
  const fontOption = legacyFontId
    ? getSlideFontById(legacyFontId)
    : getSlideFontByFamily(slide.fontFamily);
  const resolvedFontFamily = resolveFontFamilyForPlatform(
    fontOption,
    platformKey,
  );
  const slideEffects = (slide.textEffects ?? []).filter(effect =>
    isTextEffectSupported(effect.type),
  );
  const preparedEffectLayers = textEffectsEngine.prepareLayers(slideEffects);
  const previewEffects = buildPreviewEffects(slideEffects, {
    text: slide.text,
    fontSize: slide.fontSize,
    textColor: slide.color,
    fontFamily: resolvedFontFamily,
    fontWeight: slide.fontWeight,
  });

  // For now, render a simple fallback until Skia is properly configured
  return (
    <View
      style={{
        width: slideWidth,
        height: slideHeight,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          paddingHorizontal: Math.max(12, slide.fontSize * 0.55),
          paddingVertical: Math.max(16, slide.fontSize * 0.65),
          borderRadius: Math.min(Math.max(12, slide.fontSize * 0.6), 30),
          backgroundColor: slide.backgroundColor,
          shadowColor: previewEffects.overlayStyle.shadowColor,
          shadowOffset: previewEffects.overlayStyle.shadowOffset,
          shadowOpacity: previewEffects.overlayStyle.shadowOpacity,
          shadowRadius: previewEffects.overlayStyle.shadowRadius,
          elevation: previewEffects.overlayStyle.elevation,
          position: 'relative',
        }}
      >
        {preparedEffectLayers.length > 0
          ? previewEffects.underlayElements
          : null}
        <Text
          style={{
            fontSize: slide.fontSize,
            color: previewEffects.textStyle.color ?? slide.color,
            textAlign: slide.textAlign,
            fontWeight: resolvedFontFamily ? undefined : slide.fontWeight,
            fontFamily: resolvedFontFamily,
            textShadowColor: previewEffects.textStyle.textShadowColor,
            textShadowOffset: previewEffects.textStyle.textShadowOffset,
            textShadowRadius: previewEffects.textStyle.textShadowRadius,
          }}
        >
          {slide.text}
        </Text>
        {preparedEffectLayers.length > 0
          ? previewEffects.overlayElements
          : null}
      </View>
      {preparedEffectLayers.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.4)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>
            Effects Pending
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default SkiaSlideRenderer;
