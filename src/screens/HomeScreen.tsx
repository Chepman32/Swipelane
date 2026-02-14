import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  ActionSheetIOS,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MenuView } from '@react-native-menu/menu';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import { ProjectState } from '../services/StorageService';
import type { ProjectFolder } from '../services/StorageService';
import { buildPreviewEffects } from '../utils/textEffectsPreview';
import {
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  DEFAULT_SLIDE_FONT_ID,
  LEGACY_SYSTEM_FONT_ID,
  SlideFontId,
} from '../constants/fonts';
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

const platformKey: 'ios' | 'android' | 'default' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'default';

const SlidePreview: React.FC<{ slide: any }> = ({ slide }) => {
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { isPad, scaleFont } = useResponsive();
  const { width: screenWidth } = Dimensions.get('window');
  const maxPreviewWidth = isPad ? 200 : 150;
  const previewWidth = Math.min(screenWidth - 80, maxPreviewWidth);
  const previewHeight = (previewWidth * 16) / 9;
  const scaleFactor = 0.4;

  const activeFontId = (slide?.fontId === LEGACY_SYSTEM_FONT_ID ? DEFAULT_SLIDE_FONT_ID : slide?.fontId) as SlideFontId;
  const skiaFontSource = useMemo(() => {
    const fallback = SKIA_FONT_SOURCES[DEFAULT_SLIDE_FONT_ID];
    if (!activeFontId) { return fallback; }
    return SKIA_FONT_SOURCES[activeFontId] ?? fallback;
  }, [activeFontId]);
  const fontSize = Math.max(12, (slide?.fontSize || 24) * scaleFactor);
  const skiaFont = useFont(skiaFontSource, fontSize);

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
      {slide.image && (
        <Image
          source={{ uri: slide.image }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

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
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['all', 'trash']));
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { gridColumns, scale, scaleFont, isPad } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      const [recent, current, recentRoadmap, currentRoadmap, folderList] = await Promise.all([
        StorageService.getRecentProjects(),
        StorageService.loadCurrentProject(),
        StorageService.getRecentRoadmapProjects(),
        StorageService.loadCurrentRoadmapProject(),
        StorageService.getFolders(),
      ]);
      setFolders(folderList);
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

  // Derived data
  const allActiveProjects: BaseGridItem[] = useMemo(
    () => [...recentRoadmapProjects, ...recentProjects].filter(p => !p.isTrashed),
    [recentProjects, recentRoadmapProjects]
  );

  const trashedProjects: BaseGridItem[] = useMemo(
    () => [...recentRoadmapProjects, ...recentProjects].filter(p => !!p.isTrashed),
    [recentProjects, recentRoadmapProjects]
  );

  const projectsInFolder = useCallback(
    (folderId: string): BaseGridItem[] =>
      [...recentRoadmapProjects, ...recentProjects].filter(
        p => !p.isTrashed && p.folderId === folderId
      ),
    [recentProjects, recentRoadmapProjects]
  );

  const getProjectDisplayName = (item: BaseGridItem): string => {
    if (item.projectKind === 'roadmap') { return item.name; }
    const textItem = item as TextProjectItem;
    return textItem.name ?? (textItem.text.trim().split('\n')[0] || t('untitled_project'));
  };

  const toggleAccordion = (folderId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) { next.delete(folderId); } else { next.add(folderId); }
      return next;
    });
  };

  const handleCreateNewProject = () => {
    FeedbackService.buttonTap();
    navigation.navigate('RoadmapTemplate');
  };

  const handleCreateNewFolder = () => {
    FeedbackService.buttonTap();
    Alert.prompt(
      'New Folder',
      'Enter folder name',
      async (folderName) => {
        if (!folderName?.trim()) { return; }
        await StorageService.createFolder(folderName.trim());
        await loadProjects();
      },
      'plain-text'
    );
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
    StorageService.saveCurrentProject(project).then(() => {
      const images = project.slides.map(slide => slide.image || '');
      navigation.navigate('Editor', { text: project.text, images, projectId: project.id });
    });
  };

  // ── Context menu action handlers ──────────────────────────────────────────

  const handleRename = (item: BaseGridItem) => {
    const currentName = getProjectDisplayName(item);
    Alert.prompt(
      'Rename Project',
      'Enter a new name',
      async (newName) => {
        if (!newName?.trim()) { return; }
        if (item.projectKind === 'roadmap') {
          await StorageService.renameRecentRoadmapProject(item.id, newName.trim());
        } else {
          await StorageService.renameRecentProject(item.id, newName.trim());
        }
        await loadProjects();
      },
      'plain-text',
      currentName
    );
  };

  const handleDuplicate = async (item: BaseGridItem) => {
    if (item.projectKind === 'roadmap') {
      await StorageService.duplicateRecentRoadmapProject(item.id);
    } else {
      await StorageService.duplicateRecentProject(item.id);
    }
    await loadProjects();
  };

  const handleMoveToFolder = (item: BaseGridItem) => {
    const options = [...folders.map(f => f.name), 'New Folder', 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title: 'Move to Folder',
      },
      async (buttonIndex) => {
        if (buttonIndex === options.length - 1) { return; } // Cancel
        if (buttonIndex === options.length - 2) {
          // New Folder
          Alert.prompt(
            'New Folder',
            'Enter folder name',
            async (folderName) => {
              if (!folderName?.trim()) { return; }
              const newFolder = await StorageService.createFolder(folderName.trim());
              if (item.projectKind === 'roadmap') {
                await StorageService.moveRoadmapProjectToFolder(item.id, newFolder.id);
              } else {
                await StorageService.moveProjectToFolder(item.id, newFolder.id);
              }
              await loadProjects();
            },
            'plain-text'
          );
        } else {
          const targetFolder = folders[buttonIndex];
          if (item.projectKind === 'roadmap') {
            await StorageService.moveRoadmapProjectToFolder(item.id, targetFolder.id);
          } else {
            await StorageService.moveProjectToFolder(item.id, targetFolder.id);
          }
          await loadProjects();
        }
      }
    );
  };

  const handleTrash = async (item: BaseGridItem) => {
    if (item.projectKind === 'roadmap') {
      const isDeletingCurrent = currentRoadmapProject?.id === item.id;
      await StorageService.trashRoadmapProject(item.id);
      if (isDeletingCurrent) {
        await StorageService.clearCurrentRoadmapProject();
        setCurrentRoadmapProject(null);
      }
    } else {
      const isDeletingCurrent = currentProject?.id === item.id;
      await StorageService.trashProject(item.id);
      if (isDeletingCurrent) {
        await StorageService.clearCurrentProject();
        setCurrentProject(null);
      }
    }
    FeedbackService.buttonTap();
    await loadProjects();
  };

  const handleRecover = async (item: BaseGridItem) => {
    if (item.projectKind === 'roadmap') {
      await StorageService.recoverRoadmapProject(item.id);
    } else {
      await StorageService.recoverProject(item.id);
    }
    await loadProjects();
  };

  const handleDeletePermanent = (item: BaseGridItem) => {
    Alert.alert(
      'Delete Permanently',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item.projectKind === 'roadmap') {
              await StorageService.permanentlyDeleteRoadmapProject(item.id);
            } else {
              await StorageService.permanentlyDeleteProject(item.id);
            }
            await loadProjects();
          },
        },
      ]
    );
  };

  const handleProjectMenuAction = async (actionId: string, item: BaseGridItem) => {
    FeedbackService.buttonTap();
    switch (actionId) {
      case 'rename':
        handleRename(item);
        break;
      case 'duplicate':
        await handleDuplicate(item);
        break;
      case 'move_to_folder':
        handleMoveToFolder(item);
        break;
      case 'trash':
        await handleTrash(item);
        break;
      case 'recover':
        await handleRecover(item);
        break;
      case 'delete_permanent':
        handleDeletePermanent(item);
        break;
    }
  };

  // ── Folder context menu handlers ──────────────────────────────────────────

  const handleRenameFolder = (folderId: string, currentName: string) => {
    Alert.prompt(
      'Rename Folder',
      'Enter a new name',
      async (newName) => {
        if (!newName?.trim()) { return; }
        await StorageService.renameFolder(folderId, newName.trim());
        await loadProjects();
      },
      'plain-text',
      currentName
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    Alert.alert(
      'Remove Folder',
      'Projects in this folder will stay in All Projects.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteFolder(folderId);
            await loadProjects();
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

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderProjectItem = (item: BaseGridItem, isLastOdd: boolean = false) => {
    const firstSlide =
      item.projectKind === 'text' && item.slides && item.slides.length > 0
        ? item.slides[0]
        : null;
    const isTrashed = !!item.isTrashed;

    const menuActions = isTrashed
      ? [
          { id: 'recover', title: 'Recover' },
          { id: 'delete_permanent', title: 'Delete Permanently', attributes: { destructive: true } },
        ]
      : [
          { id: 'rename', title: 'Rename' },
          { id: 'duplicate', title: 'Duplicate' },
          { id: 'move_to_folder', title: 'Move to Folder' },
          { id: 'trash', title: 'Remove', attributes: { destructive: true } },
        ];

    return (
      <MenuView
        key={item.id}
        title=""
        onPressAction={({ nativeEvent }) =>
          handleProjectMenuAction(nativeEvent.event, item)
        }
        actions={menuActions}
        shouldOpenOnLongPress
      >
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
          onPress={() => !isTrashed && handleOpenProject(item)}
          activeOpacity={isTrashed ? 1 : 0.7}
        >
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

          <View style={[styles.projectInfo, { padding: scale(12) }]}>
            <Text
              style={[
                styles.projectTitle,
                { color: themeDefinition.colors.text, fontSize: scaleFont(16) },
              ]}
              numberOfLines={1}
            >
              {getProjectDisplayName(item)}
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
      </MenuView>
    );
  };

  const renderGrid = (items: BaseGridItem[]) => {
    if (items.length === 0) {
      return (
        <Text style={[styles.emptyFolderHint, { color: themeDefinition.colors.text + '66' }]}>
          No projects
        </Text>
      );
    }
    const rows: BaseGridItem[][] = [];
    for (let i = 0; i < items.length; i += gridColumns) {
      rows.push(items.slice(i, i + gridColumns));
    }
    return rows.map((row, rowIdx) => (
      <View key={rowIdx} style={styles.gridRow}>
        {row.map(item => {
          const isLastOdd = items.length % gridColumns !== 0 && items.indexOf(item) === items.length - 1;
          return renderProjectItem(item, isLastOdd);
        })}
        {row.length < gridColumns && <View style={styles.projectCardPlaceholder} />}
      </View>
    ));
  };

  const renderFolderHeader = (
    label: string,
    folderId: string,
    isBuiltIn: boolean
  ) => {
    const isExpanded = expandedFolders.has(folderId);
    const folderMenuActions = isBuiltIn
      ? []
      : [
          { id: 'rename', title: 'Rename' },
          { id: 'remove', title: 'Remove', attributes: { destructive: true } },
        ];

    const header = (
      <TouchableOpacity
        style={[styles.accordionHeader, { borderBottomColor: themeDefinition.colors.border }]}
        onPress={() => toggleAccordion(folderId)}
        activeOpacity={0.7}
      >
        <Text style={[styles.accordionTitle, { color: themeDefinition.colors.text, fontSize: scaleFont(18) }]}>
          {label}
        </Text>
        <Text style={[styles.accordionChevron, { color: themeDefinition.colors.text + '88' }]}>
          {isExpanded ? '▾' : '▸'}
        </Text>
      </TouchableOpacity>
    );

    if (isBuiltIn) {
      return header;
    }

    return (
      <MenuView
        title={label}
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === 'rename') { handleRenameFolder(folderId, label); }
          if (nativeEvent.event === 'remove') { handleDeleteFolder(folderId); }
        }}
        actions={folderMenuActions}
        shouldOpenOnLongPress
      >
        {header}
      </MenuView>
    );
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleCreateNewFolder}
            style={[styles.headerButton, { padding: scale(10) }]}
          >
            <Text style={[styles.newFolderIcon, { color: themeDefinition.colors.text, fontSize: scaleFont(20) }]}>
              📁+
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={[styles.headerButton, { padding: scale(10) }]}
          >
            <Image
              source={settingsIcon}
              style={[styles.settingsButtonIcon, { width: scale(24), height: scale(24) }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: scale(16),
            paddingBottom: scale(100),
          },
          allActiveProjects.length === 0 && trashedProjects.length === 0 && { flex: 1 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* All Projects accordion */}
        <View style={styles.accordionSection}>
          {renderFolderHeader('All Projects', 'all', true)}
          {expandedFolders.has('all') && (
            allActiveProjects.length === 0
              ? renderEmptyState()
              : renderGrid(allActiveProjects)
          )}
        </View>

        {/* User-created folder accordions */}
        {folders.map(folder => (
          <View key={folder.id} style={styles.accordionSection}>
            {renderFolderHeader(folder.name, folder.id, false)}
            {expandedFolders.has(folder.id) && renderGrid(projectsInFolder(folder.id))}
          </View>
        ))}

        {/* Trash accordion – only when non-empty */}
        {trashedProjects.length > 0 && (
          <View style={styles.accordionSection}>
            {renderFolderHeader('Trash', 'trash', true)}
            {expandedFolders.has('trash') && renderGrid(trashedProjects)}
          </View>
        )}
      </ScrollView>

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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    padding: 10,
  },
  newFolderIcon: {
    fontSize: 20,
  },
  settingsButtonIcon: {
    tintColor: undefined,
  },
  scrollContent: {
    padding: 16,
  },
  accordionSection: {
    marginBottom: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    marginBottom: 4,
  },
  accordionTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
  accordionChevron: {
    fontSize: 16,
    color: '#888',
  },
  gridRow: {
    flexDirection: 'row',
  },
  projectCardPlaceholder: {
    flex: 1,
    margin: 8,
  },
  emptyFolderHint: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 14,
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
    paddingTop: 40,
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
