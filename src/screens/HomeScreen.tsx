import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import { ProjectState } from '../services/StorageService';
import { buildPreviewEffects } from '../utils/textEffectsPreview';
import {
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  DEFAULT_SLIDE_FONT_ID,
  LEGACY_SYSTEM_FONT_ID,
  SlideFontId,
} from '../constants/fonts';
import { Platform } from 'react-native';
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

// Helper to filter supported effects
const filterSupportedEffects = (effects?: any[]) =>
  (effects ?? []).filter((effect: any) => isTextEffectSupported(effect.type));

type RootStackParamList = {
  NewProject: undefined;
  ImageSelection: { text: string; projectId: string; images?: string[] };
  Editor: { text: string; images: string[]; projectId: string };
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NewProject'
>;

type GridItem = ProjectState | { isCreateButton: true } | (ProjectState & { isCurrentProject: true });

// Helper function to check if item is current project
const isCurrentProject = (item: GridItem): item is ProjectState & { isCurrentProject: true } => {
  return 'isCurrentProject' in item && item.isCurrentProject === true;
};

const platformKey: 'ios' | 'android' | 'default' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'default';

const SlidePreview: React.FC<{ slide: any }> = ({ slide }) => {
  const { themeDefinition } = useTheme();
  const { isPad, scaleFont } = useResponsive();
  const { width: screenWidth } = Dimensions.get('window');
  // Increase preview width cap for iPad
  const maxPreviewWidth = isPad ? 200 : 150;
  const previewWidth = Math.min(screenWidth - 80, maxPreviewWidth);
  const previewHeight = (previewWidth * 16) / 9; // 16:9 aspect ratio
  const scaleFactor = 0.4; // Scale down for thumbnail

  // Load Skia font for effects rendering
  const activeFontId = (slide?.fontId === LEGACY_SYSTEM_FONT_ID ? DEFAULT_SLIDE_FONT_ID : slide?.fontId) as SlideFontId;
  const skiaFontSource = useMemo(() => {
    const fallback = SKIA_FONT_SOURCES[DEFAULT_SLIDE_FONT_ID];
    if (!activeFontId) {
      return fallback;
    }
    return SKIA_FONT_SOURCES[activeFontId] ?? fallback;
  }, [activeFontId]);
  const fontSize = Math.max(12, (slide?.fontSize || 24) * scaleFactor);
  const skiaFont = useFont(skiaFontSource, fontSize);

  // Filter and convert effects
  const slideEffects = filterSupportedEffects(slide?.textEffects);
  const newFormatEffects: EffectInstance[] = useMemo(() => {
    return slideEffects
      .map((effect: any) => convertToNewFormat(effect, slide?.color))
      .filter((effect: any): effect is EffectInstance => effect !== null);
  }, [slideEffects, slide?.color]);

  if (!slide) {
    return (
      <View
        style={[
          styles.slidePreview,
          {
            backgroundColor: themeDefinition.colors.card,
            borderColor: themeDefinition.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.noPreviewText,
            { color: themeDefinition.colors.text + '66', fontSize: scaleFont(14) },
          ]}
        >
          No slides yet
        </Text>
      </View>
    );
  }

  const fontOption = slide.fontId
    ? getSlideFontById(slide.fontId)
    : getSlideFontByFamily(slide.fontFamily);
  const fontFamily = resolveFontFamilyForPlatform(fontOption, platformKey);

  // Fallback to CSS-based effects when no Skia font
  const effects = buildPreviewEffects(slide.textEffects || [], {
    text: slide.text,
    fontSize,
    textColor: slide.color,
    fontFamily,
    fontWeight: slide.fontWeight,
  });

  const hasSkiaEffects = skiaFont && newFormatEffects.length > 0;

  return (
    <View
      style={[
        styles.slidePreview,
        {
          backgroundColor: slide.backgroundColor || themeDefinition.colors.card,
          borderColor: themeDefinition.colors.border,
          width: previewWidth,
          height: previewHeight,
        },
      ]}
    >
      {/* Background Image */}
      {slide.image && (
        <Image
          source={{ uri: slide.image }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

      {/* Text Content */}
      <View
        style={[
          styles.textContainer,
          {
            left: slide.position?.x * scaleFactor || 10,
            top: slide.position?.y * scaleFactor || 20,
          },
        ]}
      >
        {hasSkiaEffects ? (
          <EffectPipeline
            text={slide.text}
            x={0}
            baselineY={fontSize}
            font={skiaFont}
            width={previewWidth * 0.9}
            height={fontSize * 2}
            textColor={slide.color || '#FFFFFF'}
            effects={newFormatEffects}
            lineHeight={fontSize * 1.35}
            background="transparent"
          />
        ) : (
          <>
            {/* Underlay Effects */}
            {effects.underlayElements.map((element, index) => (
              <View key={`underlay-${index}`} style={styles.effectLayer}>
                {element}
              </View>
            ))}

            <Text
              style={[
                styles.previewText,
                {
                  color: slide.color,
                  fontSize,
                  fontFamily,
                  fontWeight: slide.fontWeight,
                  textAlign: slide.textAlign,
                  ...effects.textStyle,
                },
              ]}
              numberOfLines={3}
            >
              {slide.text}
            </Text>
          </>
        )}
      </View>

      {/* Overlay Effects (only when not using Skia) */}
      {!hasSkiaEffects && (
        <View style={[styles.effectLayer, effects.overlayStyle]}>
          {effects.overlayElements.map((element, index) => (
            <View key={`overlay-${index}`}>{element}</View>
          ))}
        </View>
      )}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const [recentProjects, setRecentProjects] = useState<ProjectState[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { gridColumns, scale, scaleFont, isPad } = useResponsive();

  // Load recent projects and current project when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      const [recent, current] = await Promise.all([
        StorageService.getRecentProjects(),
        StorageService.loadCurrentProject(),
      ]);
      setRecentProjects(recent);
      setCurrentProject(current);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateNewProject = () => {
    FeedbackService.buttonTap();
    navigation.navigate('NewProject');
  };

  const handleOpenProject = (project: ProjectState) => {
    FeedbackService.buttonTap();
    // Load the project as current and navigate directly to editor
    StorageService.saveCurrentProject(project).then(() => {
      // Extract images from slides to pass to EditorScreen
      const images = project.slides.map(slide => slide.image || '');
      navigation.navigate('Editor', { text: project.text, images, projectId: project.id });
    });
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if it's the current project
              if (currentProject && currentProject.id === projectId) {
                await StorageService.clearCurrentProject();
                setCurrentProject(null);
              } else {
                await StorageService.deleteRecentProject(projectId);
              }
              await loadProjects();
              FeedbackService.buttonTap();
            } catch (error) {
              console.error('Error deleting project:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };


  const renderProjectItem = (props: { item: ProjectState; isCurrent?: boolean }) => {
    const { item, isCurrent } = props;
    const firstSlide = item.slides && item.slides.length > 0 ? item.slides[0] : null;

    return (
      <TouchableOpacity
        style={[
          styles.projectCard,
          {
            backgroundColor: themeDefinition.colors.card,
            borderColor: isCurrent ? themeDefinition.colors.primary || '#007AFF' : themeDefinition.colors.border,
            borderWidth: isCurrent ? 2 : 1,
            margin: scale(8),
            minHeight: isPad ? 280 : 200,
          },
        ]}
        onPress={() => handleOpenProject(item)}
        onLongPress={() => handleDeleteProject(item.id)}
      >
        {/* Current Project Badge - REMOVED */}

        {/* Slide Preview */}
        <SlidePreview slide={firstSlide} />

        {/* Project Info */}
        <View style={[styles.projectInfo, { padding: scale(12) }]}>
          <Text
            style={[
              styles.projectTitle,
              { color: themeDefinition.colors.text, fontSize: scaleFont(16) },
            ]}
            numberOfLines={1}
          >
            {item.text.trim().split('\n')[0] || 'Untitled Project'}
          </Text>
          <View style={styles.projectFooter}>
            <Text
              style={[
                styles.projectDate,
                { color: themeDefinition.colors.text + '66', fontSize: scaleFont(12) },
              ]}
            >
              {formatDate(item.lastModified)}
            </Text>
            <Text
              style={[
                styles.projectSlides,
                { color: themeDefinition.colors.text + '66', fontSize: scaleFont(12) },
              ]}
            >
              {item.slides.length} slides
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateButton = () => (
    <TouchableOpacity
      style={[
        styles.createButton,
        {
          backgroundColor: themeDefinition.colors.card,
          borderColor: themeDefinition.colors.border,
          margin: scale(8),
          minHeight: isPad ? 280 : 200,
        },
      ]}
      onPress={handleCreateNewProject}
    >
      <Text style={[styles.createButtonText, { color: themeDefinition.colors.primary || '#007AFF', fontSize: scaleFont(48) }]}>
        +
      </Text>
      <Text style={[styles.createButtonLabel, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>
        New Project
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: GridItem }) => {
    if ('isCreateButton' in item) {
      return renderCreateButton();
    }
    if (isCurrentProject(item)) {
      return renderProjectItem({ item, isCurrent: true });
    }
    return renderProjectItem({ item, isCurrent: false });
  };

  const keyExtractor = (item: GridItem, _index: number) => {
    if ('isCreateButton' in item) return 'create-button';
    if ('isCurrentProject' in item) return `current-${item.id}`;
    return item.id;
  };

  const gridData: GridItem[] = [
    { isCreateButton: true },
    ...(currentProject ? [{ ...currentProject, isCurrentProject: true as const }] : []),
    ...recentProjects.filter(p => !currentProject || p.id !== currentProject.id),
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeDefinition.colors.background },
      ]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: themeDefinition.colors.border, paddingHorizontal: scale(20) },
        ]}
      >
        <Text style={[styles.title, { color: themeDefinition.colors.text, fontSize: scaleFont(24) }]}>
          {t('app_name')}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={[styles.settingsButton, { padding: scale(10) }]}
        >
          <Text style={[styles.settingsButtonText, { fontSize: scaleFont(24) }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={gridData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={gridColumns}
        key={`grid-${gridColumns}`}
        contentContainerStyle={[styles.gridContainer, { padding: scale(16) }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  gridContainer: {
    padding: 16,
  },
  projectCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  currentProjectBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  currentProjectBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  slidePreview: {
    width: '100%',
    height: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  effectLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    maxWidth: '80%',
  },
  previewText: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noPreviewText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  projectInfo: {
    padding: 12,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 12,
  },
  projectSlides: {
    fontSize: 12,
  },
  createButton: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
