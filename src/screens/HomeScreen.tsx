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
import settingsIcon from '../assets/icons/settings.png';
import { useResponsive } from '../hooks/useResponsive';
import { useFont } from '@shopify/react-native-skia';
import { EffectPipeline } from '../textfx/render/pipeline';
import { convertToNewFormat } from '../textfx/utils/effectConverter';
import type { EffectInstance } from '../textfx/types';
import { isTextEffectSupported } from '../constants/textEffects';
import type { RoadmapProjectState } from '../types/roadmap';
import { SkiaRoadmapRenderer } from '../components/roadmap';

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
  RoadmapTemplate: undefined;
  ImageSelection: { text: string; projectId: string; images?: string[] };
  Editor: { text: string; images: string[]; projectId: string };
  RoadmapEditor: {
    projectId: string;
    templateId?: string;
    backgroundGradient?: any;
    backgroundImageUri?: string;
  };
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RoadmapTemplate'
>;

type TextProjectItem = ProjectState & { projectKind: 'text' };
type RoadmapProjectItem = RoadmapProjectState & { projectKind: 'roadmap' };
type BaseGridItem = TextProjectItem | RoadmapProjectItem;
type GridItem = BaseGridItem | (BaseGridItem & { isCurrentProject: true });

// Helper function to check if item is current project
const isCurrentProject = (item: GridItem): item is BaseGridItem & { isCurrentProject: true } => {
  return 'isCurrentProject' in item && item.isCurrentProject === true;
};

const platformKey: 'ios' | 'android' | 'default' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'default';

