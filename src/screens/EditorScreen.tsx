import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import StorageService, {
  ProjectState,
  SlideBackgroundGradient,
} from '../services/StorageService';
import ColorAnalysisService, {
  AiStyleSuggestion,
} from '../services/ColorAnalysisService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  smartSplit,
  optimizeForSlides,
  getOptimalSlideCount,
} from '../utils/textUtils';
import FeedbackService from '../services/FeedbackService';
import {
  SLIDE_FONT_OPTIONS,
  DEFAULT_SLIDE_FONT_ID,
  SlideFontId,
  SlideFontOption,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';
import TextEffectsPanel from '../components/TextEffectsPanel';
import TextEffectParameterEditor from '../components/TextEffectParameterEditor';
import { buildPreviewEffects } from '../utils/textEffectsPreview';
import {
  TextEffectCategory,
  TextEffectInstance,
  TextEffectType,
  TEXT_EFFECT_DEFINITIONS,
  isTextEffectSupported,
  createTextEffectInstance,
} from '../constants/textEffects';
import { useFont } from '@shopify/react-native-skia';
import { EffectPipeline } from '../textfx/render/pipeline';
import { convertToNewFormat } from '../textfx/utils/effectConverter';
import type { EffectInstance } from '../textfx/types';
import ColorPicker from '../assets/icons/ColorPicker.png';
import { useResponsive } from '../hooks/useResponsive';
import GradientBackground from '../components/GradientBackground';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 72;
const DEFAULT_TEXT_COLOR = '#FFFFFF';
const DEFAULT_BACKGROUND_COLOR = 'rgba(0,0,0,0.4)';
const COLOR_OPTIONS = [
  '#FFFFFF',
  '#000000',
  '#FF0000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#FF00FF',
  '#FFA500',
  '#8A2BE2',
  '#FFD700',
  '#0033A0',
  '#008080',
  '#BFFF00',
  '#FF7F50',
  '#800000',
  '#4B0082',
  '#808080',
];

const SKIA_FONT_SOURCES: Record<SlideFontId, number> = {
  archivo_black_regular: require('../assets/fonts/Archivo_Black/ArchivoBlack-Regular.ttf'),
  fira_sans_regular: require('../assets/fonts/Fira_Sans/FiraSans-Regular.ttf'),
  fira_sans_semibold: require('../assets/fonts/Fira_Sans/FiraSans-SemiBold.ttf'),
  homemade_apple_regular: require('../assets/fonts/Homemade_Apple/HomemadeApple-Regular.ttf'),
};

type RootStackParamList = {
  Home: undefined;
  Editor: { text: string; images: string[]; projectId: string };
  Preview: { slides: any[] };
  ImageSelection: { text: string; projectId: string; images?: string[] };
};

type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;
type EditorNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

// Enhanced slide type with more properties
type Slide = {
  id: number;
  text: string;
  image: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontFamily?: string;
  fontId?: SlideFontId;
  textEffects: TextEffectInstance[];
  backgroundGradient?: SlideBackgroundGradient | null;
  aiSuggestedForImageUri?: string;
  aiEffectInstanceId?: string;
  aiDominantColor?: string;
};

type SlideStyleSnapshot = Pick<
  Slide,
  | 'fontSize'
  | 'color'
  | 'backgroundColor'
  | 'backgroundGradient'
  | 'textAlign'
  | 'fontWeight'
  | 'fontFamily'
  | 'fontId'
  | 'textEffects'
>;

const filterSupportedEffects = (
  effects?: TextEffectInstance[],
): TextEffectInstance[] =>
  (effects ?? []).filter(effect => isTextEffectSupported(effect.type));

const cloneEffectParameters = (
  parameters?: Record<string, any>,
): Record<string, any> => {
  if (!parameters) {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(parameters));
  } catch (error) {
    return { ...parameters };
  }
};

const cloneTextEffects = (
  effects?: TextEffectInstance[],
): TextEffectInstance[] =>
  (effects ?? []).map(effect => {
    const clonedParameters = cloneEffectParameters(effect.parameters);
    const instance = createTextEffectInstance(effect.type, clonedParameters);
    return {
      ...instance,
      enabled: effect.enabled,
    };
  });

