import React, { useLayoutEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { createRoadmapProject } from '../types/roadmap';
import type { SlideBackgroundGradient } from '../services/StorageService';
import GradientBackground from '../components/GradientBackground';
import ImageService from '../services/ImageService';

type RootStackParamList = {
  RoadmapBackground: { templateId: string; projectId: string };
  RoadmapEditor: {
    projectId: string;
    templateId?: string;
    backgroundGradient?: SlideBackgroundGradient;
    backgroundImageUri?: string;
  };
  Home: undefined;
};

type RoadmapBackgroundScreenRouteProp = RouteProp<RootStackParamList, 'RoadmapBackground'>;
type RoadmapBackgroundScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RoadmapEditor'
>;

const RoadmapBackgroundScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapBackgroundScreenNavigationProp>();
  const route = useRoute<RoadmapBackgroundScreenRouteProp>();
  const { templateId, projectId } = route.params;
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const { width } = useWindowDimensions();

  const [selectedGradient, setSelectedGradient] = useState<SlideBackgroundGradient>(
    ROADMAP_BACKGROUND_OPTIONS[0]
  );
  const [selectedBackgroundType, setSelectedBackgroundType] = useState<'gradient' | 'image'>(
    'gradient',
  );
  const [selectedBackgroundImageUri, setSelectedBackgroundImageUri] = useState<
    string | undefined
  >(undefined);

  const template = useMemo(() => getRoadmapTemplateById(templateId), [templateId]);
  const imageTemplateConfig = useMemo(
    () => getRoadmapImageBackedTemplateConfig(templateId),
    [templateId],
  );

  // Create a preview slide with the selected background
  const previewSlide = useMemo(() => {
    if (!template) return null;
    const project = createRoadmapProject(template, projectId);
    return {
      ...project.slide,
      backgroundType: selectedBackgroundType,
      backgroundGradient: selectedBackgroundType === 'gradient' ? selectedGradient : null,
      backgroundImageUri:
        selectedBackgroundType === 'image' ? selectedBackgroundImageUri : undefined,
    };
  }, [
    template,
    selectedBackgroundImageUri,
    selectedBackgroundType,
    selectedGradient,
    projectId,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('roadmap_background_title') || 'Choose Background',
      headerBackTitle: t('back'),
    });
  }, [navigation, t]);

  const handleSelectGradient = (gradient: SlideBackgroundGradient) => {
    FeedbackService.buttonTap();
    setSelectedBackgroundType('gradient');
    setSelectedGradient(gradient);
  };

  const handleSelectCustomBackground = async () => {
    try {
      const imageUri = await ImageService.pickFromGallery(t);
      if (!imageUri) return;
      FeedbackService.buttonTap();
      setSelectedBackgroundImageUri(imageUri);
      setSelectedBackgroundType('image');
    } catch (error) {
      console.error('Error picking background image:', error);
    }
  };

  const handleContinue = () => {
    FeedbackService.buttonTap();
    // Pass the selected background and templateId to the editor
    navigation.navigate('RoadmapEditor', {
      projectId,
      templateId,
      backgroundGradient: selectedBackgroundType === 'gradient' ? selectedGradient : undefined,
      backgroundImageUri:
        selectedBackgroundType === 'image' ? selectedBackgroundImageUri : undefined,
    });
  };

  const horizontalContentPadding = scale(20);
  const previewWidth = width;
  const previewHeight = templateId === 'bubble_timeline_6'
    ? previewWidth * (2 / 3)
    : imageTemplateConfig
    ? previewWidth * (imageTemplateConfig.originalHeight / imageTemplateConfig.originalWidth)
    : previewWidth * 1.2;
  const swatchSize = scale(48);

  if (!template || !previewSlide) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { padding: horizontalContentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View
          style={[
            styles.previewContainer,
            {
              width: previewWidth,
              height: previewHeight,
              borderRadius: scale(12),
              borderColor: themeDefinition.colors.border,
              marginHorizontal: -horizontalContentPadding,
            },
          ]}
        >
          <SkiaRoadmapRenderer
            slide={previewSlide}
            style={[styles.preview, { borderRadius: scale(12) }]}
          />
        </View>

        {/* Background selector */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: themeDefinition.colors.text,
              fontSize: scaleFont(16),
              marginTop: scale(24),
              marginBottom: scale(12),
            },
          ]}
        >
          {t('roadmap_background_select') || 'Select Background'}
        </Text>

        <View style={styles.gradientGrid}>
          {ROADMAP_BACKGROUND_OPTIONS.map(gradient => (
            <TouchableOpacity
              key={gradient.id}
              style={[
                styles.gradientSwatch,
                {
                  width: swatchSize,
                  height: swatchSize,
                  borderRadius: scale(8),
                  borderColor:
                    selectedBackgroundType === 'gradient' && selectedGradient.id === gradient.id
                      ? '#007AFF'
                      : themeDefinition.colors.border,
                  borderWidth:
                    selectedBackgroundType === 'gradient' && selectedGradient.id === gradient.id
                      ? 3
                      : 1,
                },
              ]}
              onPress={() => handleSelectGradient(gradient)}
              activeOpacity={0.8}
            >
              <GradientBackground
                gradient={gradient}
                style={[styles.swatchGradient, { borderRadius: scale(6) }]}
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.gradientSwatch,
              {
                width: swatchSize,
                height: swatchSize,
                borderRadius: scale(8),
                borderColor:
                  selectedBackgroundType === 'image'
                    ? '#007AFF'
                    : themeDefinition.colors.border,
                borderWidth: selectedBackgroundType === 'image' ? 3 : 1,
                backgroundColor: themeDefinition.colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            onPress={handleSelectCustomBackground}
            activeOpacity={0.8}
          >
            {selectedBackgroundImageUri ? (
              <Image
                source={{ uri: selectedBackgroundImageUri }}
                style={[styles.customImagePreview, { borderRadius: scale(6) }]}
              />
            ) : (
              <Text
                style={[
                  styles.customImageLabel,
                  { color: themeDefinition.colors.text, fontSize: scaleFont(10) },
                ]}
              >
                Custom
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              padding: scale(15),
              marginTop: scale(24),
              backgroundColor: '#007AFF',
            },
          ]}
          onPress={handleContinue}
        >
          <Text style={[styles.continueButtonText, { fontSize: scaleFont(18) }]}>
            {t('roadmap_continue') || 'Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  sectionTitle: {
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradientSwatch: {
    overflow: 'hidden',
  },
  swatchGradient: {
    flex: 1,
  },
  customImagePreview: {
    width: '100%',
    height: '100%',
  },
  customImageLabel: {
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RoadmapBackgroundScreen;
