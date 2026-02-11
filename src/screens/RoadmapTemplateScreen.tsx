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
import { ROADMAP_TEMPLATES } from '../constants/roadmapTemplates';
import { getRoadmapTemplateImageSource } from '../constants/roadmapTemplateAssets';
import type { RoadmapTemplate } from '../types/roadmap';

type RootStackParamList = {
  RoadmapBackground: { templateId: string; projectId: string };
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
    navigation.navigate('RoadmapBackground', {
      templateId: template.id,
      projectId,
    });
  };

  const cardWidth = (width - scale(60)) / 2;
  const cardHeight = cardWidth * 1.2;

  const renderTemplateCard = ({ item }: { item: RoadmapTemplate }) => {
    const templateImageSource = getRoadmapTemplateImageSource(item.id);
    if (!templateImageSource) return null;

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
        <Image
          source={templateImageSource}
          style={[styles.templateImage, { height: cardHeight - scale(60) }]}
          resizeMode="contain"
        />
        <View style={styles.templateInfo}>
          <Text
            style={[
              styles.templateName,
              { color: themeDefinition.colors.text, fontSize: scaleFont(14) },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.templateDescription,
              { color: themeDefinition.colors.text + '99', fontSize: scaleFont(12) },
            ]}
          >
            {item.circleCount} steps
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
    backgroundColor: '#1a1a2e',
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
});

export default RoadmapTemplateScreen;