const measureTextWidth = (
  font: import('@shopify/react-native-skia').SkFont | null,
  value: string,
): number => {
  if (!font || !value) {
    return 0;
  }
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

const wrapTextWithFont = (
  font: import('@shopify/react-native-skia').SkFont | null,
  text: string,
  maxWidth: number,
): string[] => {
  if (!text) {
    return [''];
  }
  if (!font || !maxWidth || maxWidth <= 0) {
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
      if (measureTextWidth(font, candidate) <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      if (measureTextWidth(font, word) > maxWidth) {
        let chunk = '';
        for (const char of word) {
          const nextChunk = chunk + char;
          if (measureTextWidth(font, nextChunk) <= maxWidth) {
            chunk = nextChunk;
          } else {
            if (chunk) {
              lines.push(chunk);
            }
            chunk = char;
          }
        }
        currentLine = chunk;
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

const EditorScreen: React.FC = () => {
  const route = useRoute<EditorRouteProp>();
  const navigation = useNavigation<EditorNavigationProp>();
  const { text, images, projectId } = route.params;
  const insets = useSafeAreaInsets();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const {
    sliderHeight: SLIDER_HEIGHT,
    scale: scaleSize,
    scaleFont,
    controlGap,
    paddingHorizontal: responsivePadding,
    largeButtonSize,
    navArrowSize,
    colorSwatchSize,
  } = useResponsive();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // Ensure we have non-zero dimensions
  const validWidth = screenWidth || Dimensions.get('window').width || 360;
  const validHeight = screenHeight || Dimensions.get('window').height || 800;

  const slideSize = Math.min(validWidth * 0.99, validWidth - 10); // Use 99% of screen width

  // Calculate available height for image container
  const headerHeight = Math.max(insets.top, 20) + 60; // Safe area + title height
  const previewButtonHeight = 80; // Height for preview button + margins
  const availableHeight = validHeight - headerHeight - previewButtonHeight;
  const imageContainerHeight = availableHeight; // Use available height without minimum constraint
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringFromStorage = useRef(false);

  // Helper function to create initial slides from text
  const createInitialSlides = useCallback((): Slide[] => {
    const optimizedText = optimizeForSlides(text);
    const optimalSlideCount = getOptimalSlideCount(optimizedText);
    const textSlides = smartSplit(optimizedText, optimalSlideCount);

    if (textSlides.length === 0) {
      return [
        {
          id: 0,
          text: t('no_content_provided') || 'No text provided',
          image: '',
          position: { x: (slideSize - 200) / 2, y: (imageContainerHeight - 50) / 2 },
          fontSize: 24,
          color: DEFAULT_TEXT_COLOR,
          backgroundColor: DEFAULT_BACKGROUND_COLOR,
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: undefined,
          fontId: DEFAULT_SLIDE_FONT_ID,
          textEffects: [],
          backgroundGradient: null,
          aiSuggestedForImageUri: undefined,
          aiEffectInstanceId: undefined,
          aiDominantColor: undefined,
        },
      ];
    }

    return textSlides.map((slideText, index) => {
      const fontSize = 24;
      const textLength = slideText.length;
      const textPadding = 20;
      const charsPerLine = Math.max(
        1,
        Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
      );
      const numberOfLines = Math.ceil(textLength / charsPerLine);
      const estimatedTextWidth = Math.min(
        slideSize * 0.9,
        textLength < charsPerLine
          ? textLength * fontSize * 0.6
          : slideSize * 0.9,
      );
      const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;

      const centerX = Math.max(0, (slideSize - estimatedTextWidth) / 2);
      const centerY = Math.max(0, (imageContainerHeight - estimatedTextHeight) / 2);

      return {
        id: index,
        text: slideText,
        image: images[index] || '',
        position: { x: centerX, y: centerY },
        fontSize: fontSize,
        color: DEFAULT_TEXT_COLOR,
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        textAlign: 'center',
        fontWeight: 'bold',
        fontFamily: undefined,
        fontId: DEFAULT_SLIDE_FONT_ID,
        textEffects: [],
        backgroundGradient: null,
        aiSuggestedForImageUri: undefined,
        aiEffectInstanceId: undefined,
        aiDominantColor: undefined,
      };
    });
  }, [text, images, slideSize, imageContainerHeight, t]);

  // Loading state for project initialization
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isColorPaletteVisible, setColorPaletteVisible] = useState(false);
  const [isOpacityPaletteVisible, setOpacityPaletteVisible] = useState(false);
  const [isFontPaletteVisible, setFontPaletteVisible] = useState(false);
  const [isTextEffectsPanelVisible, setTextEffectsPanelVisible] =
    useState(false);
  const [isEffectsPaletteVisible, setEffectsPaletteVisible] = useState(false);
  const [activeTextEffectsCategory, setActiveTextEffectsCategory] =
    useState<TextEffectCategory>('lighting'); // Default to "Light & Glow" category which has supported effects
  const [selectedTextEffectId, setSelectedTextEffectId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [isStyleMenuVisible, setStyleMenuVisible] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<SlideStyleSnapshot | null>(null);
  const [isAiApplying, setAiApplying] = useState(false);

  const slidesRef = useRef<Slide[]>(slides);
  const isAutoAiRunningRef = useRef(false);
  const toolPaletteAnim = useSharedValue(0);
  const opacityPaletteAnim = useSharedValue(0);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Undo/Redo history management
  const [_history, setHistory] = useState<Slide[][]>([]);
  const [_historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = useRef(0);
  const historyRef = useRef<Slide[][]>([]);
  const [headerUpdateTrigger, setHeaderUpdateTrigger] = useState(0);
  const isRestoringFromHistory = useRef(false);

  const currentSlide = slides[currentSlideIndex];
  const isAiButtonActive = isAiApplying;
  const isAiButtonDisabled = isAiApplying;
  const currentSlideEffects = useMemo(
    () => filterSupportedEffects(currentSlide?.textEffects),
    [currentSlide?.textEffects],
  );
  const selectedTextEffect = selectedTextEffectId
    ? currentSlideEffects.find(
        effect => effect.instanceId === selectedTextEffectId,
      ) || null
    : null;
  const selectedTextEffectDefinition = selectedTextEffect
    ? TEXT_EFFECT_DEFINITIONS[selectedTextEffect.type]
    : undefined;


  const overlayPaddingHorizontal = Math.max(
    12,
    currentSlide?.fontSize * 0.55 || 0,
  );
  const overlayPaddingVertical = Math.max(
    16,
    currentSlide?.fontSize * 0.65 || 0,
  );
  const overlayBorderRadius = Math.min(
    Math.max(12, currentSlide?.fontSize * 0.6 || 0),
    30,
  );

  const platformKey =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
      ? 'android'
      : 'default';

  const normalizedFontId =
    currentSlide?.fontId === LEGACY_SYSTEM_FONT_ID
      ? DEFAULT_SLIDE_FONT_ID
      : currentSlide?.fontId;

  const activeFontOption = currentSlide
    ? normalizedFontId
      ? getSlideFontById(normalizedFontId)
      : getSlideFontByFamily(currentSlide.fontFamily)
    : getSlideFontById(DEFAULT_SLIDE_FONT_ID);
  const activeFontId = activeFontOption.id;
  const resolvedFontFamily = resolveFontFamilyForPlatform(
    activeFontOption,
    platformKey,
  );
  const previewEffects = buildPreviewEffects(currentSlideEffects, {
    text: currentSlide?.text || '',
    fontSize: currentSlide?.fontSize || 24,
    textColor: currentSlide?.color || '#FFFFFF',
    fontFamily: resolvedFontFamily,
    fontWeight: activeFontOption?.supportsWeightToggle
      ? currentSlide?.fontWeight
      : undefined,
  });
  const previewUnderlayElements = previewEffects.underlayElements.filter(
    React.isValidElement,
  ) as React.ReactElement[];
  const previewOverlayElements = previewEffects.overlayElements.filter(
    React.isValidElement,
  ) as React.ReactElement[];

  // Load Skia font for text effects rendering
  const skiaFontSource = useMemo(() => {
    const fallback = SKIA_FONT_SOURCES[DEFAULT_SLIDE_FONT_ID];
    if (!activeFontId) {
      return fallback;
    }
    return SKIA_FONT_SOURCES[activeFontId] ?? fallback;
  }, [activeFontId]);

  const skiaFont = useFont(skiaFontSource, currentSlide?.fontSize || 24);

  // Convert old text effects to new format for Skia rendering
  const newFormatEffects: EffectInstance[] = React.useMemo(() => {
    return currentSlideEffects
      .map(effect => convertToNewFormat(effect, currentSlide?.color))
      .filter((effect): effect is EffectInstance => effect !== null);
  }, [currentSlideEffects, currentSlide?.color]);

  const effectsActive = currentSlideEffects.some(effect => effect.enabled !== false);
  const effectTextLayout = useMemo(() => {
    if (!skiaFont || !effectsActive) {
      return null;
    }
    const maxTextWidth = Math.max(
      24,
      slideSize * 0.9 - overlayPaddingHorizontal * 2,
    );
    const lines = wrapTextWithFont(
      skiaFont,
      currentSlide?.text ?? '',
      maxTextWidth,
    );
    const maxLineWidth = lines.reduce(
      (maxWidth, line) =>
        Math.max(maxWidth, measureTextWidth(skiaFont, line)),
      0,
    );
    return {
      maxTextWidth,
      maxLineWidth,
    };
  }, [
    skiaFont,
    effectsActive,
    currentSlide?.text,
    slideSize,
    overlayPaddingHorizontal,
  ]);

  const fallbackOverlayWidth = useMemo(() => {
    if (!effectsActive) {
      return undefined;
    }
    const fontSize = currentSlide?.fontSize || 24;
    const textValue = currentSlide?.text ?? '';
    const textLength = textValue.length;
    const charsPerLine = Math.max(
      1,
      Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
    );
    const estimatedTextWidth = Math.min(
      slideSize * 0.9,
      textLength < charsPerLine
        ? textLength * fontSize * 0.6
        : slideSize * 0.9,
    );

    return Math.min(
      slideSize * 0.9,
      Math.max(overlayPaddingHorizontal * 2 + 12, estimatedTextWidth + overlayPaddingHorizontal * 2),
    );
  }, [
    effectsActive,
    currentSlide?.fontSize,
    currentSlide?.text,
    slideSize,
    overlayPaddingHorizontal,
  ]);

  const overlayMaxWidth = slideSize * 0.9;
  const overlayWidth =
    effectsActive && effectTextLayout
      ? Math.min(
          overlayMaxWidth,
          Math.max(
            overlayPaddingHorizontal * 2 + 12,
            effectTextLayout.maxLineWidth + overlayPaddingHorizontal * 2,
          ),
        )
      : effectsActive
      ? fallbackOverlayWidth
      : undefined;
  const effectCanvasWidth = effectTextLayout?.maxTextWidth ?? overlayMaxWidth;

  const toolPaletteVisible =
    isColorPaletteVisible || isFontPaletteVisible || isEffectsPaletteVisible;
  const anyToolPanelOpen = toolPaletteVisible || isOpacityPaletteVisible;

  const closeToolPanels = useCallback(() => {
    setColorPaletteVisible(false);
    setFontPaletteVisible(false);
    setEffectsPaletteVisible(false);
    setOpacityPaletteVisible(false);
  }, []);

  useEffect(() => {
    toolPaletteAnim.value = withTiming(toolPaletteVisible ? 1 : 0, {
      duration: 180,
    });
  }, [toolPaletteVisible, toolPaletteAnim]);

  useEffect(() => {
    opacityPaletteAnim.value = withTiming(isOpacityPaletteVisible ? 1 : 0, {
      duration: 180,
    });
  }, [isOpacityPaletteVisible, opacityPaletteAnim]);

  const toolPaletteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: toolPaletteAnim.value,
    transform: [{ translateY: (1 - toolPaletteAnim.value) * 12 }],
  }));

  const opacityPaletteAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacityPaletteAnim.value,
    transform: [{ translateY: (1 - opacityPaletteAnim.value) * 12 }],
  }));



  // Animated values for drag and drop (must be declared at the top level)
  const translateX = useSharedValue(currentSlide?.position?.x || 50);
  const translateY = useSharedValue(currentSlide?.position?.y || 100);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // Store current slide properties in shared values to access in gesture
  const currentFontSize = useSharedValue(currentSlide?.fontSize || 24);
  const currentTextLength = useSharedValue(currentSlide?.text?.length || 0);

  // Pinch and rotate gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // Font size slider gesture values
  const sliderTranslateY = useSharedValue(
    (() => {
      const progress = currentSlide
        ? (currentSlide.fontSize - MIN_FONT_SIZE) /
          (MAX_FONT_SIZE - MIN_FONT_SIZE)
        : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      return (1 - clampedProgress) * SLIDER_HEIGHT;
    })(),
  );
  const sliderStartY = useSharedValue(0);

  const colorPaletteScrollRef = useRef<ScrollView | null>(null);
  const fontPaletteScrollRef = useRef<ScrollView | null>(null);
  const colorOptionPositions = useRef<Record<string, number>>({});
  const fontOptionPositions = useRef<Record<string, number>>({});

  const ensureSelectedColorVisible = useCallback(() => {
    if (!isColorPaletteVisible || !colorPaletteScrollRef.current) {
      return;
    }

    const selectedColor = currentSlide?.color;
    if (!selectedColor) {
      return;
    }

    const optionX = colorOptionPositions.current[selectedColor];
    if (typeof optionX !== 'number') {
      return;
    }

    colorPaletteScrollRef.current.scrollTo({
      x: Math.max(0, optionX - 16),
      animated: false,
    });
  }, [currentSlide?.color, isColorPaletteVisible]);

  const ensureSelectedFontVisible = useCallback(() => {
    if (!isFontPaletteVisible || !fontPaletteScrollRef.current) {
      return;
    }

    if (!activeFontId) {
      return;
    }

    const optionX = fontOptionPositions.current[activeFontId];
    if (typeof optionX !== 'number') {
      return;
    }

    fontPaletteScrollRef.current.scrollTo({
      x: Math.max(0, optionX - 20),
      animated: false,
    });
  }, [activeFontId, isFontPaletteVisible]);

  useEffect(() => {
    if (!isColorPaletteVisible) {
      return;
    }

    const timeout = setTimeout(() => {
      ensureSelectedColorVisible();
    }, 0);

    return () => clearTimeout(timeout);
  }, [ensureSelectedColorVisible, isColorPaletteVisible]);

  useEffect(() => {
    if (!isFontPaletteVisible) {
      return;
    }

    const timeout = setTimeout(() => {
      ensureSelectedFontVisible();
    }, 0);

    return () => clearTimeout(timeout);
  }, [ensureSelectedFontVisible, isFontPaletteVisible]);

  // Auto-save functionality
  const saveProject = useCallback(async () => {
    const sanitizedSlidesForPersist = slides.map(slide => ({
      ...slide,
      textEffects: filterSupportedEffects(slide.textEffects),
    }));
    const projectState: ProjectState = {
      id: projectId,
      text,
      slides: sanitizedSlidesForPersist,
      images,
      lastModified: new Date().toISOString(),
      isCompleted: false,
    };

    try {
      await StorageService.saveCurrentProject(projectState);
      console.log('Project auto-saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to auto-save project:', error);
    }
  }, [text, slides, images, projectId]);

  const handleOpenImageSelection = useCallback(async () => {
    FeedbackService.buttonTap();
    await saveProject();
    navigation.navigate('ImageSelection', {
      text: text,
      projectId: projectId,
      images: images,
    });
  }, [navigation, saveProject, text, projectId, images]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    FeedbackService.buttonTap();
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    
    console.log('Undo called:', { currentIndex, historyLength: currentHistory.length });
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      isRestoringFromHistory.current = true;
      setSlides(currentHistory[newIndex]);
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setHasUnsavedChanges(true);
      setHeaderUpdateTrigger(prev => prev + 1);
      setTimeout(() => {
        isRestoringFromHistory.current = false;
      }, 0);
    }
  }, [setHeaderUpdateTrigger]);

  const handleRedo = useCallback(() => {
    FeedbackService.buttonTap();
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    
    console.log('Redo called:', { currentIndex, historyLength: currentHistory.length });
    
    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1;
      isRestoringFromHistory.current = true;
      setSlides(currentHistory[newIndex]);
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setHasUnsavedChanges(true);
      setHeaderUpdateTrigger(prev => prev + 1);
      setTimeout(() => {
        isRestoringFromHistory.current = false;
      }, 0);
    }
  }, [setHeaderUpdateTrigger]);

  // Set up custom header with folder button and undo/redo
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleUndo}
            style={{ paddingHorizontal: 8, opacity: historyIndexRef.current > 0 ? 1 : 0.3 }}
          >
            <Image source={require('../assets/icons/undo.png')} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRedo}
            style={{ paddingHorizontal: 8, opacity: historyIndexRef.current < historyRef.current.length - 1 ? 1 : 0.3 }}
          >
            <Image source={require('../assets/icons/redo.png')} style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenImageSelection}
            style={{ paddingHorizontal: 12 }}
          >
            <Text style={{ fontSize: 20 }}>📁</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleOpenImageSelection, handleUndo, handleRedo, headerUpdateTrigger]);

  // Save project before navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async () => {
      await saveProject();
    });
    return unsubscribe;
  }, [navigation, saveProject]);

  // Set up auto-save
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set up new auto-save timer (save after 5 seconds of no changes)
    if (hasUnsavedChanges) {
      autoSaveTimer.current = setTimeout(() => {
        saveProject();
      }, 5000);
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, saveProject]);

  // Load saved project if exists, or create initial slides
  useEffect(() => {
    const loadSavedProject = async () => {
      try {
        const savedProject = await StorageService.loadCurrentProject();
        if (savedProject && !savedProject.isCompleted && savedProject.slides?.length > 0) {
          // Check if the images from navigation params are different from saved project
          const savedImages = savedProject.slides.map(
            slide => slide.image || '',
          );
          const imagesChanged =
            images.length !== savedImages.length ||
            images.some((img, index) => img !== savedImages[index]);

          if (imagesChanged) {
            // Images have changed, update slides with new images but keep other properties (including effects)
            console.log('Images changed, updating slides with new images');
            const updatedSlides = savedProject.slides.map((slide, index) => ({
              ...slide,
              image: images[index] || '',
              textEffects: filterSupportedEffects(slide.textEffects),
            }));

            isRestoringFromStorage.current = true;
            isRestoringFromHistory.current = true;
            setSlides(updatedSlides);
            setHistory([updatedSlides]);
            historyRef.current = [updatedSlides];
            historyIndexRef.current = 0;
            setHistoryIndex(0);
            setCurrentSlideIndex(0);
            setTimeout(() => {
              isRestoringFromHistory.current = false;
            }, 0);
          } else {
            // Images are the same, restore normally with effects preserved
            isRestoringFromStorage.current = true;
            isRestoringFromHistory.current = true;
            const sanitizedSlides = savedProject.slides.map(slide => ({
              ...slide,
              textEffects: filterSupportedEffects(slide.textEffects),
            }));
            setSlides(sanitizedSlides);
            setHistory([sanitizedSlides]);
            historyRef.current = [sanitizedSlides];
            historyIndexRef.current = 0;
            setHistoryIndex(0);
            setCurrentSlideIndex(0);
            setTimeout(() => {
              isRestoringFromHistory.current = false;
            }, 0);
          }
        } else {
          // No saved project or completed project - create fresh initial slides
          StorageService.clearCurrentProject();
          const freshSlides = createInitialSlides();
          isRestoringFromStorage.current = true;
          isRestoringFromHistory.current = true;
          setSlides(freshSlides);
          setHistory([freshSlides]);
          historyRef.current = [freshSlides];
          historyIndexRef.current = 0;
          setHistoryIndex(0);
          setCurrentSlideIndex(0);
          setTimeout(() => {
            isRestoringFromHistory.current = false;
          }, 0);
        }
      } catch (error) {
        console.error('Failed to load saved project:', error);
        // On error, create fresh slides
        const freshSlides = createInitialSlides();
        setSlides(freshSlides);
        setHistory([freshSlides]);
        historyRef.current = [freshSlides];
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadSavedProject();
  }, [images, createInitialSlides]); // Add images as dependency so it runs when images change

  // Self-correction for initial 0,0 position if dimensions were not ready during initial load
  useEffect(() => {
    if (slideSize > 0 && imageContainerHeight > 0) {
      setSlides(prevSlides => {
        let changed = false;
        const newSlides = prevSlides.map(slide => {
          // Check if slide is at exact 0,0 and centered, which implies uninitialized position
          // We only auto-correct if it's strictly 0,0 and centered text
          if (slide.position.x === 0 && slide.position.y === 0 && slide.textAlign === 'center') {
             const fontSize = slide.fontSize;
             const textLength = slide.text.length;
             const textPadding = 20;
             const charsPerLine = Math.max(
               1,
               Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
             );
             const numberOfLines = Math.ceil(textLength / charsPerLine);
             const estimatedTextWidth = Math.min(
               slideSize * 0.9,
               textLength < charsPerLine
                 ? textLength * fontSize * 0.6
                 : slideSize * 0.9,
             );
             const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;
             
             const centerX = Math.max(0, (slideSize - estimatedTextWidth) / 2);
             const centerY = Math.max(0, (imageContainerHeight - estimatedTextHeight) / 2);

             // Only update if the calculated position is significantly different from 0,0
             if (centerX > 1 || centerY > 1) {
               changed = true;
               return { ...slide, position: { x: centerX, y: centerY } };
             }
          }
          return slide;
        });
        
        if (changed) {
          console.log('Self-corrected slide positions from 0,0 to centered');
          // We don't call addToHistory here to avoid polluting history with auto-correction
          // But we should mark unsaved changes? Maybe not, to avoid prompting save on fresh open.
          return newSlides;
        }
        return prevSlides;
      });
    }
  }, [slideSize, imageContainerHeight]); // Run when dimensions change/ready

  // Update animated values when slide changes
  useEffect(() => {
    if (currentSlide) {
      translateX.value = withSpring(currentSlide.position.x);
      translateY.value = withSpring(currentSlide.position.y);
      currentFontSize.value = currentSlide.fontSize;
      currentTextLength.value = currentSlide.text.length;
      scale.value = 1;
      savedScale.value = 1;
      rotation.value = 0;
      savedRotation.value = 0;
    }
  }, [
    currentSlideIndex,
    currentSlide,
    translateX,
    translateY,
    currentFontSize,
    currentTextLength,
    scale,
    savedScale,
    rotation,
    savedRotation,
  ]);

  // Initialize slider position when slide changes
  useEffect(() => {
    if (currentSlide) {
      const progress =
        (currentSlide.fontSize - MIN_FONT_SIZE) /
        (MAX_FONT_SIZE - MIN_FONT_SIZE);
      const clampedProgress = Math.max(0, Math.min(1, progress));
      sliderTranslateY.value = withSpring(
        (1 - clampedProgress) * SLIDER_HEIGHT,
      );

      console.log('Slider initialized:', {
        fontSize: currentSlide.fontSize,
        progress: clampedProgress,
        newPosition: (1 - clampedProgress) * SLIDER_HEIGHT,
      });
    }
  }, [currentSlideIndex, currentSlide, sliderTranslateY, SLIDER_HEIGHT]);

  useEffect(() => {
    if (!selectedTextEffectId) {
      return;
    }
    const stillExists = currentSlideEffects.some(
      effect => effect.instanceId === selectedTextEffectId,
    );
    if (!stillExists) {
      setSelectedTextEffectId(null);
    }
  }, [currentSlideEffects, selectedTextEffectId]);

  // Mark changes for auto-save
  useEffect(() => {
    if (isRestoringFromStorage.current) {
      isRestoringFromStorage.current = false;
      setHasUnsavedChanges(false);
      return;
    }
    setHasUnsavedChanges(true);
  }, [slides]);

  // Add to history function
  const addToHistory = useCallback(
    (newSlides: Slide[]) => {
      console.log(
        'addToHistory called, isRestoring:',
        isRestoringFromHistory.current,
      );
      if (!isRestoringFromHistory.current) {
        setHistory(prevHistory => {
          const currentIndex = historyIndexRef.current;
          const newHistory = prevHistory.slice(0, currentIndex + 1);
          newHistory.push(newSlides);
          console.log(
            'History updated, new length:',
            newHistory.length,
            'current index:',
            currentIndex,
          );

          // Keep history limited to 20 items
          let newIndex: number;
          if (newHistory.length > 20) {
            newHistory.shift();
            newIndex = 19;
          } else {
            newIndex = newHistory.length - 1;
          }

          historyIndexRef.current = newIndex;
          setHistoryIndex(newIndex);
          
          // Update the ref as well
          historyRef.current = newHistory;
          
          // Trigger header update
          setHeaderUpdateTrigger(prev => prev + 1);

          return newHistory;
        });
      }
    },
    [setHeaderUpdateTrigger],
  );

  // Function to update slide position (needs to be called from JS thread)
  const updateSlidePosition = (x: number, y: number) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = { ...newSlides[currentSlideIndex] };
      if (slide) {
        slide.position = { x, y };
        newSlides[currentSlideIndex] = slide;
        addToHistory(newSlides);
      }
      return newSlides;
    });
  };

  const handleFontSizeChange = (change: number) => {
    FeedbackService.textResize();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = { ...newSlides[currentSlideIndex] };

      const clampedFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, slide.fontSize + change),
      );
      slide.fontSize = clampedFontSize;
      // Update the shared value for gesture handling
      currentFontSize.value = slide.fontSize;
      sliderTranslateY.value = withSpring(
        (1 -
          (clampedFontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) *
          SLIDER_HEIGHT,
      );
      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });
  };

  const updateFontSize = useCallback(
    (newFontSize: number, saveToHistory: boolean = true) => {
      console.log('updateFontSize called with:', newFontSize, 'saveToHistory:', saveToHistory);
      FeedbackService.textResize();
      setSlides(prevSlides => {
        const newSlides = [...prevSlides];
        const slide = { ...newSlides[currentSlideIndex] };
        const clampedFontSize = Math.max(
          MIN_FONT_SIZE,
          Math.min(MAX_FONT_SIZE, newFontSize),
        );
        slide.fontSize = clampedFontSize;
        // Update the shared value for gesture handling
        currentFontSize.value = slide.fontSize;
        sliderTranslateY.value = withSpring(
          (1 -
            (clampedFontSize - MIN_FONT_SIZE) /
              (MAX_FONT_SIZE - MIN_FONT_SIZE)) *
            SLIDER_HEIGHT,
        );
        newSlides[currentSlideIndex] = slide;
        if (saveToHistory) {
          addToHistory(newSlides);
        }
        setHasUnsavedChanges(true);
        console.log('Font size updated to:', slide.fontSize);
        return newSlides;
      });
    },
    [currentSlideIndex, addToHistory, currentFontSize, sliderTranslateY, SLIDER_HEIGHT],
  );



  // Text editing functions
  const handleStartEditingText = () => {
    if (currentSlide) {
      setEditingText(currentSlide.text);
      setIsEditingText(true);
      FeedbackService.buttonTap();
    }
  };

  const handleFinishEditingText = () => {
    if (currentSlide && editingText.trim() !== currentSlide.text) {
      setSlides(prevSlides => {
        const newSlides = [...prevSlides];
        const slide = { ...newSlides[currentSlideIndex] };
        slide.text = editingText.trim();
        newSlides[currentSlideIndex] = slide;
        addToHistory(newSlides);
        return newSlides;
      });
      setHasUnsavedChanges(true);
    }
    setIsEditingText(false);
    setEditingText('');
    FeedbackService.buttonTap();
  };

  const handleCancelEditingText = () => {
    setIsEditingText(false);
    setEditingText('');
    FeedbackService.buttonTap();
  };

  const panGesture = Gesture.Pan()
    .onStart(_ => {
      // Don't start dragging if we're in text editing mode
      if (isEditingText) return;
      
      // Store the current position as starting point
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate(event => {
      // Don't update position if we're in text editing mode
      if (isEditingText) return;
      
      // Calculate new position based on translation from start
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;

      // Calculate text dimensions based on font size and text length
      // More accurate estimation for text bounds
      const textPadding = 20;
      const fontSize = currentFontSize.value;
      const textLength = currentTextLength.value;

      const charsPerLine = Math.max(
        1,
        Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
      );
      const numberOfLines = Math.ceil(textLength / charsPerLine);
      const estimatedTextWidth = Math.min(
        slideSize * 0.9, // Max 90% of slide width
        textLength < charsPerLine
          ? textLength * fontSize * 0.6
          : slideSize * 0.9,
      );
      const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;

      // Ensure text container stays within slide boundaries
      const minX = 0;
      const minY = 0;
      const maxX = Math.max(0, slideSize - estimatedTextWidth);
      const maxY = Math.max(0, imageContainerHeight - estimatedTextHeight);

      // Apply constraints to keep text fully within bounds
      const constrainedX = Math.max(minX, Math.min(maxX, newX));
      const constrainedY = Math.max(minY, Math.min(maxY, newY));

      translateX.value = constrainedX;
      translateY.value = constrainedY;
    })
    .onEnd(() => {
      // Don't update position if we're in text editing mode
      if (isEditingText) return;
      
      // Update slide position using runOnJS
      runOnJS(updateSlidePosition)(translateX.value, translateY.value);
    })
    .runOnJS(true);

  // Pinch gesture for scaling
  const pinchGesture = Gesture.Pinch()
    .onUpdate(event => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Update font size based on scale
      const newFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, currentFontSize.value * scale.value),
      );
      runOnJS(handleFontSizeChange)(newFontSize - currentFontSize.value);
      scale.value = withSpring(1);
      savedScale.value = 1;
    })
    .runOnJS(true);

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate(event => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    })
    .runOnJS(true);

  // Font size slider gesture
  const sliderGesture = Gesture.Pan()
    .onStart(() => {
      sliderStartY.value = sliderTranslateY.value;
    })
    .onUpdate(event => {
      const newY = sliderStartY.value + event.translationY;

      // Constrain the slider movement within bounds
      const constrainedY = Math.max(0, Math.min(SLIDER_HEIGHT, newY));
      sliderTranslateY.value = constrainedY;

      // Update font size continuously while dragging
      const progress = 1 - constrainedY / SLIDER_HEIGHT;
      const liveFontSize = Math.round(
        MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE),
      );
      if (updateFontSize) {
        runOnJS(updateFontSize)(liveFontSize, false);
      }
    })
    .onEnd(() => {
      // Calculate final font size based on slider position
      const progress = 1 - sliderTranslateY.value / SLIDER_HEIGHT;
      const fontSize = Math.round(
        MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE),
      );

      // Update font size only when gesture ends
      if (updateFontSize) {
        runOnJS(updateFontSize)(fontSize, true);
      }

      // Snap to final position
      sliderTranslateY.value = withSpring(sliderTranslateY.value);
    })
    .runOnJS(true)
    .shouldCancelWhenOutside(false);

  // Tap gesture for text editing
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      handleStartEditingText();
    })
    .runOnJS(true);

  // Compose all gestures
  const composed = Gesture.Simultaneous(
    tapGesture,
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture),
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}rad` },
      ],
    };
  });

  const sliderThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sliderTranslateY.value - 12 }], // Adjusted for larger thumb
  }));

  const captureSlideStyle = (slide: Slide): SlideStyleSnapshot => ({
    fontSize: slide.fontSize,
    color: slide.color,
    backgroundColor: slide.backgroundColor,
    textAlign: slide.textAlign,
    fontWeight: slide.fontWeight,
    fontFamily: slide.fontFamily,
    fontId:
      slide.fontId === LEGACY_SYSTEM_FONT_ID
        ? DEFAULT_SLIDE_FONT_ID
        : slide.fontId,
    textEffects: filterSupportedEffects(slide.textEffects),
  });

  const applyStyleToSlide = (
    slide: Slide,
    style: SlideStyleSnapshot,
  ): Slide => ({
    ...slide,
    fontSize: style.fontSize,
    color: style.color,
    backgroundColor: style.backgroundColor,
    textAlign: style.textAlign,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    fontId: style.fontId,
    textEffects: cloneTextEffects(style.textEffects),
  });

  const handleCopyStyle = () => {
    FeedbackService.buttonTap();
    setCopiedStyle(captureSlideStyle(currentSlide));
    setStyleMenuVisible(false);
  };

  const handleCopyStyleToAllSlides = () => {
    FeedbackService.buttonTap();
    const styleSnapshot = captureSlideStyle(currentSlide);
    setCopiedStyle(styleSnapshot);
    setSlides(prevSlides => {
      const newSlides = prevSlides.map(slide =>
        applyStyleToSlide(slide, styleSnapshot),
      );
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
    setTextEffectsPanelVisible(false);
    setSelectedTextEffectId(null);
    setStyleMenuVisible(false);
  };

  const handleApplyCopiedStyle = () => {
    if (!copiedStyle) {
      return;
    }
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      newSlides[currentSlideIndex] = applyStyleToSlide(slide, copiedStyle);
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
    setTextEffectsPanelVisible(false);
    setSelectedTextEffectId(null);
    setStyleMenuVisible(false);
  };

  const updateNeonGlowEffects = useCallback(
    (
      effects: TextEffectInstance[] | undefined,
      oldTextColor: string,
      newTextColor: string,
    ): TextEffectInstance[] => {
      if (!effects?.length) {
        return effects ?? [];
      }

      return effects.map(effect => {
        if (effect.type !== 'neonGlow') {
          return effect;
        }
        const currentGlowColor = effect.parameters?.glowColor;
        const shouldUpdate =
          !currentGlowColor ||
          currentGlowColor === '#00FFFF' ||
          currentGlowColor === oldTextColor;

        if (!shouldUpdate) {
          return effect;
        }

        return {
          ...effect,
          parameters: {
            ...effect.parameters,
            glowColor: newTextColor,
          },
        };
      });
    },
    [],
  );

  const isSlideEligibleForAutoAi = useCallback(
    (slide: Slide): boolean =>
      Boolean(slide.image) &&
      slide.aiSuggestedForImageUri !== slide.image &&
      slide.color === DEFAULT_TEXT_COLOR,
    [],
  );

  const pickRandomFontOption = useCallback((currentFontId: SlideFontId): SlideFontOption => {
    const candidates = SLIDE_FONT_OPTIONS.filter(option => option.id !== currentFontId);
    if (candidates.length === 0) {
      return getSlideFontById(DEFAULT_SLIDE_FONT_ID);
    }
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }, []);

  const applyAiNeonGlowEffect = useCallback(
    (
      slide: Slide,
      suggestion: AiStyleSuggestion,
    ): { effects: TextEffectInstance[]; aiEffectInstanceId?: string; changed: boolean } => {
      const baseEffects = slide.textEffects ?? [];
      const neonParams = suggestion.effect.parameters;
      let changed = false;

      if (slide.aiEffectInstanceId) {
        let foundById = false;
        const updatedById = baseEffects.map(effect => {
          if (effect.instanceId !== slide.aiEffectInstanceId) {
            return effect;
          }
          foundById = true;
          changed = true;
          return {
            ...effect,
            enabled: true,
            parameters: {
              ...effect.parameters,
              ...neonParams,
            },
          };
        });
        if (foundById) {
          return {
            effects: updatedById,
            aiEffectInstanceId: slide.aiEffectInstanceId,
            changed,
          };
        }
      }

      const fallbackNeonEffect = baseEffects.find(
        effect =>
          effect.type === 'neonGlow' &&
          (effect.parameters?.glowColor === '#00FFFF' ||
            effect.parameters?.glowColor === slide.aiDominantColor),
      );

      if (fallbackNeonEffect) {
        changed = true;
        const updatedFallback = baseEffects.map(effect =>
          effect.instanceId === fallbackNeonEffect.instanceId
            ? {
                ...effect,
                enabled: true,
                parameters: {
                  ...effect.parameters,
                  ...neonParams,
                },
              }
            : effect,
        );
        return {
          effects: updatedFallback,
          aiEffectInstanceId: fallbackNeonEffect.instanceId,
          changed,
        };
      }

      const newEffect = createTextEffectInstance('neonGlow', neonParams);
      changed = true;
      return {
        effects: [...baseEffects, newEffect],
        aiEffectInstanceId: newEffect.instanceId,
        changed,
      };
    },
    [],
  );

  const applyAiSuggestionsFromMap = useCallback(
    (
      suggestions: Map<number, AiStyleSuggestion>,
      mode: 'auto' | 'manual',
      randomFontOption?: SlideFontOption,
    ) => {
      if (suggestions.size === 0) {
        return;
      }

      setSlides(prevSlides => {
        let changed = false;
        const nextSlides = prevSlides.map((slide, index) => {
          const suggestion = suggestions.get(index);
          if (!suggestion || !slide.image) {
            return slide;
          }
          if (slide.image !== suggestion.sourceImageUri) {
            return slide;
          }
          if (mode === 'auto' && !isSlideEligibleForAutoAi(slide)) {
            return slide;
          }

          const nextColor = suggestion.textColor;
          if (mode === 'auto') {
            const autoUpdatedSlide: Slide = {
              ...slide,
              color: nextColor,
              aiSuggestedForImageUri: slide.image,
            };

            if (
              autoUpdatedSlide.color !== slide.color ||
              autoUpdatedSlide.aiSuggestedForImageUri !== slide.aiSuggestedForImageUri
            ) {
              changed = true;
              return autoUpdatedSlide;
            }

            return slide;
          }

          const aiEffectResult = applyAiNeonGlowEffect(slide, suggestion);
          const syncedEffects = updateNeonGlowEffects(
            aiEffectResult.effects,
            slide.color,
            nextColor,
          );
          const nextFontFamily = randomFontOption
            ? resolveFontFamilyForPlatform(randomFontOption, platformKey)
            : slide.fontFamily;
          const nextFontWeight = randomFontOption
            ? randomFontOption.supportsWeightToggle
              ? slide.fontWeight
              : 'normal'
            : slide.fontWeight;
          const manualUpdatedSlide: Slide = {
            ...slide,
            color: nextColor,
            backgroundColor: suggestion.backgroundColor,
            textEffects: syncedEffects,
            aiSuggestedForImageUri: slide.image,
            aiEffectInstanceId: aiEffectResult.aiEffectInstanceId,
            aiDominantColor: suggestion.dominantColor,
            fontId: randomFontOption?.id ?? slide.fontId,
            fontFamily: nextFontFamily,
            fontWeight: nextFontWeight,
          };

          if (
            manualUpdatedSlide.color !== slide.color ||
            manualUpdatedSlide.backgroundColor !== slide.backgroundColor ||
            manualUpdatedSlide.aiSuggestedForImageUri !== slide.aiSuggestedForImageUri ||
            manualUpdatedSlide.aiEffectInstanceId !== slide.aiEffectInstanceId ||
            manualUpdatedSlide.aiDominantColor !== slide.aiDominantColor ||
            manualUpdatedSlide.fontId !== slide.fontId ||
            manualUpdatedSlide.fontFamily !== slide.fontFamily ||
            manualUpdatedSlide.fontWeight !== slide.fontWeight ||
            aiEffectResult.changed
          ) {
            changed = true;
            return manualUpdatedSlide;
          }

          return slide;
        });

        if (!changed) {
          return prevSlides;
        }

        addToHistory(nextSlides);
        return nextSlides;
      });

      setHasUnsavedChanges(true);
    },
    [
      addToHistory,
      applyAiNeonGlowEffect,
      updateNeonGlowEffects,
      isSlideEligibleForAutoAi,
      platformKey,
    ],
  );

  const handleApplyAiSuggestions = useCallback(async () => {
    FeedbackService.buttonTap();
    const slide = slidesRef.current[currentSlideIndex];
    if (!slide?.image) {
      Alert.alert(
        t('ai_no_image_title', { defaultValue: 'Add an Image' }),
        t('ai_no_image_body', {
          defaultValue: 'Upload an image first so AI can analyze it.',
        }),
      );
      return;
    }

    setAiApplying(true);
    try {
      const suggestion = await ColorAnalysisService.suggestStylesForImage(
        slide.image,
      );
      if (!suggestion) {
        Alert.alert(
          t('ai_failed_title', { defaultValue: 'AI Suggestion Failed' }),
          t('ai_failed_body', {
            defaultValue:
              'I could not analyze this image. Try a different image or try again.',
          }),
        );
        return;
      }

      const currentFontIdForRandom =
        slide.fontId === LEGACY_SYSTEM_FONT_ID
          ? DEFAULT_SLIDE_FONT_ID
          : slide.fontId ?? getSlideFontByFamily(slide.fontFamily).id;
      const randomFontOption = pickRandomFontOption(currentFontIdForRandom);
      const suggestions = new Map<number, AiStyleSuggestion>();
      suggestions.set(currentSlideIndex, suggestion);
      applyAiSuggestionsFromMap(suggestions, 'manual', randomFontOption);

      setStyleMenuVisible(false);
      setColorPaletteVisible(false);
      setOpacityPaletteVisible(false);
      setFontPaletteVisible(false);
      setEffectsPaletteVisible(false);
      setTextEffectsPanelVisible(false);
      setSelectedTextEffectId(null);
    } finally {
      setAiApplying(false);
    }
  }, [applyAiSuggestionsFromMap, currentSlideIndex, pickRandomFontOption, t]);

  useEffect(() => {
    if (isLoadingProject || isAutoAiRunningRef.current) {
      return;
    }

    const snapshot = slidesRef.current;
    const pending = snapshot
      .map((slide, index) => ({ slide, index }))
      .filter(({ slide }) => isSlideEligibleForAutoAi(slide));

    if (pending.length === 0) {
      return;
    }

    isAutoAiRunningRef.current = true;

    const runAutoAi = async () => {
      const suggestions = new Map<number, AiStyleSuggestion>();
      for (const { slide, index } of pending) {
        if (!slide.image) {
          continue;
        }
        const suggestion = await ColorAnalysisService.suggestStylesForImage(
          slide.image,
        );
        if (suggestion) {
          suggestions.set(index, suggestion);
        }
      }

      applyAiSuggestionsFromMap(suggestions, 'auto');
    };

    runAutoAi()
      .catch(error => {
        console.error('Auto AI suggestions failed:', error);
      })
      .finally(() => {
        isAutoAiRunningRef.current = false;
      });
  }, [slides, isLoadingProject, applyAiSuggestionsFromMap, isSlideEligibleForAutoAi]);

  // Safety check for currentSlide (must come after hooks)
  if (!currentSlide) {
    return (
      <View style={styles.container}>
        <Text style={styles.navButtonText}>{t('editor_no_slides')}</Text>
        <Text style={styles.navButtonSubtext}>
          {t('editor_check_input')}
        </Text>
      </View>
    );
  }

  const handleTextColorChange = (color: string) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = { ...newSlides[currentSlideIndex] };
      const oldTextColor = slide.color; // Store the old text color before we change it

      slide.color = color;
      slide.textEffects = updateNeonGlowEffects(
        slide.textEffects,
        oldTextColor,
        color,
      );

      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
    // Color picker closes after selection (single selection behavior)
    setColorPaletteVisible(false);
    setFontPaletteVisible(false);
    setTextEffectsPanelVisible(false);
    setSelectedTextEffectId(null);
  };

  const handleFontChange = (fontOption: SlideFontOption) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      const nextFontFamily = resolveFontFamilyForPlatform(
        fontOption,
        platformKey,
      );
      const updatedSlide = {
        ...slide,
        fontId: fontOption.id,
        fontFamily: nextFontFamily,
        fontWeight: fontOption.supportsWeightToggle
          ? slide.fontWeight
          : 'normal',
      };
      newSlides[currentSlideIndex] = updatedSlide;
      addToHistory(newSlides);
      return newSlides;
    });
    // Font picker stays open for multiple selections
    // setFontPaletteVisible(false);
    setColorPaletteVisible(false);
    setOpacityPaletteVisible(false);
    setTextEffectsPanelVisible(false);
    setSelectedTextEffectId(null);
    setHasUnsavedChanges(true);
  };

  const handleBackgroundOpacityChange = (opacity: number) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = { ...newSlides[currentSlideIndex] };
      slide.backgroundColor = `rgba(0,0,0,${opacity})`;
      newSlides[currentSlideIndex] = slide;
      addToHistory(newSlides);
      return newSlides;
    });
    // Opacity picker stays open for multiple selections
    setFontPaletteVisible(false);
    setColorPaletteVisible(false);
    setTextEffectsPanelVisible(false);
    setSelectedTextEffectId(null);
  };

  const handleAddTextEffect = (effectType: TextEffectType) => {
    FeedbackService.buttonTap();
    if (!isTextEffectSupported(effectType)) {
      Alert.alert(
        t('coming_soon'),
        t('effect_coming_soon'),
      );
      return;
    }
    let createdEffectId: string | null = null;
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      const instance = createTextEffectInstance(effectType,
        effectType === 'neonGlow' ? { glowColor: slide.color || '#FFFFFF' } : undefined);
      const updatedSlide: Slide = {
        ...slide,
        textEffects: [...(slide.textEffects ?? []), instance],
        // Set transparent background for bloom effects
        backgroundColor: effectType === 'bloom' ? 'rgba(0,0,0,0)' : slide.backgroundColor,
      };
      createdEffectId = instance.instanceId;
      newSlides[currentSlideIndex] = updatedSlide;
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
    if (createdEffectId) {
      setSelectedTextEffectId(createdEffectId);
      setTextEffectsPanelVisible(true);
    }
  };

  // Simple function for adding effects from carousel without opening complex panel
  const handleAddTextEffectSimple = (effectType: TextEffectType) => {
    FeedbackService.buttonTap();
    if (!isTextEffectSupported(effectType)) {
      Alert.alert(
        t('coming_soon'),
        t('effect_coming_soon'),
      );
      return;
    }
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      const instance = createTextEffectInstance(effectType,
        effectType === 'neonGlow' ? { glowColor: slide.color || '#FFFFFF' } : undefined);
      const updatedSlide: Slide = {
        ...slide,
        textEffects: [...(slide.textEffects ?? []), instance],
        // Set transparent background for bloom effects
        backgroundColor: effectType === 'bloom' ? 'rgba(0,0,0,0)' : slide.backgroundColor,
      };
      newSlides[currentSlideIndex] = updatedSlide;
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
    // Don't open the complex panel - just apply the effect
  };

  const handleToggleTextEffect = (instanceId: string) => {
    FeedbackService.buttonTap();
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      const updatedEffects = slide.textEffects?.map(effect =>
        effect.instanceId === instanceId
          ? { ...effect, enabled: !effect.enabled }
          : effect,
      );
      if (!updatedEffects) {
        return prevSlides;
      }
      const updatedSlide: Slide = { ...slide, textEffects: updatedEffects };
      newSlides[currentSlideIndex] = updatedSlide;
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
  };

  const handleRemoveTextEffect = (instanceId: string) => {
    FeedbackService.buttonTap();
    setSelectedTextEffectId(prevId => (prevId === instanceId ? null : prevId));
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide) {
        return prevSlides;
      }
      const updatedEffects = slide.textEffects?.filter(
        effect => effect.instanceId !== instanceId,
      );
      if (!updatedEffects) {
        return prevSlides;
      }
      const updatedSlide: Slide = { ...slide, textEffects: updatedEffects };
      newSlides[currentSlideIndex] = updatedSlide;
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
  };

  const handleSelectTextEffectsCategory = (category: TextEffectCategory) => {
    FeedbackService.buttonTap();
    setActiveTextEffectsCategory(category);
  };

  const handleEditTextEffect = (instanceId: string) => {
    FeedbackService.buttonTap();
    setSelectedTextEffectId(instanceId);
    setTextEffectsPanelVisible(true);
  };

  const handleChangeTextEffectParameter = (
    instanceId: string,
    parameterId: string,
    value: any,
  ) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = newSlides[currentSlideIndex];
      if (!slide || !slide.textEffects) {
        return prevSlides;
      }
      const updatedEffects = slide.textEffects.map(effect =>
        effect.instanceId === instanceId
          ? {
              ...effect,
              parameters: {
                ...effect.parameters,
                [parameterId]: value,
              },
            }
          : effect,
      );
      const updatedSlide: Slide = { ...slide, textEffects: updatedEffects };
      newSlides[currentSlideIndex] = updatedSlide;
      addToHistory(newSlides);
      return newSlides;
    });
    setHasUnsavedChanges(true);
  };

  const handlePreview = async () => {
    FeedbackService.buttonTap();

    // Save before preview
    await saveProject();

    // Mark project as completed
    const sanitizedSlidesForPersist = slides.map(slide => ({
      ...slide,
      textEffects: filterSupportedEffects(slide.textEffects),
    }));
    const projectState: ProjectState = {
      id: projectId,
      text,
      slides: sanitizedSlidesForPersist,
      images,
      lastModified: new Date().toISOString(),
      isCompleted: true,
    };
    await StorageService.saveCurrentProject(projectState);

    navigation.navigate('Preview', { slides });
  };

  // Show loading indicator while project is being loaded
  if (isLoadingProject || slides.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeDefinition.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={themeDefinition.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeDefinition.colors.background,
        },
      ]}
    >
      {/* Slide preview area */}
      <View style={styles.editorContainer}>
        <View
          style={[
            styles.slidePreview,
            { width: slideSize, height: imageContainerHeight },
          ]}
        >
          {currentSlide.image ? (
            <Image
              key={currentSlide.image}
              source={{ uri: currentSlide.image }}
              style={styles.imageBackground}
              resizeMode="contain"
              onError={error => {
                console.warn(
                  'Failed to load slide image',
                  currentSlide.image,
                  error.nativeEvent,
                );
              }}
            />
          ) : (
            currentSlide.backgroundGradient ? (
              <GradientBackground
                gradient={currentSlide.backgroundGradient}
                style={styles.plainBackground}
              />
            ) : (
              <View
                style={[
                  styles.plainBackground,
                  { backgroundColor: themeDefinition.colors.card },
                ]}
              />
            )
          )}

          <GestureDetector gesture={composed}>
            <Animated.View
              style={[
                styles.textOverlay,
                animatedStyle,
                {
                  backgroundColor: currentSlide.backgroundColor,
                  maxWidth: effectsActive ? undefined : overlayMaxWidth,
                  width: overlayWidth,
                  paddingHorizontal: overlayPaddingHorizontal,
                  paddingVertical: overlayPaddingVertical,
                  borderRadius: overlayBorderRadius,
                },
                isEditingText && styles.textOverlayEditing,
              ]}
            >
              {/* Render text effects using Skia if font is loaded and effects exist */}
              {skiaFont && newFormatEffects.length > 0 && !isEditingText ? (
                <EffectPipeline
                  text={currentSlide.text}
                  x={0}
                  baselineY={currentSlide.fontSize}
                  font={skiaFont}
                  width={effectCanvasWidth}
                  height={currentSlide.fontSize * 2}
                  textColor={currentSlide.color}
                  effects={newFormatEffects}
                  lineHeight={currentSlide.fontSize * 1.35}
                  background="transparent"
                />
              ) : (
                <>
                  {isEditingText ? (
                    <KeyboardAvoidingView behavior="padding" style={styles.textEditingContainer}>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            fontSize: currentSlide.fontSize,
                            color: '#000000',
                            textAlign: currentSlide.textAlign,
                            fontWeight: activeFontOption?.supportsWeightToggle
                              ? currentSlide.fontWeight
                              : undefined,
                            fontFamily: resolvedFontFamily,
                            lineHeight: currentSlide.fontSize * 1.35,
                          },
                        ]}
                        value={editingText}
                        onChangeText={setEditingText}
                        multiline
                        autoFocus
                        onBlur={handleFinishEditingText}
                        onSubmitEditing={handleFinishEditingText}
                        returnKeyType="done"
                      />
                      <View style={styles.textEditingButtons}>
                        <TouchableOpacity
                          style={[styles.editButton, styles.cancelButton]}
                          onPress={handleCancelEditingText}
                        >
                          <Text style={styles.editButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editButton, styles.saveButton]}
                          onPress={handleFinishEditingText}
                        >
                          <Text style={styles.editButtonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </KeyboardAvoidingView>
                  ) : (
                    <View
                      style={styles.textTouchableArea}
                    >
                      <View
                        style={styles.textEditTrigger}
                      >
                        {previewUnderlayElements.map((element, index) => {
                          const elementKey = element.key ?? `${activeFontId}-${index}`;
                          return React.cloneElement(element, {
                            key: elementKey,
                          });
                        })}
                        <Text
                          style={[
                            styles.slideText,
                            {
                              fontSize: currentSlide.fontSize,
                              color: currentSlide.color,
                              textAlign: currentSlide.textAlign,
                              fontWeight: activeFontOption?.supportsWeightToggle
                                ? currentSlide.fontWeight
                                : undefined,
                              fontFamily: resolvedFontFamily,
                              lineHeight: currentSlide.fontSize * 1.35,
                              // Add wrapping to prevent text from overflowing
                            },
                            previewEffects.textStyle,
                          ]}
                        >
                          {currentSlide.text}
                        </Text>
                        {previewOverlayElements.map((element, index) => {
                          const elementKey =
                            element.key ?? `${activeFontId}-overlay-${index}`;
                          return React.cloneElement(element, {
                            key: elementKey,
                          });
                        })}
                      </View>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          </GestureDetector>

          {/* Vertical font size slider on the left */}
          <GestureDetector gesture={sliderGesture}>
            <View
              style={[
                styles.fontSizeSlider,
                {
                  top: Math.max(scaleSize(10), (imageContainerHeight - SLIDER_HEIGHT) / 2),
                  width: scaleSize(50),
                  height: SLIDER_HEIGHT,
                  borderRadius: scaleSize(25),
                },
              ]}
            >
              <View style={[styles.sliderTrack, { width: scaleSize(8), height: SLIDER_HEIGHT }]}>
                <Animated.View style={[styles.sliderThumb, { width: scaleSize(24), height: scaleSize(24), borderRadius: scaleSize(12), left: -scaleSize(8) }, sliderThumbStyle]} />
              </View>
            </View>
          </GestureDetector>

          {/* Backdrop to close text editing when tapping outside */}
          {isEditingText && (
            <Pressable
              style={[StyleSheet.absoluteFill, styles.textEditingBackdrop]}
              onPress={handleFinishEditingText}
            />
          )}
        </View>
      </View>

      {anyToolPanelOpen && (
        <Pressable
          style={styles.toolPanelsBackdrop}
          onPress={() => {
            FeedbackService.buttonTap();
            closeToolPanels();
          }}
        />
      )}

      {/* Slide indicator */}
      {slides.length > 1 && (
        <View style={styles.slideIndicator}>
          <Text style={styles.slideIndicatorText}>
            {currentSlideIndex + 1} / {slides.length}
          </Text>
        </View>
      )}

      {/* Navigation arrows above the canvas */}
      {slides.length > 1 && (
        <View style={[styles.navigationAboveCanvas, { top: scaleSize(80) }]}>
          <TouchableOpacity
            style={[
              styles.navArrowBelow,
              { width: navArrowSize, height: navArrowSize, borderRadius: navArrowSize / 2 },
              currentSlideIndex === 0 && styles.navArrowDisabled,
            ]}
            onPress={() => {
              if (currentSlideIndex > 0) {
                FeedbackService.slideTransition();
                setCurrentSlideIndex(currentSlideIndex - 1);
              }
            }}
            disabled={currentSlideIndex === 0}
          >
            <Text style={[styles.navArrowText, { fontSize: scaleFont(32) }]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navArrowBelow,
              { width: navArrowSize, height: navArrowSize, borderRadius: navArrowSize / 2 },
              currentSlideIndex === slides.length - 1 &&
                styles.navArrowDisabled,
            ]}
            onPress={() => {
              if (currentSlideIndex < slides.length - 1) {
                FeedbackService.slideTransition();
                setCurrentSlideIndex(currentSlideIndex + 1);
              }
            }}
            disabled={currentSlideIndex === slides.length - 1}
          >
            <Text style={[styles.navArrowText, { fontSize: scaleFont(32) }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tool-specific palettes - positioned above main toolbar */}
      {(() => {
        // Adjust color and effects palette position to match spacing of font/opacity palettes
        const paletteTopPosition = (isColorPaletteVisible || isEffectsPaletteVisible)
          ? imageContainerHeight - 150  // Move color/effects palettes 20px higher
          : imageContainerHeight - 160; // Standard position for font/opacity

        return (
          <Animated.View
            style={[
              styles.toolPalette,
              { top: paletteTopPosition },
              toolPaletteAnimatedStyle,
            ]}
            pointerEvents={toolPaletteVisible ? 'auto' : 'none'}
          >
            {isColorPaletteVisible && (
              <ScrollView
                ref={colorPaletteScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorPaletteScrollContainer}
                contentContainerStyle={styles.colorPaletteContainer}
              >
                {COLOR_OPTIONS.map(color => {
                  const borderColor =
                    currentSlide?.color === color
                      ? '#FFFFFF'
                      : 'rgba(255,255,255,0.3)';
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        {
                          width: colorSwatchSize,
                          height: colorSwatchSize,
                          borderRadius: colorSwatchSize / 2,
                          marginHorizontal: scaleSize(4),
                          backgroundColor: color,
                          borderColor,
                        },
                      ]}
                      onPress={() => handleTextColorChange(color)}
                      onLayout={event => {
                        colorOptionPositions.current[color] =
                          event.nativeEvent.layout.x;
                        if (
                          isColorPaletteVisible &&
                          currentSlide?.color === color
                        ) {
                          ensureSelectedColorVisible();
                        }
                      }}
                    />
                  );
                })}
              </ScrollView>
            )}

            {isEffectsPaletteVisible && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.effectsPaletteScrollContainer}
                contentContainerStyle={styles.effectsPaletteContainer}
              >
                {/* Available effects in simple carousel format */}
                {Object.values(TEXT_EFFECT_DEFINITIONS)
                  .filter(
                    definition =>
                      definition.category === 'lighting' &&
                      isTextEffectSupported(definition.id),
                  )
                  .map(definition => {
                    const isActive = currentSlideEffects.some(
                      effect => effect.type === definition.id,
                    );
                    return (
                      <TouchableOpacity
                        key={definition.id}
                        style={[
                          styles.effectOptionButton,
                          isActive && styles.activeEffectOption,
                        ]}
                        onPress={() => {
                          if (isActive) {
                            // Remove effect if already active
                            const effectToRemove = currentSlideEffects.find(
                              effect => effect.type === definition.id,
                            );
                            if (effectToRemove) {
                              handleRemoveTextEffect(effectToRemove.instanceId);
                            }
                          } else {
                            // Add effect using simple function (no complex panel)
                            handleAddTextEffectSimple(definition.id);
                          }
                          // Effects palette stays open for multiple selections
                          // setEffectsPaletteVisible(false);
                        }}
                      >
                        <Text style={styles.effectOptionLabel}>
                          {definition.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            )}

            {isFontPaletteVisible && (
              <ScrollView
                ref={fontPaletteScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.fontPaletteScrollContainer}
                contentContainerStyle={styles.fontPaletteContainer}
              >
                {SLIDE_FONT_OPTIONS.map(option => {
                  const isActive = option.id === activeFontId;
                  const optionFontFamily = resolveFontFamilyForPlatform(
                    option,
                    platformKey,
                  );
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.fontOptionButton,
                        isActive && styles.activeFontOption,
                      ]}
                      onPress={() => handleFontChange(option)}
                      onLayout={event => {
                        fontOptionPositions.current[option.id] =
                          event.nativeEvent.layout.x;
                        if (isFontPaletteVisible && option.id === activeFontId) {
                          ensureSelectedFontVisible();
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.fontOptionSample,
                          optionFontFamily
                            ? { fontFamily: optionFontFamily }
                            : null,
                        ]}
                      >
                        {option.sample || 'Aa'}
                      </Text>
                      <Text style={styles.fontOptionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        );
      })()}

      {/* Opacity palette - positioned separately between canvas and tool panel */}
      <Animated.View
        style={[
          styles.opacityPaletteContainer,
          {
            position: 'absolute',
            top: imageContainerHeight - 130,
            left: 0,
            right: 0,
            justifyContent: 'center',
          },
          opacityPaletteAnimatedStyle,
        ]}
        pointerEvents={isOpacityPaletteVisible ? 'auto' : 'none'}
      >
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(opacity => {
            const currentOpacity = currentSlide?.backgroundColor
              ? parseFloat(
                  currentSlide.backgroundColor.split(',')[3]?.replace(')', '') || '0.5',
                )
              : 0.5;
            const borderColor =
              Math.abs(currentOpacity - opacity) < 0.01
                ? '#FFFFFF'
                : 'rgba(255,255,255,0.3)';
            return (
              <TouchableOpacity
                key={opacity}
                style={[
                  styles.opacityOption,
                  {
                    backgroundColor: `rgba(0,0,0,${opacity})`,
                    borderColor,
                  },
                ]}
                onPress={() => {
                  handleBackgroundOpacityChange(opacity);
                  // Opacity palette stays open for multiple selections
                  // setOpacityPaletteVisible(false);
                }}
              />
            );
          })}
      </Animated.View>

      {/* Main toolbar - always visible */}
      <View
        style={[styles.minimalControls, { top: imageContainerHeight - scaleSize(60), gap: controlGap }]}
      >
        {/* Always show main toolbar buttons */}
        {
          <>
            {/* Style menu */}
            <View style={[styles.styleMenuWrapper, { width: largeButtonSize, height: largeButtonSize }]}>
              <TouchableOpacity
                style={[
                  styles.styleMenuButton,
                  { width: largeButtonSize, height: largeButtonSize, borderRadius: largeButtonSize / 2 },
                  isStyleMenuVisible && styles.activeStyleMenuButton,
                ]}
                onPress={() => {
                  FeedbackService.buttonTap();
                  const willShow = !isStyleMenuVisible;
                  setStyleMenuVisible(willShow);
                  if (willShow) {
                    setColorPaletteVisible(false);
                    setOpacityPaletteVisible(false);
                    setFontPaletteVisible(false);
                    setEffectsPaletteVisible(false);
                    setTextEffectsPanelVisible(false);
                    setSelectedTextEffectId(null);
                  }
                }}
              >
                <Text style={[styles.styleMenuIcon, { fontSize: scaleFont(12) }]}>
                  {copiedStyle ? 'Style*' : 'Style'}
                </Text>
              </TouchableOpacity>

              {isStyleMenuVisible && (
                <View
                  style={[
                    styles.styleMenuDropdown,
                    { bottom: largeButtonSize + scaleSize(12) },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.styleMenuItem}
                    onPress={handleCopyStyleToAllSlides}
                  >
                    <Text style={styles.styleMenuItemText}>
                      Copy style to all slides
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.styleMenuDivider} />
                  <TouchableOpacity
                    style={styles.styleMenuItem}
                    onPress={handleCopyStyle}
                  >
                    <Text style={styles.styleMenuItemText}>Copy style</Text>
                  </TouchableOpacity>
                  {copiedStyle ? (
                    <>
                      <View style={styles.styleMenuDivider} />
                      <TouchableOpacity
                        style={styles.styleMenuItem}
                        onPress={handleApplyCopiedStyle}
                      >
                        <Text style={styles.styleMenuItemText}>
                          Apply copied style
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              )}
            </View>

            {/* AI suggestions */}
            <TouchableOpacity
              style={[
                styles.aiButton,
                {
                  width: largeButtonSize,
                  height: largeButtonSize,
                  borderRadius: largeButtonSize / 2,
                },
                isAiButtonActive && styles.activeAiButton,
                isAiButtonDisabled && styles.disabledAiButton,
              ]}
              onPress={handleApplyAiSuggestions}
              disabled={isAiButtonDisabled}
            >
              {isAiApplying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.aiButtonText, { fontSize: scaleFont(14) }]}>
                  AI
                </Text>
              )}
            </TouchableOpacity>

            {/* Color picker */}
            <TouchableOpacity
              style={[
                styles.colorPickerButton,
                { width: largeButtonSize, height: largeButtonSize, borderRadius: largeButtonSize / 2 },
                isColorPaletteVisible && styles.activeColorPickerButton,
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                setStyleMenuVisible(false);
                const willShow = !isColorPaletteVisible;
                setColorPaletteVisible(willShow);
                if (willShow) {
                  setOpacityPaletteVisible(false);
                  setFontPaletteVisible(false);
                  setEffectsPaletteVisible(false);
                  setTextEffectsPanelVisible(false);
                  setSelectedTextEffectId(null);
                }
              }}
            >
              <Image source={ColorPicker} style={[styles.colorWheel, { width: scaleSize(48), height: scaleSize(48) }]} />
            </TouchableOpacity>

            {/* Font picker */}
            <TouchableOpacity
              style={[
                styles.fontPickerButton,
                { width: largeButtonSize, height: largeButtonSize, borderRadius: largeButtonSize / 2 },
                isFontPaletteVisible && styles.activeFontPickerButton,
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                setStyleMenuVisible(false);
                const willShow = !isFontPaletteVisible;
                setFontPaletteVisible(willShow);
                if (willShow) {
                  setColorPaletteVisible(false);
                  setOpacityPaletteVisible(false);
                  setEffectsPaletteVisible(false);
                  setTextEffectsPanelVisible(false);
                  setSelectedTextEffectId(null);
                }
              }}
            >
              <Text style={[styles.fontPickerIcon, { fontSize: scaleFont(18) }]}>Aa</Text>
            </TouchableOpacity>

            {/* Text effects tool */}
            <TouchableOpacity
              style={[
                styles.textEffectsButton,
                { width: largeButtonSize, height: largeButtonSize, borderRadius: largeButtonSize / 2 },
                isEffectsPaletteVisible && styles.activeTextEffectsButton,
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                setStyleMenuVisible(false);
                const willShow = !isEffectsPaletteVisible;
                setEffectsPaletteVisible(willShow);
                if (willShow) {
                  setFontPaletteVisible(false);
                  setColorPaletteVisible(false);
                  setOpacityPaletteVisible(false);
                  setTextEffectsPanelVisible(false);
                  setSelectedTextEffectId(null);
                }
              }}
            >
              <Text style={[styles.textEffectsIcon, { fontSize: scaleFont(16) }]}>Fx</Text>
            </TouchableOpacity>

            {/* Background opacity picker */}
            <TouchableOpacity
              style={[
                styles.opacityButton,
                { width: largeButtonSize, height: largeButtonSize, borderRadius: largeButtonSize / 2 },
                isOpacityPaletteVisible && styles.activeOpacityButton,
              ]}
              onPress={() => {
                FeedbackService.buttonTap();
                setStyleMenuVisible(false);
                const willShow = !isOpacityPaletteVisible;
                setOpacityPaletteVisible(willShow);
                if (willShow) {
                  setColorPaletteVisible(false);
                  setFontPaletteVisible(false);
                  setEffectsPaletteVisible(false);
                  setTextEffectsPanelVisible(false);
                  setSelectedTextEffectId(null);
                }
              }}
            >
              <Text style={[styles.opacityIcon, { fontSize: scaleFont(18) }]}>◐</Text>
            </TouchableOpacity>
          </>
        }
      </View>

      {/* Text Effects Panel - positioned to avoid Preview button overlap */}
      {isTextEffectsPanelVisible && (
        <View style={styles.textEffectsPanelContainer}>
          <View style={styles.textEffectsStack}>
            <TextEffectsPanel
              activeCategory={activeTextEffectsCategory}
              onSelectCategory={handleSelectTextEffectsCategory}
              onAddEffect={handleAddTextEffect}
              onToggleEffect={handleToggleTextEffect}
              onRemoveEffect={handleRemoveTextEffect}
              currentEffects={currentSlideEffects}
              onEditEffect={handleEditTextEffect}
              selectedEffectId={selectedTextEffectId}
            />
            {selectedTextEffect && selectedTextEffectDefinition ? (
              <TextEffectParameterEditor
                effect={selectedTextEffect}
                definition={selectedTextEffectDefinition}
                onChangeParameter={(parameterId, value) =>
                  handleChangeTextEffectParameter(
                    selectedTextEffect.instanceId,
                    parameterId,
                    value,
                  )
                }
                onClose={() => setSelectedTextEffectId(null)}
              />
            ) : null}
          </View>
        </View>
      )}

      {/* Preview button */}
      <TouchableOpacity style={[styles.previewButton, { paddingVertical: scaleSize(15), marginHorizontal: responsivePadding }]} onPress={handlePreview}>
        <Text style={[styles.previewButtonText, { fontSize: scaleFont(18) }]}>{t('editor_preview')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  slidePreview: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
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
    position: 'absolute',
    top: 0,
    left: 0,
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
  textOverlayEditing: {
    zIndex: 1001,
    elevation: 1001,
  },
  textEditingBackdrop: {
    zIndex: 1000,
  },
  slideText: {
    color: '#fff',
    fontWeight: 'bold',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  // Navigation arrows above canvas
  navigationAboveCanvas: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 20,
  },
  navArrowBelow: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navArrowText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  slideIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 20,
  },
  slideIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toolPanelsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 6,
  },
  // Vertical font size slider
  fontSizeSlider: {
    position: 'absolute',
    left: 10,
    width: 50, // Base width, overridden by inline styles
    height: 200, // Base height, overridden by inline styles
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 25,
    zIndex: 5,
  },
  sliderTrack: {
    width: 8, // Base width, overridden by inline styles
    height: 200, // Base height, overridden by inline styles
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 4,
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    width: 24, // Slightly larger for better touch target
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    left: -8, // Adjusted for wider track
  },

  // Tool palette positioned above main toolbar
  toolPalette: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 10,
    zIndex: 10,
  },

  // Minimalistic bottom controls
  minimalControls: {
    position: 'absolute',
    top: 360, // Position right under the slide preview (350 + 20)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },

  // Alignment controls
  alignmentControls: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  alignmentButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  activeAlignmentButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  alignmentIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
  activeAlignmentIcon: {
    color: '#FFFFFF',
  },

  // Style menu
  styleMenuWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeStyleMenuButton: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  styleMenuIcon: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  styleMenuDropdown: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 180,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  styleMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  styleMenuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  styleMenuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },

  // AI button
  aiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeAiButton: {
    borderColor: '#34C759',
    borderWidth: 2,
  },
  disabledAiButton: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Color picker
  colorPickerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeColorPickerButton: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  colorWheel: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  // Font picker button
  fontPickerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeFontPickerButton: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  fontPickerIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Text effects button
  textEffectsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeTextEffectsButton: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  textEffectsIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Opacity button
  opacityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeOpacityButton: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  opacityIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  colorPaletteScrollContainer: {
    maxWidth: '100%',
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fontPaletteScrollContainer: {
    maxWidth: '100%',
  },
  fontPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  effectsPaletteScrollContainer: {
    maxWidth: '100%',
  },
  effectsPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  effectOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
    alignItems: 'center',
    minWidth: 80,
    minHeight: 50,
  },
  activeEffectOption: {
    borderColor: '#00FFCC',
    backgroundColor: 'rgba(0,255,204,0.15)',
  },
  effectOptionLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 4,
  },
  textEffectsPanelContainer: {
    position: 'absolute',
    bottom: 100, // Position above the Preview button (which has ~80px height + margins)
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure it appears above other elements
  },
  textEffectsStack: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  fontOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
    alignItems: 'center',
    minWidth: 80,
  },
  activeFontOption: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fontOptionSample: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  fontOptionLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
  opacityPaletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  opacityOption: {
    width: 40,
    height: 48,
    borderRadius: 20,
    borderWidth: 2,
    marginHorizontal: 5,
  },
  previewButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  navButtonSubtext: {
    fontSize: 16,
    marginTop: 10,
    color: '#fff',
    textAlign: 'center',
  },

  // Text editing styles
  textEditingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 12,
    minWidth: '80%',
    maxWidth: '90%',
    textAlignVertical: 'top',
  },
  textEditingButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textTouchableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },
  textEditTrigger: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },
});

export default EditorScreen;
