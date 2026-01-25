import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Create animated FlatList component
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import FeedbackService from '../services/FeedbackService';
import ExportService from '../services/ExportService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  LEGACY_SYSTEM_FONT_ID,
  SlideFontId,
} from '../constants/fonts';
import { buildPreviewEffects } from '../utils/textEffectsPreview';
import { useResponsive } from '../hooks/useResponsive';
import { useFont } from '@shopify/react-native-skia';
import { EffectPipeline } from '../textfx/render/pipeline';
import { convertToNewFormat } from '../textfx/utils/effectConverter';
import type { EffectInstance } from '../textfx/types';
import { isTextEffectSupported } from '../constants/textEffects';

// Skia font sources for each supported font
const SKIA_FONT_SOURCES: Record<SlideFontId, number> = {
  archivo_black_regular: require('../assets/fonts/Archivo_Black/ArchivoBlack-Regular.ttf'),
  fira_sans_regular: require('../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
  fira_sans_semibold: require('../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
  homemade_apple_regular: require('../assets/fonts/Homemade_Apple/HomemadeApple-Regular.ttf'),
};

type RootStackParamList = {
  Home: undefined;
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
};

type PreviewRouteProp = RouteProp<RootStackParamList, 'Preview'>;
type PreviewNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// Helper to filter supported effects
const filterSupportedEffects = (effects?: any[]) =>
  (effects ?? []).filter((effect: any) => isTextEffectSupported(effect.type));

// Separate component to use hooks for Skia font loading
interface SlideRendererProps {
  item: any;
  index: number;
  slideSize: number;
  imageContainerHeight: number;
  themeColors: { card: string };
  onRef: (index: number, ref: View | null) => void;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({
  item,
  index,
  slideSize,
  imageContainerHeight,
  themeColors,
  onRef,
}) => {
  const fontSize = item.fontSize || 24;
  const platformKey =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
      ? 'android'
      : 'default';
  const legacyFontId =
    item.fontId === LEGACY_SYSTEM_FONT_ID
      ? DEFAULT_SLIDE_FONT_ID
      : item.fontId;
  const fontOption = legacyFontId
    ? getSlideFontById(legacyFontId)
    : getSlideFontByFamily(item.fontFamily);
  const resolvedFontFamily = resolveFontFamilyForPlatform(
    fontOption,
    platformKey,
  );
  const paddingHorizontal = Math.max(12, fontSize * 0.5);
  const paddingVertical = Math.max(8, fontSize * 0.35);
  const borderRadius = Math.min(Math.max(12, fontSize * 0.6), 30);

  // Load Skia font for effects rendering
  const activeFontId = (item.fontId === LEGACY_SYSTEM_FONT_ID ? DEFAULT_SLIDE_FONT_ID : item.fontId) as SlideFontId;
  const skiaFontSource = useMemo(() => {
    const fallback = SKIA_FONT_SOURCES[DEFAULT_SLIDE_FONT_ID];
    if (!activeFontId) {
      return fallback;
    }
    return SKIA_FONT_SOURCES[activeFontId] ?? fallback;
  }, [activeFontId]);
  const skiaFont = useFont(skiaFontSource, fontSize);

  // Filter and convert effects
  const slideEffects = filterSupportedEffects(item.textEffects);
  const newFormatEffects: EffectInstance[] = useMemo(() => {
    return slideEffects
      .map((effect: any) => convertToNewFormat(effect, item.color))
      .filter((effect: any): effect is EffectInstance => effect !== null);
  }, [slideEffects, item.color]);

  // Fallback to CSS-based preview effects when no Skia font or effects
  const previewEffects = buildPreviewEffects(item.textEffects ?? [], {
    text: item.text ?? '',
    fontSize,
    textColor: item.color || '#FFFFFF',
    fontFamily: resolvedFontFamily,
    fontWeight: fontOption?.supportsWeightToggle ? item.fontWeight : undefined,
  });

  const hasSkiaEffects = skiaFont && newFormatEffects.length > 0;

  return (
    <View
      ref={ref => onRef(index, ref)}
      style={[
        styles.slideContainer,
        { width: slideSize, height: imageContainerHeight },
      ]}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.imageBackground}
          resizeMode="contain"
        />
      ) : (
        <View
          style={[
            styles.plainBackground,
            { backgroundColor: themeColors.card },
          ]}
        />
      )}

      <View
        style={[
          styles.textOverlay,
          {
            left: item.position?.x || 50,
            top: item.position?.y || 50,
            backgroundColor: item.backgroundColor || 'rgba(0,0,0,0.5)',
            paddingHorizontal,
            paddingVertical,
            borderRadius,
            maxWidth: hasSkiaEffects ? undefined : slideSize * 0.9,
          },
        ]}
      >
        {hasSkiaEffects ? (
          <EffectPipeline
            text={item.text}
            x={0}
            baselineY={fontSize}
            font={skiaFont}
            width={slideSize * 0.9}
            height={fontSize * 2}
            textColor={item.color || '#FFFFFF'}
            effects={newFormatEffects}
            lineHeight={fontSize * 1.35}
            background="transparent"
          />
        ) : (
          <>
            {previewEffects.underlayElements}
            <Text
              style={[
                styles.slideText,
                {
                  fontSize,
                  color: item.color || '#FFFFFF',
                  textAlign: item.textAlign || 'center',
                  fontWeight: resolvedFontFamily
                    ? undefined
                    : item.fontWeight || 'bold',
                  fontFamily: resolvedFontFamily,
                  lineHeight: fontSize * 1.35,
                },
                previewEffects.textStyle,
              ]}
            >
              {item.text}
            </Text>
            {previewEffects.overlayElements}
          </>
        )}
      </View>
    </View>
  );
};

