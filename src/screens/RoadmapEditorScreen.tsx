import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
  Animated,
  LayoutAnimation,
  UIManager,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { useResponsive } from '../hooks/useResponsive';
import { getRoadmapTemplateById } from '../constants/roadmapTemplates';
import { getRoadmapImageBackedTemplateConfig } from '../constants/roadmapTemplateAssets';
import { ROADMAP_BACKGROUND_OPTIONS } from '../constants/gradients';
import { SkiaRoadmapRenderer } from '../components/roadmap';
import {
  createRoadmapProject,
  createDefaultCarouselData,
  RoadmapSlide,
  RoadmapCircleContent,
  CornerImage,
  CornerPosition,
  CarouselCoverContent,
  CarouselStepContent,
  CarouselData,
} from '../types/roadmap';
import type { SlideBackgroundGradient } from '../services/StorageService';
import GradientBackground from '../components/GradientBackground';
import ImageService from '../services/ImageService';
import StorageService from '../services/StorageService';

const COLOR_OPTIONS = [
  '#F5D547', // Default yellow
  '#FFFFFF',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

const CAROUSEL_COLOR_OPTIONS = [
  '#2E4BFF',
  '#FF6B6B',
  '#4ECDC4',
  '#F5D547',
  '#45B7D1',
  '#96CEB4',
  '#DDA0DD',
  '#FF8C00',
  '#00C853',
  '#E91E63',
];

const BUBBLE_TIMELINE_COLOR_OPTIONS = [
  '#C6A574',
  '#6F9E62',
  '#4B79A6',
  '#B9494D',
  '#F28F29',
  '#5B8FCA',
  '#7C6BC9',
  '#32A6BC',
];

type RootStackParamList = {
  RoadmapEditor: {
    projectId: string;
    templateId?: string;
    backgroundGradient?: SlideBackgroundGradient;
    backgroundImageUri?: string;
  };
  Preview: { slides: any[]; projectType: 'roadmap' };
  Home: undefined;
};

type RoadmapEditorRouteProp = RouteProp<RootStackParamList, 'RoadmapEditor'>;
type RoadmapEditorNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

const RoadmapEditorScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapEditorNavigationProp>();
  const route = useRoute<RoadmapEditorRouteProp>();
  const {
    projectId,
    templateId: routeTemplateId,
    backgroundGradient: routeBackground,
    backgroundImageUri: routeBackgroundImageUri,
  } = route.params;
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // State
  const [templateId] = useState(routeTemplateId || 'grid_4_circles');
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [selectedPanelIndex, setSelectedPanelIndex] = useState(0);
  const [slide, setSlide] = useState<RoadmapSlide | null>(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [percentageSelection, setPercentageSelection] = useState({ start: 0, end: 0 });
  const backgroundAccordionAnim = useRef(new Animated.Value(0)).current;
  const initialSlideSnapshotRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);

  const isCarouselTemplate = templateId === 'carousel';

  const template = useMemo(() => getRoadmapTemplateById(templateId), [templateId]);
  const imageTemplateConfig = useMemo(
    () => getRoadmapImageBackedTemplateConfig(templateId),
    [templateId],
  );
  const isImageBackedTemplate = Boolean(imageTemplateConfig);
  const isFigureEightTemplate = templateId === 'grid_4_circles';
  const isInfinityLoopTemplate = templateId === 'diagonal_3_circles';
  const isThreeCirclesImageTemplate = templateId === 'template_3_circles';
  const isHorizontalLoopTemplate = templateId === 'winding_5_road';
  const isLinearChainTemplate = templateId === 'linear_4_chain';
  const isBubbleTimelineTemplate = templateId === 'bubble_timeline_6';
  const isRibbonStepsTemplate = templateId === 'ribbon_steps_3';
  const supportsSecondaryText =
    isFigureEightTemplate ||
    isInfinityLoopTemplate ||
    isBubbleTimelineTemplate ||
    isRibbonStepsTemplate;

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Initialize slide once: restore from saved roadmap project by id, fallback to new.
  useEffect(() => {
    let cancelled = false;
    if (!template || slide) return;

    const init = async () => {
      try {
        const [currentRoadmap, recentRoadmaps] = await Promise.all([
          StorageService.loadCurrentRoadmapProject(),
          StorageService.getRecentRoadmapProjects(),
        ]);
        const restored =
          (currentRoadmap && currentRoadmap.id === projectId ? currentRoadmap : null) ||
          recentRoadmaps.find((p: any) => p?.id === projectId) ||
          null;

        if (cancelled) return;

        if (restored?.slide) {
          setSlide(restored.slide);
          const restoredSnapshot = JSON.stringify(restored.slide);
          initialSlideSnapshotRef.current = restoredSnapshot;
          lastSavedSnapshotRef.current = restoredSnapshot;
          return;
        }
      } catch (error) {
        console.error('Error restoring roadmap project:', error);
      }

      const project = createRoadmapProject(template, projectId);
      const initialSlide: RoadmapSlide = {
        ...project.slide,
        backgroundType: routeBackgroundImageUri ? 'image' : 'gradient',
        backgroundGradient: routeBackground || ROADMAP_BACKGROUND_OPTIONS[0],
        backgroundImageUri: routeBackgroundImageUri,
        ...(isCarouselTemplate ? { carouselData: createDefaultCarouselData(3) } : {}),
      };

      if (cancelled) return;
      setSlide(initialSlide);

      // Persist the new project immediately so it appears on HomeScreen
      const projectToSave = {
        id: projectId,
        type: 'roadmap' as const,
        name: template.name,
        templateId: initialSlide.templateId,
        slide: initialSlide,
        lastModified: new Date().toISOString(),
        isCompleted: false,
      };
      StorageService.saveCurrentRoadmapProject(projectToSave).catch(error => {
        console.error('Error saving initial roadmap project:', error);
      });

      initialSlideSnapshotRef.current = JSON.stringify(initialSlide);
      lastSavedSnapshotRef.current = initialSlideSnapshotRef.current;
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [isCarouselTemplate, projectId, routeBackground, routeBackgroundImageUri, template, slide]);

  // Build a project object for saving to storage.
  const buildProjectToSave = useCallback(
    (overrides: { isCompleted?: boolean } = {}) => {
      if (!slide || !template) return null;
      return {
        id: projectId,
        type: 'roadmap' as const,
        name: template.name,
        templateId: slide.templateId,
        slide,
        lastModified: new Date().toISOString(),
        isCompleted: overrides.isCompleted ?? false,
      };
    },
    [projectId, slide, template],
  );

  // Autosave roadmap project after any edit (background/text/colors/etc).
  useEffect(() => {
    if (!slide || !template) return;
    const snapshot = JSON.stringify(slide);
    if (!initialSlideSnapshotRef.current) return;
    if (snapshot === initialSlideSnapshotRef.current) return;
    if (snapshot === lastSavedSnapshotRef.current) return;

    const timeout = setTimeout(() => {
      const projectToSave = buildProjectToSave();
      if (!projectToSave) return;
      StorageService.saveCurrentRoadmapProject(projectToSave).catch(error => {
        console.error('Error autosaving roadmap project:', error);
      });
      lastSavedSnapshotRef.current = snapshot;
    }, 180);

    return () => clearTimeout(timeout);
  }, [projectId, slide, template, buildProjectToSave]);

  // Save project when navigating away (e.g. back button)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const projectToSave = buildProjectToSave();
      if (!projectToSave) return;
      StorageService.saveCurrentRoadmapProject(projectToSave).catch(error => {
        console.error('Error saving roadmap project on navigate away:', error);
      });
    });
    return unsubscribe;
  }, [navigation, buildProjectToSave]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('roadmap_editor_title') || 'Edit Roadmap',
      headerBackTitle: t('back'),
    });
  }, [navigation, t]);

  // Get currently selected circle content
  const selectedCircleContent = useMemo(() => {
    if (!slide || !selectedCircleId) return null;
    return slide.circles.find(c => c.circleId === selectedCircleId);
  }, [slide, selectedCircleId]);

  const selectedBubbleTitle = useMemo(() => {
    if (!selectedCircleContent) return '';
    if (selectedCircleContent.title) return selectedCircleContent.title;
    const raw = selectedCircleContent.text?.trim() || '';
    if (!raw.includes('\n')) return '';
    const [firstLine] = raw.split('\n');
    return /^\d{4}$/.test(firstLine.trim()) ? firstLine.trim() : '';
  }, [selectedCircleContent]);

  const selectedBubbleDescription = useMemo(() => {
    if (!selectedCircleContent) return '';
    const raw = selectedCircleContent.text || '';
    if (selectedCircleContent.title) return raw;
    const trimmed = raw.trim();
    if (!trimmed.includes('\n')) return raw;
    const [firstLine, ...rest] = trimmed.split('\n');
    if (/^\d{4}$/.test(firstLine.trim())) {
      return rest.join('\n').trim();
    }
    return raw;
  }, [selectedCircleContent]);

  useEffect(() => {
    if (!isBubbleTimelineTemplate || !slide) return;
    if (!slide.circles.length) return;
    const exists = selectedCircleId
      ? slide.circles.some(c => c.circleId === selectedCircleId)
      : false;
    if (!exists) {
      setSelectedCircleId(slide.circles[0].circleId);
    }
  }, [isBubbleTimelineTemplate, selectedCircleId, slide]);

  useEffect(() => {
    if (!isBubbleTimelineTemplate || !selectedCircleContent) return;
    const cursor = Math.max(0, selectedCircleContent.label.length - 1);
    setPercentageSelection({ start: cursor, end: cursor });
  }, [isBubbleTimelineTemplate, selectedCircleContent]);

  // Handle circle tap
  const handleCircleTap = useCallback((circleId: string) => {
    FeedbackService.buttonTap();
    setSelectedCircleId(prev => (prev === circleId ? null : circleId));
  }, []);

  // Handle panel tap
  const handlePanelTap = useCallback((panelIndex: number) => {
    FeedbackService.buttonTap();
    setSelectedPanelIndex(panelIndex);
  }, []);

  // Update circle content
  const updateCircleContent = useCallback(
    (circleId: string, updates: Partial<RoadmapCircleContent>) => {
      if (!slide) return;
      setSlide(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          circles: prev.circles.map(c =>
            c.circleId === circleId ? { ...c, ...updates } : c
          ),
        };
      });
    },
    [slide]
  );

  // Handle label change
  const handleLabelChange = useCallback(
    (text: string) => {
      if (selectedCircleId) {
        if (isBubbleTimelineTemplate) {
          const digitsOnly = text.replace(/[^\d]/g, '').slice(0, 3);
          const numeric = Math.max(0, Math.min(100, Number(digitsOnly || '0')));
          const normalized = `${numeric}%`;
          updateCircleContent(selectedCircleId, { label: normalized });
          const cursor = normalized.length - 1;
          setPercentageSelection({ start: cursor, end: cursor });
          return;
        }
        updateCircleContent(selectedCircleId, { label: text });
      }
    },
    [isBubbleTimelineTemplate, selectedCircleId, updateCircleContent]
  );

  const handlePercentageSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      if (!isBubbleTimelineTemplate || !selectedCircleContent) return;
      const maxPos = Math.max(0, selectedCircleContent.label.length - 1);
      const nextStart = Math.min(event.nativeEvent.selection.start, maxPos);
      const nextEnd = Math.min(event.nativeEvent.selection.end, maxPos);
      if (
        nextStart !== event.nativeEvent.selection.start ||
        nextEnd !== event.nativeEvent.selection.end
      ) {
        setPercentageSelection({ start: nextStart, end: nextEnd });
        return;
      }
      setPercentageSelection({ start: nextStart, end: nextEnd });
    },
    [isBubbleTimelineTemplate, selectedCircleContent],
  );

  // Handle content text change
  const handleContentTextChange = useCallback(
    (text: string) => {
      if (selectedCircleId) {
        updateCircleContent(selectedCircleId, {
          contentType: 'text',
          text,
          imageUri: undefined,
        });
      }
    },
    [selectedCircleId, updateCircleContent]
  );

  const handleBubbleTitleChange = useCallback((title: string) => {
    if (!selectedCircleId) return;
    updateCircleContent(selectedCircleId, { title });
  }, [selectedCircleId, updateCircleContent]);

  const handleBubbleDescriptionChange = useCallback((text: string) => {
    if (!selectedCircleId) return;
    updateCircleContent(selectedCircleId, {
      contentType: 'text',
      text,
      imageUri: undefined,
    });
  }, [selectedCircleId, updateCircleContent]);

  const handleBubbleCountChange = useCallback((nextCount: number) => {
    setSlide(prev => {
      if (!prev) return prev;
      const count = Math.max(2, Math.min(5, nextCount));
      const current = prev.circles;
      if (current.length === count) return prev;

      const percentages = ['61%', '48%', '3%', '8%', '54%'];
      const years = ['2012', '2013', '2014', '2015', '2016'];
      const colors = ['#C6A574', '#6F9E62', '#4B79A6', '#B9494D', '#F28F29'];

      const nextCircles: RoadmapCircleContent[] = Array.from({ length: count }, (_, index) => {
        const existing = current[index];
        if (existing) return existing;
        return {
          circleId: `c${index + 1}`,
          label: percentages[index] || `${index + 1}%`,
          title: years[index] || String(2012 + index),
          contentType: 'text',
          text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
          textStyle: { fontSize: 14, color: colors[index % colors.length] },
        };
      });

      return { ...prev, circles: nextCircles };
    });
  }, []);

  const handleBubbleColorChange = useCallback((color: string) => {
    if (!selectedCircleId) return;
    updateCircleContent(selectedCircleId, {
      textStyle: {
        ...(selectedCircleContent?.textStyle || { fontSize: 14 }),
        color,
      },
    });
  }, [selectedCircleContent?.textStyle, selectedCircleId, updateCircleContent]);

  // Handle image selection for circle
  const handleSelectCircleImage = useCallback(async () => {
    if (!selectedCircleId) return;
    try {
      const imageUri = await ImageService.pickFromGallery(t);
      if (imageUri) {
        updateCircleContent(selectedCircleId, {
          contentType: 'image',
          imageUri,
          text: undefined,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, [selectedCircleId, updateCircleContent, t]);

  // Carousel update helpers
  const updateCarouselCover = useCallback((updates: Partial<CarouselCoverContent>) => {
    setSlide(prev => {
      if (!prev?.carouselData) return prev;
      return {
        ...prev,
        carouselData: {
          ...prev.carouselData,
          cover: { ...prev.carouselData.cover, ...updates },
        },
      };
    });
  }, []);

  const updateCarouselStep = useCallback((stepIdx: number, updates: Partial<CarouselStepContent>) => {
    setSlide(prev => {
      if (!prev?.carouselData) return prev;
      const newSteps = prev.carouselData.steps.map((s, i) =>
        i === stepIdx ? { ...s, ...updates } : s
      );
      return { ...prev, carouselData: { ...prev.carouselData, steps: newSteps } };
    });
  }, []);

  const updateCarouselStyle = useCallback((updates: Partial<Omit<CarouselData, 'cover' | 'steps'>>) => {
    setSlide(prev => {
      if (!prev?.carouselData) return prev;
      return { ...prev, carouselData: { ...prev.carouselData, ...updates } };
    });
  }, []);

  const handlePanelCountChange = useCallback((delta: -1 | 1) => {
    FeedbackService.buttonTap();
    setSlide(prev => {
      if (!prev?.carouselData) return prev;
      const cd = prev.carouselData;
      const newCount = Math.max(2, Math.min(5, cd.panelCount + delta));
      if (newCount === cd.panelCount) return prev;

      let newSteps = [...cd.steps];
      if (delta === 1) {
        newSteps.push({
          titlePart1: 'Define Your',
          titleHighlight: `Step ${newCount - 1}`,
          description: 'Add your description here to explain this step in detail.',
        });
      } else {
        newSteps = newSteps.slice(0, newCount - 1);
        if (selectedPanelIndex >= newCount) {
          setSelectedPanelIndex(newCount - 1);
        }
      }
      return { ...prev, carouselData: { ...cd, panelCount: newCount, steps: newSteps } };
    });
  }, [selectedPanelIndex]);

  // Handle image selection for carousel
  const handleSelectCarouselMainImage = useCallback(async () => {
    try {
      const imageUri = await ImageService.pickFromGallery(t);
      if (imageUri) updateCarouselCover({ mainImageUri: imageUri });
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, [updateCarouselCover, t]);

  const handleSelectCarouselAvatar = useCallback(async () => {
    try {
      const imageUri = await ImageService.pickFromGallery(t);
      if (imageUri) updateCarouselCover({ authorAvatarUri: imageUri });
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, [updateCarouselCover, t]);

  // Handle background change
  const handleBackgroundChange = useCallback((gradient: SlideBackgroundGradient) => {
    FeedbackService.buttonTap();
    setSlide(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        backgroundType: 'gradient',
        backgroundGradient: gradient,
        backgroundImageUri: undefined,
      };
    });
    setShowBackgroundPicker(false);
  }, []);

  const handleBackgroundImageChange = useCallback(async () => {
    try {
      const imageUri = await ImageService.pickFromGallery(t);
      if (!imageUri) return;
      FeedbackService.buttonTap();
      setSlide(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          backgroundType: 'image',
          backgroundImageUri: imageUri,
        };
      });
      setShowBackgroundPicker(false);
    } catch (error) {
      console.error('Error picking background image:', error);
    }
  }, [t]);

  const handleToggleBackgroundPicker = useCallback(() => {
    FeedbackService.buttonTap();
    const toValue = showBackgroundPicker ? 0 : 1;

    LayoutAnimation.configureNext({
      duration: 320,
      create: {
        type: 'easeInEaseOut',
        property: 'opacity',
      },
      update: {
        type: 'spring',
        springDamping: 0.78,
      },
      delete: {
        type: 'easeInEaseOut',
        property: 'opacity',
      },
    });

    Animated.spring(backgroundAccordionAnim, {
      toValue,
      velocity: showBackgroundPicker ? -3 : 3,
      damping: 18,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    setShowBackgroundPicker(prev => !prev);
  }, [backgroundAccordionAnim, showBackgroundPicker]);

  // Handle stroke color change
  const handleStrokeColorChange = useCallback((color: string) => {
    FeedbackService.buttonTap();
    setSlide(prev => {
      if (!prev) return prev;
      return { ...prev, strokeColor: color };
    });
  }, []);

  // Handle corner image
  const handleAddCornerImage = useCallback(async (position: CornerPosition) => {
    try {
      const imageUri = await ImageService.pickFromGallery(t);
      if (imageUri && slide) {
        const newCornerImage: CornerImage = {
          position,
          imageUri,
          size: 0.1,
          padding: 0.02,
        };
        setSlide(prev => {
          if (!prev) return prev;
          // Remove existing corner image at this position
          const filtered = prev.cornerImages.filter(c => c.position !== position);
          return {
            ...prev,
            cornerImages: [...filtered, newCornerImage],
          };
        });
      }
    } catch (error) {
      console.error('Error picking corner image:', error);
    }
  }, [slide, t]);

  // Handle preview
  const handlePreview = useCallback(async () => {
    if (!slide) return;
    FeedbackService.buttonTap();

    // Save project as completed before navigating to preview
    const projectToSave = buildProjectToSave({ isCompleted: true });
    if (projectToSave) {
      await StorageService.saveCurrentRoadmapProject(projectToSave);
      lastSavedSnapshotRef.current = JSON.stringify(slide);
    }

    navigation.navigate('Preview', {
      slides: [slide],
      projectType: 'roadmap',
    });
  }, [slide, navigation, buildProjectToSave]);

  const horizontalContentPadding = scale(16);
  const previewWidth = width;
  const previewHeight = isCarouselTemplate && slide?.carouselData
    ? previewWidth / (slide.carouselData.panelCount * 0.69)
    : isBubbleTimelineTemplate
      ? previewWidth * (2 / 3)
    : imageTemplateConfig
      ? previewWidth * (imageTemplateConfig.originalHeight / imageTemplateConfig.originalWidth)
      : previewWidth * 1.2;

  const circleLabelInputLabel = isLinearChainTemplate
    ? 'Text Under Arrow'
    : isBubbleTimelineTemplate
      ? 'Percentage'
      : isRibbonStepsTemplate
        ? 'Step Label'
    : isHorizontalLoopTemplate
      ? 'Zone Text'
      : supportsSecondaryText
        ? 'Heading'
        : t('roadmap_label') || 'Label';

  const circleLabelPlaceholder = isHorizontalLoopTemplate
    ? 'Zone text...'
    : isBubbleTimelineTemplate
      ? '61%'
      : isRibbonStepsTemplate
        ? 'STEP 01'
    : supportsSecondaryText
      ? 'Infographic 01'
      : 'Step 1';

  if (!template || !slide) {
    return null;
  }

  const accordionChevronRotation = backgroundAccordionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const cd = slide.carouselData;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalContentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Canvas Preview */}
        <View
          style={[
            styles.previewContainer,
            {
              width: previewWidth,
              height: previewHeight,
              borderRadius: scale(12),
              borderColor: themeDefinition.colors.border,
              marginTop: scale(16),
              marginHorizontal: -horizontalContentPadding,
            },
          ]}
        >
          <SkiaRoadmapRenderer
            slide={slide}
            style={[styles.preview, { borderRadius: scale(12) }]}
            selectedCircleId={isCarouselTemplate ? null : selectedCircleId}
            onCircleTap={isCarouselTemplate ? undefined : handleCircleTap}
            selectedPanelIndex={isCarouselTemplate ? selectedPanelIndex : undefined}
            onPanelTap={isCarouselTemplate ? handlePanelTap : undefined}
          />
        </View>

        {/* Panel tabs (carousel) or circle tabs (other templates) */}
        {isCarouselTemplate && cd ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.circleTabs, { marginTop: scale(16) }]}
            contentContainerStyle={styles.circleTabsContent}
          >
            {Array.from({ length: cd.panelCount }, (_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.circleTab,
                  {
                    backgroundColor: selectedPanelIndex === i ? '#007AFF' : themeDefinition.colors.card,
                    borderColor: selectedPanelIndex === i ? '#007AFF' : themeDefinition.colors.border,
                    paddingHorizontal: scale(16),
                    paddingVertical: scale(8),
                    marginRight: scale(8),
                  },
                ]}
                onPress={() => { FeedbackService.buttonTap(); setSelectedPanelIndex(i); }}
              >
                <Text
                  style={[
                    styles.circleTabText,
                    {
                      color: selectedPanelIndex === i ? '#FFFFFF' : themeDefinition.colors.text,
                      fontSize: scaleFont(14),
                    },
                  ]}
                >
                  {i === 0 ? 'Cover' : `Step ${i}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.circleTabs, { marginTop: scale(16) }]}
            contentContainerStyle={styles.circleTabsContent}
          >
            {(isBubbleTimelineTemplate
              ? slide.circles.map(c => ({ id: c.circleId }))
              : template.circles.map(c => ({ id: c.id }))).map((circle, index) => {
              const content = slide.circles.find(c => c.circleId === circle.id);
              const chipLabel = content?.label
                ? (isRibbonStepsTemplate ? content.label.replace(/\s+/g, ' ').trim() : content.label)
                : `Step ${index + 1}`;
              return (
                <TouchableOpacity
                  key={circle.id}
                  style={[
                    styles.circleTab,
                    {
                      backgroundColor:
                        selectedCircleId === circle.id
                          ? '#007AFF'
                          : themeDefinition.colors.card,
                      borderColor:
                        selectedCircleId === circle.id
                          ? '#007AFF'
                          : themeDefinition.colors.border,
                      paddingHorizontal: scale(16),
                      paddingVertical: scale(8),
                      marginRight: scale(8),
                    },
                  ]}
                  onPress={() => handleCircleTap(circle.id)}
                >
                  <Text
                    style={[
                      styles.circleTabText,
                      {
                        color:
                          selectedCircleId === circle.id
                            ? '#FFFFFF'
                            : themeDefinition.colors.text,
                        fontSize: scaleFont(14),
                      },
                    ]}
                  >
                    {chipLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Carousel panel content editor */}
        {isCarouselTemplate && cd && (
          <View
            style={[
              styles.editSection,
              {
                backgroundColor: themeDefinition.colors.card,
                borderColor: themeDefinition.colors.border,
                padding: scale(16),
                marginTop: scale(16),
                borderRadius: scale(12),
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: themeDefinition.colors.text, fontSize: scaleFont(16), marginBottom: scale(12) },
              ]}
            >
              {selectedPanelIndex === 0 ? 'Cover Panel' : `Step ${selectedPanelIndex}`}
            </Text>

            {selectedPanelIndex === 0 ? (
              /* Cover panel fields */
              <>
                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Subtitle</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.cover.subtitle}
                  onChangeText={text => updateCarouselCover({ subtitle: text })}
                  placeholder="Learn how to..."
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Title Line 1</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.cover.titlePart1}
                  onChangeText={text => updateCarouselCover({ titlePart1: text })}
                  placeholder="Unlock Your"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Title Line 2</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.cover.titlePart2}
                  onChangeText={text => updateCarouselCover({ titlePart2: text })}
                  placeholder="Entrepreneurial"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Title Line 3 (Highlight Color)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.cover.titleHighlight}
                  onChangeText={text => updateCarouselCover({ titleHighlight: text })}
                  placeholder="Potential"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Description</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12), minHeight: scale(72) }]}
                  value={cd.cover.description}
                  onChangeText={text => updateCarouselCover({ description: text })}
                  placeholder="Description text..."
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                  multiline
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Button Text</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.cover.buttonText}
                  onChangeText={text => updateCarouselCover({ buttonText: text })}
                  placeholder="Swipe >"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Author Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.cover.authorName}
                  onChangeText={text => updateCarouselCover({ authorName: text })}
                  placeholder="Your Name"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Author Title</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(16) }]}
                  value={cd.cover.authorTitle}
                  onChangeText={text => updateCarouselCover({ authorTitle: text })}
                  placeholder="Your Title"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                {/* Image pickers */}
                <View style={styles.imagePickersRow}>
                  <TouchableOpacity
                    style={[styles.imagePickerButton, { backgroundColor: themeDefinition.colors.background, borderColor: themeDefinition.colors.border }]}
                    onPress={handleSelectCarouselMainImage}
                  >
                    {cd.cover.mainImageUri ? (
                      <Image source={{ uri: cd.cover.mainImageUri }} style={styles.imagePickerPreview} />
                    ) : (
                      <Text style={[styles.imagePickerText, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(11) }]}>+ Main Image</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imagePickerButton, { backgroundColor: themeDefinition.colors.background, borderColor: themeDefinition.colors.border }]}
                    onPress={handleSelectCarouselAvatar}
                  >
                    {cd.cover.authorAvatarUri ? (
                      <Image source={{ uri: cd.cover.authorAvatarUri }} style={[styles.imagePickerPreview, { borderRadius: 40 }]} />
                    ) : (
                      <Text style={[styles.imagePickerText, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(11) }]}>+ Author Avatar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Step panel fields */
              <>
                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Title Part 1</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.steps[selectedPanelIndex - 1]?.titlePart1 || ''}
                  onChangeText={text => updateCarouselStep(selectedPanelIndex - 1, { titlePart1: text })}
                  placeholder="Define Your"
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Highlighted Word (Accent Color)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(12) }]}
                  value={cd.steps[selectedPanelIndex - 1]?.titleHighlight || ''}
                  onChangeText={text => updateCarouselStep(selectedPanelIndex - 1, { titleHighlight: text })}
                  placeholder={`Step ${selectedPanelIndex}`}
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                />

                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) }]}>Description</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: themeDefinition.colors.background, color: themeDefinition.colors.text, borderColor: themeDefinition.colors.border, fontSize: scaleFont(14), padding: scale(12), marginBottom: scale(4), minHeight: scale(72) }]}
                  value={cd.steps[selectedPanelIndex - 1]?.description || ''}
                  onChangeText={text => updateCarouselStep(selectedPanelIndex - 1, { description: text })}
                  placeholder="Add your description here..."
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                  multiline
                />
              </>
            )}
          </View>
        )}

        {/* Non-carousel: selected circle editing */}
        {!isCarouselTemplate && selectedCircleContent && (
          <View
            style={[
              styles.editSection,
              {
                backgroundColor: themeDefinition.colors.card,
                borderColor: themeDefinition.colors.border,
                padding: scale(16),
                marginTop: scale(16),
                borderRadius: scale(12),
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: themeDefinition.colors.text, fontSize: scaleFont(16), marginBottom: scale(12) },
              ]}
            >
              {t('roadmap_edit_circle') || 'Edit Circle'}
            </Text>

            {isBubbleTimelineTemplate && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) },
                  ]}
                >
                  Bubble Count
                </Text>
                <View style={[styles.contentTypeRow, { marginBottom: scale(12) }]}>
                  {[2, 3, 4, 5].map(count => (
                    <TouchableOpacity
                      key={`bubble-count-${count}`}
                      style={[
                        styles.circleTab,
                        {
                          backgroundColor: slide.circles.length === count ? '#007AFF' : themeDefinition.colors.background,
                          borderColor: slide.circles.length === count ? '#007AFF' : themeDefinition.colors.border,
                          paddingHorizontal: scale(12),
                          paddingVertical: scale(8),
                          marginRight: scale(8),
                        },
                      ]}
                      onPress={() => handleBubbleCountChange(count)}
                    >
                      <Text
                        style={{
                          color: slide.circles.length === count ? '#FFFFFF' : themeDefinition.colors.text,
                          fontSize: scaleFont(13),
                          fontWeight: '600',
                        }}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) },
                  ]}
                >
                  Bubble Color
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(12) }}>
                  <View style={styles.colorRow}>
                    {BUBBLE_TIMELINE_COLOR_OPTIONS.map(color => (
                      <TouchableOpacity
                        key={`bubble-color-${color}`}
                        style={[
                          styles.colorSwatch,
                          {
                            width: scale(36),
                            height: scale(36),
                            borderRadius: scale(18),
                            backgroundColor: color,
                            borderWidth: selectedCircleContent.textStyle?.color === color ? 3 : 1,
                            borderColor:
                              selectedCircleContent.textStyle?.color === color
                                ? '#007AFF'
                                : themeDefinition.colors.border,
                            marginRight: scale(8),
                          },
                        ]}
                        onPress={() => handleBubbleColorChange(color)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Label input */}
            <Text
              style={[
                styles.inputLabel,
                { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) },
              ]}
            >
              {circleLabelInputLabel}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: themeDefinition.colors.background,
                  color: themeDefinition.colors.text,
                  borderColor: themeDefinition.colors.border,
                  fontSize: scaleFont(14),
                  padding: scale(12),
                  marginBottom: scale(12),
                },
              ]}
              value={selectedCircleContent.label}
              onChangeText={handleLabelChange}
              placeholder={circleLabelPlaceholder}
              placeholderTextColor={themeDefinition.colors.text + '66'}
              keyboardType={isBubbleTimelineTemplate ? 'number-pad' : 'default'}
              maxLength={isBubbleTimelineTemplate ? 4 : undefined}
              selection={isBubbleTimelineTemplate ? percentageSelection : undefined}
              onSelectionChange={handlePercentageSelectionChange}
              onFocus={() => {
                if (!isBubbleTimelineTemplate || !selectedCircleContent) return;
                const cursor = Math.max(0, selectedCircleContent.label.length - 1);
                setPercentageSelection({ start: cursor, end: cursor });
              }}
            />

            {isThreeCirclesImageTemplate && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: themeDefinition.colors.text + '99',
                      fontSize: scaleFont(12),
                      marginBottom: scale(8),
                    },
                  ]}
                >
                  {t('select_image') || 'Select Image'}
                </Text>
                <View style={[styles.contentTypeRow, { marginBottom: scale(12) }]}>
                  <TouchableOpacity
                    style={[
                      styles.contentTypeButton,
                      {
                        backgroundColor: themeDefinition.colors.background,
                        borderColor: themeDefinition.colors.border,
                        paddingVertical: scale(8),
                        paddingHorizontal: scale(16),
                        marginRight: scale(8),
                      },
                    ]}
                    onPress={handleSelectCircleImage}
                  >
                    <Text style={{ color: themeDefinition.colors.text, fontSize: scaleFont(14) }}>
                      {t('select_image') || 'Select Image'}
                    </Text>
                  </TouchableOpacity>
                  {selectedCircleId && selectedCircleContent.imageUri && (
                    <TouchableOpacity
                      style={[
                        styles.contentTypeButton,
                        {
                          backgroundColor: themeDefinition.colors.background,
                          borderColor: themeDefinition.colors.border,
                          paddingVertical: scale(8),
                          paddingHorizontal: scale(16),
                        },
                      ]}
                      onPress={() => updateCircleContent(selectedCircleId, {
                        contentType: 'empty',
                        imageUri: undefined,
                      })}
                    >
                      <Text style={{ color: themeDefinition.colors.text, fontSize: scaleFont(14) }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {supportsSecondaryText && (
              <>
                {isBubbleTimelineTemplate && (
                  <>
                    <Text
                      style={[
                        styles.inputLabel,
                        {
                          color: themeDefinition.colors.text + '99',
                          fontSize: scaleFont(12),
                          marginBottom: scale(4),
                          marginTop: scale(8),
                        },
                      ]}
                    >
                      Title
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: themeDefinition.colors.background,
                          color: themeDefinition.colors.text,
                          borderColor: themeDefinition.colors.border,
                          fontSize: scaleFont(14),
                          padding: scale(12),
                        },
                      ]}
                      value={selectedBubbleTitle}
                      onChangeText={handleBubbleTitleChange}
                      placeholder="2012"
                      placeholderTextColor={themeDefinition.colors.text + '66'}
                    />
                  </>
                )}
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: themeDefinition.colors.text + '99',
                      fontSize: scaleFont(12),
                      marginBottom: scale(4),
                      marginTop: scale(8),
                    },
                  ]}
                >
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: themeDefinition.colors.background,
                      color: themeDefinition.colors.text,
                      borderColor: themeDefinition.colors.border,
                      fontSize: scaleFont(14),
                      padding: scale(12),
                      minHeight: scale(60),
                    },
                  ]}
                  value={isBubbleTimelineTemplate ? selectedBubbleDescription : selectedCircleContent.text || ''}
                  onChangeText={isBubbleTimelineTemplate ? handleBubbleDescriptionChange : handleContentTextChange}
                  placeholder="Description..."
                  placeholderTextColor={themeDefinition.colors.text + '66'}
                  multiline
                />
              </>
            )}

            {!isImageBackedTemplate && !isBubbleTimelineTemplate && (
              <>
                {/* Content type toggle */}
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: themeDefinition.colors.text + '99',
                      fontSize: scaleFont(12),
                      marginBottom: scale(8),
                      marginTop: scale(4),
                    },
                  ]}
                >
                  {t('roadmap_content') || 'Content'}
                </Text>
                <View style={styles.contentTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.contentTypeButton,
                      {
                        backgroundColor:
                          selectedCircleContent.contentType === 'text'
                            ? '#007AFF'
                            : themeDefinition.colors.background,
                        borderColor: themeDefinition.colors.border,
                        paddingVertical: scale(8),
                        paddingHorizontal: scale(16),
                        marginRight: scale(8),
                      },
                    ]}
                    onPress={() => updateCircleContent(selectedCircleId!, { contentType: 'text' })}
                  >
                    <Text
                      style={{
                        color:
                          selectedCircleContent.contentType === 'text'
                            ? '#FFFFFF'
                            : themeDefinition.colors.text,
                        fontSize: scaleFont(14),
                      }}
                    >
                      Text
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.contentTypeButton,
                      {
                        backgroundColor:
                          selectedCircleContent.contentType === 'image'
                            ? '#007AFF'
                            : themeDefinition.colors.background,
                        borderColor: themeDefinition.colors.border,
                        paddingVertical: scale(8),
                        paddingHorizontal: scale(16),
                      },
                    ]}
                    onPress={handleSelectCircleImage}
                  >
                    <Text
                      style={{
                        color:
                          selectedCircleContent.contentType === 'image'
                            ? '#FFFFFF'
                            : themeDefinition.colors.text,
                        fontSize: scaleFont(14),
                      }}
                    >
                      Image
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Text content input */}
                {selectedCircleContent.contentType === 'text' && (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: themeDefinition.colors.background,
                        color: themeDefinition.colors.text,
                        borderColor: themeDefinition.colors.border,
                        fontSize: scaleFont(14),
                        padding: scale(12),
                        marginTop: scale(12),
                        minHeight: scale(60),
                      },
                    ]}
                    value={selectedCircleContent.text || ''}
                    onChangeText={handleContentTextChange}
                    placeholder="Enter text..."
                    placeholderTextColor={themeDefinition.colors.text + '66'}
                    multiline
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* Style options */}
        <View
          style={[
            styles.editSection,
            {
              backgroundColor: themeDefinition.colors.card,
              borderColor: themeDefinition.colors.border,
              padding: scale(16),
              marginTop: scale(16),
              borderRadius: scale(12),
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: themeDefinition.colors.text, fontSize: scaleFont(16), marginBottom: scale(12) },
            ]}
          >
            {isCarouselTemplate
              ? 'Style'
              : isImageBackedTemplate
                ? t('roadmap_background_select') || 'Background'
                : t('roadmap_style') || 'Style'}
          </Text>

          {/* Carousel style controls */}
          {isCarouselTemplate && cd && (
            <>
              {/* Panel count stepper */}
              <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) }]}>
                Number of Panels
              </Text>
              <View style={[styles.stepperRow, { marginBottom: scale(16) }]}>
                <TouchableOpacity
                  style={[styles.stepperButton, { backgroundColor: themeDefinition.colors.background, borderColor: themeDefinition.colors.border }]}
                  onPress={() => handlePanelCountChange(-1)}
                >
                  <Text style={[styles.stepperButtonText, { color: themeDefinition.colors.text, fontSize: scaleFont(20) }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>
                  {cd.panelCount} panels
                </Text>
                <TouchableOpacity
                  style={[styles.stepperButton, { backgroundColor: themeDefinition.colors.background, borderColor: themeDefinition.colors.border }]}
                  onPress={() => handlePanelCountChange(1)}
                >
                  <Text style={[styles.stepperButtonText, { color: themeDefinition.colors.text, fontSize: scaleFont(20) }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Accent color */}
              <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) }]}>
                Accent Color (badges & highlights)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(16) }}>
                <View style={styles.colorRow}>
                  {CAROUSEL_COLOR_OPTIONS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          width: scale(36),
                          height: scale(36),
                          borderRadius: scale(18),
                          borderWidth: cd.accentColor === color ? 3 : 1,
                          borderColor: cd.accentColor === color ? '#007AFF' : themeDefinition.colors.border,
                          marginRight: scale(8),
                        },
                      ]}
                      onPress={() => updateCarouselStyle({ accentColor: color })}
                    />
                  ))}
                </View>
              </ScrollView>

              {/* Background color (step panels) */}
              <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) }]}>
                Step Panel Background Color
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(16) }}>
                <View style={styles.colorRow}>
                  {['#F5A623', '#E67E22', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#2C3E50', '#27AE60', '#8E44AD'].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          width: scale(36),
                          height: scale(36),
                          borderRadius: scale(18),
                          borderWidth: cd.backgroundColor === color ? 3 : 1,
                          borderColor: cd.backgroundColor === color ? '#007AFF' : themeDefinition.colors.border,
                          marginRight: scale(8),
                        },
                      ]}
                      onPress={() => updateCarouselStyle({ backgroundColor: color })}
                    />
                  ))}
                </View>
              </ScrollView>

              {/* Divider color */}
              <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) }]}>
                Divider Color
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(16) }}>
                <View style={styles.colorRow}>
                  {['#D4920F', '#C0392B', '#1A252F', '#2C3E50', '#7F8C8D', '#BDC3C7', '#FFFFFF', '#F39C12', '#16A085', '#8E44AD'].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          width: scale(36),
                          height: scale(36),
                          borderRadius: scale(18),
                          borderWidth: cd.dividerColor === color ? 3 : 1,
                          borderColor: cd.dividerColor === color ? '#007AFF' : themeDefinition.colors.border,
                          marginRight: scale(8),
                        },
                      ]}
                      onPress={() => updateCarouselStyle({ dividerColor: color })}
                    />
                  ))}
                </View>
              </ScrollView>

              {/* Show geometric shapes toggle */}
              <View style={[styles.toggleRow, { marginBottom: scale(8) }]}>
                <Text style={[styles.inputLabel, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12) }]}>
                  Show Geometric Shapes
                </Text>
                <Switch
                  value={cd.showShapes}
                  onValueChange={val => updateCarouselStyle({ showShapes: val })}
                  trackColor={{ false: themeDefinition.colors.border, true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </>
          )}

          {/* Non-carousel stroke color */}
          {!isCarouselTemplate && !isImageBackedTemplate && (
            <>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: themeDefinition.colors.text + '99',
                    fontSize: scaleFont(12),
                    marginBottom: scale(8),
                  },
                ]}
              >
                {t('roadmap_stroke_color') || 'Stroke Color'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorRow}>
                  {COLOR_OPTIONS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          width: scale(36),
                          height: scale(36),
                          borderRadius: scale(18),
                          borderWidth: slide.strokeColor === color ? 3 : 1,
                          borderColor: slide.strokeColor === color ? '#007AFF' : themeDefinition.colors.border,
                          marginRight: scale(8),
                        },
                      ]}
                      onPress={() => handleStrokeColorChange(color)}
                    />
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Background picker toggle */}
          <TouchableOpacity
            style={[
              styles.optionButton,
              {
                backgroundColor: themeDefinition.colors.background,
                borderColor: themeDefinition.colors.border,
                padding: scale(12),
                marginTop: scale(isCarouselTemplate ? 8 : isImageBackedTemplate ? 0 : 16),
              },
            ]}
            onPress={handleToggleBackgroundPicker}
          >
            <View style={styles.optionButtonRow}>
              <Text style={[styles.optionButtonText, { color: themeDefinition.colors.text, fontSize: scaleFont(14) }]}>
                {isCarouselTemplate
                  ? 'Change Cover Background'
                  : t('roadmap_change_background') || 'Change Background'}
              </Text>
              <Animated.Text
                style={[
                  styles.optionButtonIcon,
                  {
                    color: themeDefinition.colors.text + 'AA',
                    transform: [{ rotate: accordionChevronRotation }],
                  },
                ]}
              >
                ⌄
              </Animated.Text>
            </View>
          </TouchableOpacity>

          {/* Background picker */}
          {showBackgroundPicker && (
            <Animated.View
              style={{
                opacity: backgroundAccordionAnim,
                transform: [
                  {
                    translateY: backgroundAccordionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8, 0],
                    }),
                  },
                ],
              }}
            >
            <View style={[styles.backgroundGrid, { marginTop: scale(12) }]}>
              {ROADMAP_BACKGROUND_OPTIONS.map(gradient => (
                <TouchableOpacity
                  key={gradient.id}
                  style={[
                    styles.backgroundSwatch,
                    {
                      width: scale(48),
                      height: scale(48),
                      borderRadius: scale(8),
                      borderWidth:
                        slide.backgroundType === 'gradient' &&
                        slide.backgroundGradient?.id === gradient.id
                          ? 3
                          : 1,
                      borderColor:
                        slide.backgroundType === 'gradient' &&
                        slide.backgroundGradient?.id === gradient.id
                          ? '#007AFF'
                          : themeDefinition.colors.border,
                      marginRight: scale(8),
                      marginBottom: scale(8),
                    },
                  ]}
                  onPress={() => handleBackgroundChange(gradient)}
                >
                  <GradientBackground
                    gradient={gradient}
                    style={[styles.swatchGradient, { borderRadius: scale(6) }]}
                  />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.backgroundSwatch,
                  {
                    width: scale(48),
                    height: scale(48),
                    borderRadius: scale(8),
                    borderWidth: slide.backgroundType === 'image' ? 3 : 1,
                    borderColor:
                      slide.backgroundType === 'image'
                        ? '#007AFF'
                        : themeDefinition.colors.border,
                    marginRight: scale(8),
                    marginBottom: scale(8),
                    backgroundColor: themeDefinition.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
                onPress={handleBackgroundImageChange}
              >
                {slide.backgroundType === 'image' && slide.backgroundImageUri ? (
                  <Image
                    source={{ uri: slide.backgroundImageUri }}
                    style={[styles.imagePickerPreview, { borderRadius: scale(6) }]}
                  />
                ) : (
                  <Text
                    style={[
                      styles.imagePickerText,
                      {
                        color: themeDefinition.colors.text + '99',
                        fontSize: scaleFont(10),
                      },
                    ]}
                  >
                    Custom
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            </Animated.View>
          )}
        </View>

        {/* Corner images */}
        <View
          style={[
            styles.editSection,
            {
              backgroundColor: themeDefinition.colors.card,
              borderColor: themeDefinition.colors.border,
              padding: scale(16),
              marginTop: scale(16),
              borderRadius: scale(12),
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: themeDefinition.colors.text, fontSize: scaleFont(16), marginBottom: scale(12) },
            ]}
          >
            {t('roadmap_corner_images') || 'Corner Images / Logo'}
          </Text>
          <View style={styles.cornerButtonsRow}>
            {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as CornerPosition[]).map(
              position => {
                const existing = slide.cornerImages.find(c => c.position === position);
                return (
                  <TouchableOpacity
                    key={position}
                    style={[
                      styles.cornerButton,
                      {
                        backgroundColor: themeDefinition.colors.background,
                        borderColor: themeDefinition.colors.border,
                        padding: scale(8),
                        borderRadius: scale(8),
                      },
                    ]}
                    onPress={() => handleAddCornerImage(position)}
                  >
                    {existing ? (
                      <Image
                        source={{ uri: existing.imageUri }}
                        style={{ width: scale(32), height: scale(32), borderRadius: scale(4) }}
                      />
                    ) : (
                      <Text
                        style={{
                          color: themeDefinition.colors.text + '66',
                          fontSize: scaleFont(10),
                          textAlign: 'center',
                        }}
                      >
                        {position.replace(/([A-Z])/g, '\n$1').trim()}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* Preview button */}
        <TouchableOpacity
          style={[
            styles.previewButton,
            {
              padding: scale(16),
              marginTop: scale(24),
              marginBottom: scale(32) + insets.bottom,
              backgroundColor: '#007AFF',
            },
          ]}
          onPress={handlePreview}
        >
          <Text style={[styles.previewButtonText, { fontSize: scaleFont(18) }]}>
            {t('roadmap_preview') || 'Preview & Export'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  previewContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
  },
  circleTabs: {
    maxHeight: 50,
  },
  circleTabsContent: {
    paddingHorizontal: 4,
  },
  circleTab: {
    borderRadius: 20,
    borderWidth: 1,
  },
  circleTabText: {
    fontWeight: '500',
  },
  editSection: {
    width: '100%',
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  inputLabel: {
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
  },
  contentTypeRow: {
    flexDirection: 'row',
  },
  contentTypeButton: {
    borderRadius: 8,
    borderWidth: 1,
  },
  colorRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  colorSwatch: {},
  optionButton: {
    borderRadius: 8,
    borderWidth: 1,
  },
  optionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonText: {
    fontWeight: '500',
  },
  optionButtonIcon: {
    fontSize: 18,
    fontWeight: '600',
    includeFontPadding: false,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  backgroundSwatch: {
    overflow: 'hidden',
  },
  swatchGradient: {
    flex: 1,
  },
  cornerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cornerButton: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    borderWidth: 1,
  },
  previewButton: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontWeight: '600',
    lineHeight: 24,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imagePickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePickerPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default RoadmapEditorScreen;
