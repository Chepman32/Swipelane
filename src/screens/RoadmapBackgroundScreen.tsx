import React, { useLayoutEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { useResponsive } from '../hooks/useResponsive';
import { getRoadmapTemplateById, ROADMAP_BACKGROUNDS } from '../constants/roadmapTemplates';
import { GRADIENT_VARIANTS } from '../constants/gradients';
import { SkiaRoadmapRenderer } from '../components/roadmap';
import { createRoadmapProject } from '../types/roadmap';
import type { SlideBackgroundGradient } from '../services/StorageService';
import GradientBackground from '../components/GradientBackground';

type RootStackParamList = {
  RoadmapBackground: { templateId: string; projectId: string };
  RoadmapEditor: { projectId: string };
  Home: undefined;
};

type RoadmapBackgroundScreenRouteProp = RouteProp<RootStackParamList, 'RoadmapBackground'>;
type RoadmapBackgroundScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RoadmapEditor'
>;

// Combine dark roadmap backgrounds with general gradients
const ALL_BACKGROUNDS: SlideBackgroundGradient[] = [
  ...ROADMAP_BACKGROUNDS.map(bg => ({
    id: bg.id,
    colors: bg.colors,
    start: bg.start,
    end: bg.end,
  })),
  ...GRADIENT_VARIANTS,
];

const RoadmapBackgroundScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapBackgroundScreenNavigationProp>();
  const route = useRoute<RoadmapBackgroundScreenRouteProp>();
  const { templateId, projectId } = route.params;
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const { width, height } = useWindowDimensions();

  const [selectedGradient, setSelectedGradient] = useState<SlideBackgroundGradient>(
    ALL_BACKGROUNDS[0]
  );

  const template = useMemo(() => getRoadmapTemplateById(templateId), [templateId]);

  // Create a preview slide with the selected background
  const previewSlide = useMemo(() => {
    if (!template) return null;
    const project = createRoadmapProject(template, projectId);
    return {
      ...project.slide,
      backgroundType: 'gradient' as const,
      backgroundGradient: selectedGradient,
    };
  }, [template, selectedGradient, projectId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('roadmap_background_title') || 'Choose Background',
      headerBackTitle: t('back'),
    });
  }, [navigation, t]);

  const handleSelectGradient = (gradient: SlideBackgroundGradient) => {
    FeedbackService.buttonTap();
    setSelectedGradient(gradient);
  };

  const handleContinue = () => {
    FeedbackService.buttonTap();
    // Store the project with selected background and navigate to editor
    // The actual storage will happen in the editor screen
    navigation.navigate('RoadmapEditor', {
      projectId,
    });
  };

  const previewWidth = width - scale(40);
  const previewHeight = previewWidth * 1.2;
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
        contentContainerStyle={[styles.content, { padding: scale(20) }]}
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
          {ALL_BACKGROUNDS.map(gradient => (
            <TouchableOpacity
              key={gradient.id}
              style={[
                styles.gradientSwatch,
                {
                  width: swatchSize,
                  height: swatchSize,
                  borderRadius: scale(8),
                  borderColor:
                    selectedGradient.id === gradient.id
                      ? '#007AFF'
                      : themeDefinition.colors.border,
                  borderWidth: selectedGradient.id === gradient.id ? 3 : 1,
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