const PreviewScreen: React.FC = () => {
  const route = useRoute<PreviewRouteProp>();
  const navigation = useNavigation<PreviewNavigationProp>();
  const { slides } = route.params;
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRefs = useRef<View[]>([]);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const slideSize = Math.min(screenWidth * 0.99, screenWidth - 10); // Use 99% of screen width

  // Calculate available height for image container
  const headerHeight = Math.max(insets.top, 20) + 60; // Safe area + title height
  const exportButtonHeight = 100; // Height for export button + margins
  const availableHeight = screenHeight - headerHeight - exportButtonHeight;
  const imageContainerHeight = availableHeight; // Use available height without minimum constraint

  const handleExport = async () => {
    if (isExporting) return;

    FeedbackService.buttonTap();
    setIsExporting(true);

    try {
      const result = await ExportService.exportSlides(
        slides,
        slideRefs.current.map(ref => ({ current: ref })),
        {
          quality: 0.9,
          format: 'png',
          resolution: 1080,
        },
      );

      if (result.success && result.savedPaths.length > 0) {
        FeedbackService.success();
        ExportService.showExportSuccess(result.savedPaths.length, t);
      } else {
        FeedbackService.error();
        Alert.alert(
          t('export_failed'),
          result.error || t('export_failed_message'),
          [{ text: t('ok') }],
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      FeedbackService.error();
      Alert.alert(
        t('export_failed'),
        t('export_unexpected_error'),
        [{ text: t('ok') }],
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleSlideRef = (index: number, ref: View | null) => {
    if (ref) {
      slideRefs.current[index] = ref;
    }
  };

  const renderSlide = ({ item, index }: { item: any; index: number }) => (
    <SlideRenderer
      item={item}
      index={index}
      slideSize={slideSize}
      imageContainerHeight={imageContainerHeight}
      themeColors={{ card: themeDefinition.colors.card }}
      onRef={handleSlideRef}
    />
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: themeDefinition.colors.background,
        },
      ]}
    >
      <View style={styles.previewContainer}>
        {slides.length > 0 ? (
          <AnimatedFlatList
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true },
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            decelerationRate="fast"
            snapToInterval={slideSize + 20}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: themeDefinition.colors.text }]}
            >
              {t('preview_empty')}
            </Text>
          </View>
        )}
      </View>

      {/* Slide indicators */}
      <View style={[styles.indicatorsContainer, { marginVertical: scale(20) }]}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { width: scale(8), height: scale(8), borderRadius: scale(4), marginHorizontal: scale(4) },
              index === currentSlideIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>

      {/* Export button */}
      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            backgroundColor: isExporting
              ? themeDefinition.colors.border
              : '#34C759',
            padding: scale(15),
            margin: scale(20),
          },
          isExporting && styles.exportButtonDisabled,
        ]}
        onPress={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <View style={styles.exportingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.exportButtonText, { marginLeft: scale(10), fontSize: scaleFont(18) }]}>
              {t('exporting')}
            </Text>
          </View>
        ) : (
          <Text style={[styles.exportButtonText, { fontSize: scaleFont(18) }]}>{t('export')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 10,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  plainBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
  },
  textOverlay: {
    position: 'absolute',
    padding: 10,
    borderRadius: 5,
    maxWidth: '90%',
    overflow: 'visible',
    zIndex: 2,
  },
  slideText: {
    color: '#fff',
    fontWeight: 'bold',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#007AFF',
  },
  exportButton: {
    backgroundColor: '#34C759',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  exportingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PreviewScreen;