const SlidePreview: React.FC<{ slide: any }> = ({ slide }) => {
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
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
          {t('no_slides_yet')}
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
  const [recentProjects, setRecentProjects] = useState<TextProjectItem[]>([]);
  const [currentProject, setCurrentProject] = useState<TextProjectItem | null>(null);
  const [recentRoadmapProjects, setRecentRoadmapProjects] = useState<RoadmapProjectItem[]>([]);
  const [currentRoadmapProject, setCurrentRoadmapProject] = useState<RoadmapProjectItem | null>(null);
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
      const [recent, current, recentRoadmap, currentRoadmap] = await Promise.all([
        StorageService.getRecentProjects(),
        StorageService.loadCurrentProject(),
        StorageService.getRecentRoadmapProjects(),
        StorageService.loadCurrentRoadmapProject(),
      ]);
      setRecentProjects(recent.map(project => ({ ...project, projectKind: 'text' as const })));
      setCurrentProject(current ? { ...current, projectKind: 'text' as const } : null);
      setRecentRoadmapProjects(
        recentRoadmap.map((project: RoadmapProjectState) => ({
          ...project,
          projectKind: 'roadmap' as const,
        })),
      );
      setCurrentRoadmapProject(
        currentRoadmap
          ? { ...(currentRoadmap as RoadmapProjectState), projectKind: 'roadmap' as const }
          : null,
      );
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateNewProject = () => {
    FeedbackService.buttonTap();
    navigation.navigate('RoadmapTemplate');
  };

  const handleOpenProject = (project: BaseGridItem) => {
    FeedbackService.buttonTap();
    if (project.projectKind === 'roadmap') {
      StorageService.saveCurrentRoadmapProject(project).then(() => {
        navigation.navigate('RoadmapEditor', {
          projectId: project.id,
          templateId: project.templateId,
        });
      });
      return;
    }
    // Load text project as current and navigate directly to editor
    StorageService.saveCurrentProject(project).then(() => {
      const images = project.slides.map(slide => slide.image || '');
      navigation.navigate('Editor', { text: project.text, images, projectId: project.id });
    });
  };

  const handleDeleteProject = (project: BaseGridItem) => {
    Alert.alert(
      t('delete_project_title'),
      t('delete_project_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (project.projectKind === 'roadmap') {
                const isDeletingCurrentRoadmapProject = currentRoadmapProject?.id === project.id;
                await StorageService.deleteRecentRoadmapProject(project.id);
                if (isDeletingCurrentRoadmapProject) {
                  await StorageService.clearCurrentRoadmapProject();
                  setCurrentRoadmapProject(null);
                }
              } else {
                const isDeletingCurrentProject = currentProject?.id === project.id;
                await StorageService.deleteRecentProject(project.id);
                if (isDeletingCurrentProject) {
                  await StorageService.clearCurrentProject();
                  setCurrentProject(null);
                }
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


  const renderProjectItem = (props: { item: BaseGridItem; isCurrent?: boolean; isLastOdd?: boolean }) => {
    const { item, isCurrent, isLastOdd } = props;
    const firstSlide =
      item.projectKind === 'text' && item.slides && item.slides.length > 0
        ? item.slides[0]
        : null;

    return (
      <TouchableOpacity
        style={[
          styles.projectCard,
          {
            backgroundColor: themeDefinition.colors.card,
            borderColor: themeDefinition.colors.border,
            borderWidth: 1,
            margin: scale(8),
            minHeight: isPad ? 280 : 200,
          },
          isLastOdd && styles.projectCardFullWidth,
        ]}
        onPress={() => handleOpenProject(item)}
        onLongPress={() => handleDeleteProject(item)}
      >
        {/* Current Project Badge - REMOVED */}

        {/* Slide Preview */}
        {item.projectKind === 'roadmap' ? (
          <View
            pointerEvents="none"
            style={[
              styles.slidePreview,
              {
                backgroundColor: themeDefinition.colors.card,
                borderColor: themeDefinition.colors.border,
                overflow: 'hidden',
              },
            ]}
          >
            <SkiaRoadmapRenderer
              slide={item.slide}
              style={{ flex: 1, width: '100%' }}
            />
          </View>
        ) : (
          <SlidePreview slide={firstSlide} />
        )}

        {/* Project Info */}
        <View style={[styles.projectInfo, { padding: scale(12) }]}>
          <Text
            style={[
              styles.projectTitle,
              { color: themeDefinition.colors.text, fontSize: scaleFont(16) },
            ]}
            numberOfLines={1}
          >
            {item.projectKind === 'roadmap'
              ? item.name
              : item.text.trim().split('\n')[0] || t('untitled_project')}
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
              {item.projectKind === 'roadmap'
                ? `${item.slide?.circles?.length || 0} steps`
                : t('slides_count', { count: item.slides.length })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }: { item: GridItem; index: number }) => {
    const isLast = index === gridData.length - 1;
    const isOddCount = gridData.length % 2 === 1;
    const isLastOdd = isLast && isOddCount;

    if (isCurrentProject(item)) {
      return renderProjectItem({ item, isCurrent: true, isLastOdd });
    }
    return renderProjectItem({ item, isCurrent: false, isLastOdd });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text
        style={[
          styles.emptyStateText,
          {
            color: themeDefinition.colors.text + '99',
            fontSize: scaleFont(18),
          },
        ]}
      >
        {t('no_projects_yet')}
      </Text>
      <Text
        style={[
          styles.emptyStateHint,
          {
            color: themeDefinition.colors.text + '66',
            fontSize: scaleFont(14),
          },
        ]}
      >
        {t('tap_plus_to_create')}
      </Text>
    </View>
  );

  const keyExtractor = (item: GridItem, _index: number) => {
    if ('isCurrentProject' in item) return `current-${item.id}`;
    return item.id;
  };

  const currentItems: GridItem[] = [
    ...(currentProject ? [{ ...currentProject, isCurrentProject: true as const }] : []),
    ...(currentRoadmapProject
      ? [{ ...currentRoadmapProject, isCurrentProject: true as const }]
      : []),
  ];

  const recentText = recentProjects.filter(
    p => !currentProject || p.id !== currentProject.id,
  );
  const recentRoadmap = recentRoadmapProjects.filter(
    p => !currentRoadmapProject || p.id !== currentRoadmapProject.id,
  );

  const gridData: GridItem[] = [...currentItems, ...recentRoadmap, ...recentText];

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
          <Image 
            source={settingsIcon} 
            style={[styles.settingsButtonIcon, { width: scale(24), height: scale(24) }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={gridData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={gridColumns}
        key={`grid-${gridColumns}`}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.gridContainer,
          {
            padding: scale(16),
            paddingBottom: scale(100),
          },
          gridData.length === 0 && { flex: 1 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: themeDefinition.colors.primary || '#007AFF',
            width: scale(56),
            height: scale(56),
            bottom: scale(40),
            right: scale(20),
          },
        ]}
        onPress={handleCreateNewProject}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabIcon, { fontSize: scaleFont(28) }]}>+</Text>
      </TouchableOpacity>
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
  settingsButtonIcon: {
    tintColor: undefined,
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
  projectCardFullWidth: {
    flexBasis: '100%',
    maxWidth: '100%',
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateHint: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});

export default HomeScreen;
