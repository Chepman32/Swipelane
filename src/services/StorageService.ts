import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import StorageInitializer from '../utils/storageInit';
import ProjectImageStore from './ProjectImageStore';
import { normalizeImageUri, normalizeImageUris } from '../utils/imageUri';
import {
  DEFAULT_SLIDE_FONT_ID,
  getSlideFontByFamily,
  getSlideFontById,
  resolveFontFamilyForPlatform,
  SlideFontId,
  LEGACY_SYSTEM_FONT_ID,
} from '../constants/fonts';
import type { TextEffectInstance } from '../constants/textEffects';
import { isTextEffectSupported } from '../constants/textEffects';

const platformKey: 'ios' | 'android' | 'default' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'default';

export type GradientPoint = { x: number; y: number };

export interface SlideBackgroundGradient {
  id: string;
  colors: string[];
  start: GradientPoint;
  end: GradientPoint;
}

export interface ProjectState {
  id: string;
  text: string;
  slides: Array<{
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
    textEffects?: TextEffectInstance[];
    backgroundGradient?: SlideBackgroundGradient | null;
    aiSuggestedForImageUri?: string;
    aiEffectInstanceId?: string;
    aiDominantColor?: string;
  }>;
  images: string[];
  lastModified: string;
  isCompleted: boolean;
}

