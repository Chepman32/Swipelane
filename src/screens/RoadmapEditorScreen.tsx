import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
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
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { useResponsive } from '../hooks/useResponsive';
import { getRoadmapTemplateById, ROADMAP_BACKGROUNDS, ROADMAP_DEFAULTS } from '../constants/roadmapTemplates';
import { GRADIENT_VARIANTS } from '../constants/gradients';
import { SkiaRoadmapRenderer } from '../components/roadmap';
import {
  createRoadmapProject,
  RoadmapSlide,
  RoadmapCircleContent,
  CornerImage,
  CornerPosition,
} from '../types/roadmap';
import type { SlideBackgroundGradient } from '../services/StorageService';
import GradientBackground from '../components/GradientBackground';
import ImageService from '../services/ImageService';

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

type RootStackParamList = {
  RoadmapEditor: { projectId: string; templateId?: string; backgroundGradient?: SlideBackgroundGradient };
  Preview: { slides: any[]; projectType: 'roadmap' };
  Home: undefined;
};

type RoadmapEditorRouteProp = RouteProp<RootStackParamList, 'RoadmapEditor'>;
type RoadmapEditorNavigationProp = StackNavigationProp<RootStackParamList, 'Preview'>;

const ALL_BACKGROUNDS: SlideBackgroundGradient[] = [
  ...ROADMAP_BACKGROUNDS.map(bg => ({
    id: bg.id,
    colors: bg.colors,
    start: bg.start,
    end: bg.end,
  })),
  ...GRADIENT_VARIANTS,
];

const RoadmapEditorScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapEditorNavigationProp>();
  const route = useRoute<RoadmapEditorRouteProp>();
  const { projectId, templateId: routeTemplateId, backgroundGradient: routeBackground } = route.params;
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // State
  const [templateId, setTemplateId] = useState(routeTemplateId || 'grid_4_circles');
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [slide, setSlide] = useState<RoadmapSlide | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const template = useMemo(() => getRoadmapTemplateById(templateId), [templateId]);

  // Initialize slide only once
  useEffect(() => {
    if (template && !slide) {
      const project = createRoadmapProject(template, projectId);
      setSlide({
        ...project.slide,
        backgroundType: 'gradient',
        backgroundGradient: routeBackground || ALL_BACKGROUNDS[0],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, projectId]);

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

  // Handle circle tap
  const handleCircleTap = useCallback((circleId: string) => {
    FeedbackService.buttonTap();
    setSelectedCircleId(circleId);
    setEditingLabel(false);
    setEditingContent(false);
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
        updateCircleContent(selectedCircleId, { label: text });
      }
    },
    [selectedCircleId, updateCircleContent]
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

  // Handle background change
  const handleBackgroundChange = useCallback((gradient: SlideBackgroundGradient) => {
    FeedbackService.buttonTap();
    setSlide(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        backgroundType: 'gradient',
        backgroundGradient: gradient,
      };
    });
    setShowBackgroundPicker(false);
  }, []);

  // Handle stroke color change
  const handleStrokeColorChange = useCallback((color: string) => {
    FeedbackService.buttonTap();
    setSlide(prev => {
      if (!prev) return prev;
      return { ...prev, strokeColor: color };
    });
    setShowColorPicker(false);
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
  const handlePreview = useCallback(() => {
    if (!slide) return;
    FeedbackService.buttonTap();
    navigation.navigate('Preview', {
      slides: [slide],
      projectType: 'roadmap',
    });
  }, [slide, navigation]);

  const previewWidth = width - scale(32);
  const previewHeight = previewWidth * 1.2;

  if (!template || !slide) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: scale(16) }]}
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
            },
          ]}
        >
          <SkiaRoadmapRenderer
            slide={slide}
            style={[styles.preview, { borderRadius: scale(12) }]}
            selectedCircleId={selectedCircleId}
            onCircleTap={handleCircleTap}
          />
        </View>

        {/* Circle selector tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.circleTabs, { marginTop: scale(16) }]}
          contentContainerStyle={styles.circleTabsContent}
        >
          {template.circles.map((circle, index) => {
            const content = slide.circles.find(c => c.circleId === circle.id);
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
                  {content?.label || `Step ${index + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected circle editing */}
        {selectedCircleContent && (
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

            {/* Label input */}
            <Text
              style={[
                styles.inputLabel,
                { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(4) },
              ]}
            >
              {t('roadmap_label') || 'Label'}
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
              placeholder="Step 1"
              placeholderTextColor={themeDefinition.colors.text + '66'}
            />

            {/* Content type toggle */}
            <Text
              style={[
                styles.inputLabel,
                { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) },
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
            {t('roadmap_style') || 'Style'}
          </Text>

          {/* Stroke color */}
          <Text
            style={[
              styles.inputLabel,
              { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12), marginBottom: scale(8) },
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

          {/* Background picker toggle */}
          <TouchableOpacity
            style={[
              styles.optionButton,
              {
                backgroundColor: themeDefinition.colors.background,
                borderColor: themeDefinition.colors.border,
                padding: scale(12),
                marginTop: scale(16),
              },
            ]}
            onPress={() => setShowBackgroundPicker(!showBackgroundPicker)}
          >
            <Text style={[styles.optionButtonText, { color: themeDefinition.colors.text, fontSize: scaleFont(14) }]}>
              {t('roadmap_change_background') || 'Change Background'}
            </Text>
          </TouchableOpacity>

          {/* Background picker */}
          {showBackgroundPicker && (
            <View style={[styles.backgroundGrid, { marginTop: scale(12) }]}>
              {ALL_BACKGROUNDS.map(gradient => (
                <TouchableOpacity
                  key={gradient.id}
                  style={[
                    styles.backgroundSwatch,
                    {
                      width: scale(48),
                      height: scale(48),
                      borderRadius: scale(8),
                      borderWidth: slide.backgroundGradient?.id === gradient.id ? 3 : 1,
                      borderColor:
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
            </View>
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
            {t('roadmap_corner_images') || 'Corner Images (Logo)'}
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
    alignItems: 'center',
  },
  optionButtonText: {
    fontWeight: '500',
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
});

export default RoadmapEditorScreen;
