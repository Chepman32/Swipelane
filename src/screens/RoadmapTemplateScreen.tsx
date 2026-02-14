import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';
import { useResponsive } from '../hooks/useResponsive';
import { ROADMAP_TEMPLATES, ROADMAP_BACKGROUNDS } from '../constants/roadmapTemplates';
import {
  getRoadmapTemplateImageSource,
  getRoadmapImageBackedTemplateConfig,
} from '../constants/roadmapTemplateAssets';
import type { RoadmapTemplate } from '../types/roadmap';
import type { SlideBackgroundGradient } from '../services/StorageService';

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

type RoadmapTemplateScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RoadmapBackground'
>;

const RoadmapTemplateScreen: React.FC = () => {
  const navigation = useNavigation<RoadmapTemplateScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const { width } = useWindowDimensions();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('roadmap_template_title') || 'Choose Template',
      headerBackTitle: t('back'),
    });
  }, [navigation, t]);

  const handleSelectTemplate = (template: RoadmapTemplate) => {
    FeedbackService.buttonTap();
    const projectId = `roadmap_${Date.now()}`;
    if (template.id === 'carousel' || template.id === 'vertical_flow_5') {
      navigation.navigate('RoadmapEditor', {
        projectId,
        templateId: template.id,
        backgroundGradient: ROADMAP_BACKGROUNDS[0] as SlideBackgroundGradient,
      });
      return;
    }
    navigation.navigate('RoadmapBackground', {
      templateId: template.id,
      projectId,
    });
  };

  const cardWidth = (width - scale(60)) / 2;
  const cardHeight = cardWidth * 1.2;
  const infoHeight = scale(82);

  const renderTemplateCard = ({ item }: { item: RoadmapTemplate }) => {
    const templateImageSource = getRoadmapTemplateImageSource(item.id);
    const imageTemplateConfig = getRoadmapImageBackedTemplateConfig(item.id);
    const isCarousel = item.id === 'carousel';
    if (!templateImageSource && !isCarousel) return null;

    const previewHeight = cardHeight - infoHeight;

    return (
      <TouchableOpacity
        style={[
          styles.templateCard,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: themeDefinition.colors.card,
            borderColor: themeDefinition.colors.border,
            marginBottom: scale(16),
          },
        ]}
        onPress={() => handleSelectTemplate(item)}
        activeOpacity={0.8}
      >
        {isCarousel ? (
          <View style={[styles.carouselPreview, { height: previewHeight }]}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[
                  styles.carouselPreviewPanel,
                  {
                    backgroundColor: i === 0 ? '#C8841F' : '#F5A623',
                    borderRightWidth: i < 2 ? 1 : 0,
                    borderRightColor: '#D4920F',
                  },
                ]}
              >
                {i === 0 ? (
                  <View style={styles.carouselPreviewCoverLines}>
                    <View style={[styles.carouselPreviewLine, { width: '80%', backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                    <View style={[styles.carouselPreviewLine, { width: '90%', backgroundColor: 'rgba(255,255,255,0.9)', marginTop: 4 }]} />
                    <View style={[styles.carouselPreviewLine, { width: '60%', backgroundColor: '#2E4BFF', marginTop: 4 }]} />
                  </View>
                ) : (
                  <View style={styles.carouselPreviewStepLines}>
                    <View style={[styles.carouselPreviewBadge, { backgroundColor: '#2E4BFF' }]} />
                    <View style={[styles.carouselPreviewLine, { width: '75%', backgroundColor: 'rgba(255,255,255,0.8)', marginTop: 6 }]} />
                    <View style={[styles.carouselPreviewLine, { width: '60%', backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 3 }]} />
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Image
            source={templateImageSource!}
            style={[
              styles.templateImage,
              {
                height: previewHeight,
                backgroundColor:
                  imageTemplateConfig?.canvasBackgroundColor ?? '#1a1a2e',
              },
            ]}
            resizeMode="contain"
          />
        )}
        <View style={[styles.templateInfo, { minHeight: infoHeight }]}>
          <Text
            style={[
              styles.templateName,
              { color: themeDefinition.colors.text, fontSize: scaleFont(14) },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.templateDescription,
              { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12) },
            ]}
            numberOfLines={1}
          >
            {item.circleCount > 0 ? `${item.circleCount} steps` : item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}
      edges={['bottom']}
    >
      <View style={[styles.content, { padding: scale(20) }]}>
        <Text
          style={[
            styles.subtitle,
            { color: themeDefinition.colors.text, fontSize: scaleFont(16), marginBottom: scale(20) },
          ]}
        >
          {t('roadmap_template_subtitle') || 'Select a roadmap template to get started'}
        </Text>

        <FlatList
          data={ROADMAP_TEMPLATES}
          renderItem={renderTemplateCard}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: 20,
  },
  templateCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  templateImage: {
    width: '100%',
  },
  templateInfo: {
    padding: 12,
  },
  templateName: {
    fontWeight: '600',
  },
  templateDescription: {
    marginTop: 4,
  },
  carouselPreview: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  carouselPreviewPanel: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  carouselPreviewCoverLines: {
    alignItems: 'flex-start',
  },
  carouselPreviewStepLines: {
    alignItems: 'flex-start',
  },
  carouselPreviewLine: {
    height: 4,
    borderRadius: 2,
  },
  carouselPreviewBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});

export default RoadmapTemplateScreen;