export interface AppState {
  currentProject?: ProjectState;
  recentProjects: ProjectState[];
  preferences: {
    theme: string;
    language: string;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
}

const sanitizeTextEffects = (effects?: TextEffectInstance[]): TextEffectInstance[] =>
  (effects ?? []).filter(effect => isTextEffectSupported(effect.type));

class StorageService {
  private static instance: StorageService;
  private readonly STORAGE_KEYS = {
    CURRENT_PROJECT: '@TextToSlides:currentProject',
    RECENT_PROJECTS: '@TextToSlides:recentProjects',
    PREFERENCES: '@TextToSlides:preferences',
    APP_STATE: '@TextToSlides:appState',
    FIRST_LAUNCH: '@TextToSlides:firstLaunch',
    // Roadmap storage keys
    CURRENT_ROADMAP_PROJECT: '@Swipelane:currentRoadmapProject',
    RECENT_ROADMAP_PROJECTS: '@Swipelane:recentRoadmapProjects',
  };

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
      // Initialize storage on first getInstance
      StorageInitializer.initialize().catch(error => {
        console.log('Storage initialization in background:', error);
      });
    }
    return StorageService.instance;
  }

  /**
   * Move project images into Documents storage so they survive app updates.
   * Returns the migrated project and whether it changed.
   */
  private async migrateProjectImages(project: ProjectState): Promise<{
    project: ProjectState;
    changed: boolean;
  }> {
    if (!project?.slides?.length) {
      return { project, changed: false };
    }

    let changed = false;

    const migratedSlides = await Promise.all(
      project.slides.map(async (slide, index) => {
        const imageUri = normalizeImageUri(slide.image);
        if (!imageUri) {
          return slide;
        }

        // Skip if already persistent.
        if (ProjectImageStore.isPersistentProjectImageUri(imageUri, project.id)) {
          return imageUri === slide.image ? slide : { ...slide, image: imageUri };
        }

        const persistedUri = await ProjectImageStore.persistImageForProject({
          uri: imageUri,
          projectId: project.id,
          slideIndex: index,
        });

        if (!persistedUri || persistedUri === imageUri) {
          return imageUri === slide.image ? slide : { ...slide, image: imageUri };
        }

        changed = true;
        return {
          ...slide,
          image: persistedUri,
        };
      }),
    );

    const migratedImages = migratedSlides.map(slide => slide.image || '');
    const imagesChanged =
      !project.images ||
      project.images.length !== migratedImages.length ||
      project.images.some((img, idx) => img !== migratedImages[idx]);

    if (imagesChanged) {
      changed = true;
    }

    if (!changed) {
      return { project, changed: false };
    }

    return {
      project: {
        ...project,
        slides: migratedSlides,
        images: migratedImages,
      },
      changed: true,
    };
  }

  // Save current project state
  async saveCurrentProject(project: ProjectState): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const normalizedProject: ProjectState = {
          ...project,
          lastModified: new Date().toISOString(),
          slides: project.slides.map(slide => ({
            ...slide,
            textEffects: sanitizeTextEffects(slide.textEffects),
          })),
        };

        // Migrate images to persistent storage before saving
        const migration = await this.migrateProjectImages(normalizedProject);
        const projectToSave = migration.project;

        await AsyncStorage.setItem(
          this.STORAGE_KEYS.CURRENT_PROJECT,
          JSON.stringify(projectToSave)
        );

        // Only add/update in recent projects if project has meaningful content
        // (has slides with images or text, or is completed)
        const hasContent = projectToSave.slides.length > 0 &&
          projectToSave.slides.some(slide => slide.image || slide.text);

        if (projectToSave.isCompleted || hasContent) {
          await this.addToRecentProjects(projectToSave);
        }
      },
      undefined,
      'saveCurrentProject'
    );
  }

  // Load current project state
  async loadCurrentProject(): Promise<ProjectState | null> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const projectData = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_PROJECT);
        if (projectData) {
          const parsed: ProjectState = JSON.parse(projectData);

          if (parsed?.slides?.length) {
            parsed.slides = parsed.slides.map(slide => {
              const legacyFontId =
                slide.fontId === LEGACY_SYSTEM_FONT_ID
                  ? DEFAULT_SLIDE_FONT_ID
                  : slide.fontId;
              const fontOption = legacyFontId
                ? getSlideFontById(legacyFontId)
                : getSlideFontByFamily(slide.fontFamily);

              // Fix potential stale paths
              const fixedImageUri = ProjectImageStore.fixPath(normalizeImageUri(slide.image));

              return {
                ...slide,
                image: fixedImageUri,
                fontId:
                  legacyFontId ??
                  (slide.fontFamily
                    ? getSlideFontByFamily(slide.fontFamily).id
                    : DEFAULT_SLIDE_FONT_ID),
                fontFamily: resolveFontFamilyForPlatform(fontOption, platformKey),
                textEffects: sanitizeTextEffects(slide.textEffects),
              };
            });
          }

          if (parsed.images && parsed.images.length > 0) {
            parsed.images = normalizeImageUris(parsed.images).map(img => ProjectImageStore.fixPath(img));
          } else if (parsed.slides?.length) {
            parsed.images = parsed.slides.map(slide => slide.image || '');
          }

          const migration = await this.migrateProjectImages(parsed);
          if (migration.changed) {
            await AsyncStorage.setItem(
              this.STORAGE_KEYS.CURRENT_PROJECT,
              JSON.stringify(migration.project),
            );
          }

          return migration.project;
        }
        return null;
      },
      null,
      'loadCurrentProject'
    );
  }

  // Clear current project
  async clearCurrentProject(): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_PROJECT);
      },
      undefined,
      'clearCurrentProject'
    );
  }

  // Add project to recent projects
  private async addToRecentProjects(project: ProjectState): Promise<void> {
    try {
      const recentProjects = await this.getRecentProjects();

      // Remove if already exists
      const filteredProjects = recentProjects.filter(p => p.id !== project.id);

      // Add to beginning
      filteredProjects.unshift(project);

      // Keep only last 10 projects
      const trimmedProjects = filteredProjects.slice(0, 10);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RECENT_PROJECTS,
        JSON.stringify(trimmedProjects)
      );
    } catch (error) {
      console.error('Error adding to recent projects:', error);
    }
  }

  // Get recent projects
  async getRecentProjects(): Promise<ProjectState[]> {
    try {
      const projectsData = await AsyncStorage.getItem(this.STORAGE_KEYS.RECENT_PROJECTS);
      if (projectsData) {
        const parsed: ProjectState[] = JSON.parse(projectsData);
        const hydratedProjects = parsed.map(project => ({
          ...project,
          images: project.images 
            ? normalizeImageUris(project.images).map(img => ProjectImageStore.fixPath(img))
            : project.images,
          slides: project.slides?.map(slide => {
            const fixedImageUri = ProjectImageStore.fixPath(normalizeImageUri(slide.image));
            
            const legacyFontId =
              slide.fontId === LEGACY_SYSTEM_FONT_ID
                ? DEFAULT_SLIDE_FONT_ID
                : slide.fontId;
            const fontOption = legacyFontId
              ? getSlideFontById(legacyFontId)
              : getSlideFontByFamily(slide.fontFamily);

            return {
              ...slide,
              image: normalizeImageUri(slide.image),
              fontId:
                legacyFontId ??
                (slide.fontFamily
                  ? getSlideFontByFamily(slide.fontFamily).id
                  : DEFAULT_SLIDE_FONT_ID),
              fontFamily: resolveFontFamilyForPlatform(fontOption, platformKey),
              textEffects: sanitizeTextEffects(slide.textEffects),
            };
          }) || [],
        }));

        const migrations = await Promise.all(
          hydratedProjects.map(project => this.migrateProjectImages(project)),
        );
        const migratedProjects = migrations.map(m => m.project);
        const anyChanged = migrations.some(m => m.changed);

        if (anyChanged) {
          await AsyncStorage.setItem(
            this.STORAGE_KEYS.RECENT_PROJECTS,
            JSON.stringify(migratedProjects),
          );
        }

        return migratedProjects;
      }
      return [];
    } catch (error) {
      console.error('Error getting recent projects:', error);
      return [];
    }
  }

  // Delete a recent project
  async deleteRecentProject(projectId: string): Promise<void> {
    try {
      const recentProjects = await this.getRecentProjects();
      const filteredProjects = recentProjects.filter(p => p.id !== projectId);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RECENT_PROJECTS,
        JSON.stringify(filteredProjects)
      );
    } catch (error) {
      console.error('Error deleting recent project:', error);
    }
  }

  // Save preferences
  async savePreferences(preferences: Partial<AppState['preferences']>): Promise<void> {
    try {
      const currentPrefs = await this.getPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PREFERENCES,
        JSON.stringify(updatedPrefs)
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  // Get preferences
  async getPreferences(): Promise<AppState['preferences']> {
    try {
      const prefsData = await AsyncStorage.getItem(this.STORAGE_KEYS.PREFERENCES);
      if (prefsData) {
        return JSON.parse(prefsData);
      }

      // Return defaults
      return {
        theme: 'light',
        language: 'en',
        soundEnabled: true,
        hapticsEnabled: true
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      // Return defaults on error
      return {
        theme: 'light',
        language: 'en',
        soundEnabled: true,
        hapticsEnabled: true
      };
    }
  }

  // Save entire app state
  async saveAppState(state: AppState): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.APP_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('Error saving app state:', error);
      throw error;
    }
  }

  // Load entire app state
  async loadAppState(): Promise<AppState | null> {
    try {
      const stateData = await AsyncStorage.getItem(this.STORAGE_KEYS.APP_STATE);
      if (stateData) {
        return JSON.parse(stateData);
      }
      return null;
    } catch (error) {
      console.error('Error loading app state:', error);
      return null;
    }
  }

  // Check if first launch
  async isFirstLaunch(): Promise<boolean> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const firstLaunch = await AsyncStorage.getItem(this.STORAGE_KEYS.FIRST_LAUNCH);
        // Treat anything other than an explicit "false" as "onboarding not completed".
        return firstLaunch !== 'false';
      },
      false,
      'isFirstLaunch'
    );
  }

  // Set onboarding completed
  async setOnboardingCompleted(): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        await AsyncStorage.setItem(this.STORAGE_KEYS.FIRST_LAUNCH, 'false');
      },
      undefined,
      'setOnboardingCompleted'
    );
  }

  // Reset onboarding state
  async resetOnboarding(): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.FIRST_LAUNCH);
      },
      undefined,
      'resetOnboarding'
    );
  }

  // Clear all storage
  async clearAllStorage(): Promise<void> {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all storage:', error);
      throw error;
    }
  }

  // Get storage info
  async getStorageInfo(): Promise<{ totalSize: number; keys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      // Calculate total size (rough estimate)
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return { totalSize, keys: [...keys] };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalSize: 0, keys: [] };
    }
  }

  // Auto-save functionality
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  startAutoSave(project: ProjectState, intervalMs: number = 30000): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveCurrentProject(project);
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Export/Import functionality for backup
  async exportData(): Promise<string> {
    try {
      const appState = await this.loadAppState();
      const recentProjects = await this.getRecentProjects();
      const preferences = await this.getPreferences();

      const exportData = {
        appState,
        recentProjects,
        preferences,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (data.appState) {
        await this.saveAppState(data.appState);
      }

      if (data.recentProjects) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.RECENT_PROJECTS,
          JSON.stringify(data.recentProjects)
        );
      }

      if (data.preferences) {
        await this.savePreferences(data.preferences);
      }

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // ==================== ROADMAP PROJECT METHODS ====================

  // Save current roadmap project
  async saveCurrentRoadmapProject(project: any): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const projectToSave = {
          ...project,
          lastModified: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          this.STORAGE_KEYS.CURRENT_ROADMAP_PROJECT,
          JSON.stringify(projectToSave)
        );

        // Add to recent roadmap projects
        const hasContent = project.slide && project.slide.circles?.length > 0;
        if (project.isCompleted || hasContent) {
          await this.addToRecentRoadmapProjects(projectToSave);
        }
      },
      undefined,
      'saveCurrentRoadmapProject'
    );
  }

  // Load current roadmap project
  async loadCurrentRoadmapProject(): Promise<any | null> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        const projectData = await AsyncStorage.getItem(
          this.STORAGE_KEYS.CURRENT_ROADMAP_PROJECT
        );
        if (projectData) {
          return JSON.parse(projectData);
        }
        return null;
      },
      null,
      'loadCurrentRoadmapProject'
    );
  }

  // Clear current roadmap project
  async clearCurrentRoadmapProject(): Promise<void> {
    return StorageInitializer.safeStorageOperation(
      async () => {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_ROADMAP_PROJECT);
      },
      undefined,
      'clearCurrentRoadmapProject'
    );
  }

  // Add to recent roadmap projects
  private async addToRecentRoadmapProjects(project: any): Promise<void> {
    try {
      const recentProjects = await this.getRecentRoadmapProjects();

      // Remove if already exists
      const filteredProjects = recentProjects.filter((p: any) => p.id !== project.id);

      // Add to beginning
      filteredProjects.unshift(project);

      // Keep only last 10 projects
      const trimmedProjects = filteredProjects.slice(0, 10);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RECENT_ROADMAP_PROJECTS,
        JSON.stringify(trimmedProjects)
      );
    } catch (error) {
      console.error('Error adding to recent roadmap projects:', error);
    }
  }

  // Get recent roadmap projects
  async getRecentRoadmapProjects(): Promise<any[]> {
    try {
      const projectsData = await AsyncStorage.getItem(
        this.STORAGE_KEYS.RECENT_ROADMAP_PROJECTS
      );
      if (projectsData) {
        return JSON.parse(projectsData);
      }
      return [];
    } catch (error) {
      console.error('Error getting recent roadmap projects:', error);
      return [];
    }
  }

  // Delete a recent roadmap project
  async deleteRecentRoadmapProject(projectId: string): Promise<void> {
    try {
      const recentProjects = await this.getRecentRoadmapProjects();
      const filteredProjects = recentProjects.filter((p: any) => p.id !== projectId);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.RECENT_ROADMAP_PROJECTS,
        JSON.stringify(filteredProjects)
      );
    } catch (error) {
      console.error('Error deleting recent roadmap project:', error);
    }
  }
}

export default StorageService.getInstance();
