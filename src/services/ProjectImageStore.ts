import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Persists project images under Documents so they survive app updates.
 * Cache/tmp directories may be cleared on update, which breaks previews.
 */
const PROJECT_IMAGES_ROOT = `${RNFS.DocumentDirectoryPath}/project-images`;

const stripFileScheme = (uri: string): string =>
  uri.startsWith('file://') ? uri.slice('file://'.length) : uri;

const toFileUri = (path: string): string =>
  path.startsWith('file://') ? path : `file://${path}`;

const extractExtension = (uri: string): string => {
  const clean = uri.split('?')[0];
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match?.[1]?.toLowerCase();
  if (!ext) {
    return 'jpg';
  }
  // Normalize common variants.
  if (ext === 'jpeg') {
    return 'jpg';
  }
  return ext;
};

const isLocalFileUri = (uri: string): boolean =>
  uri.startsWith('file://') || uri.startsWith('/');

const isAssetLibraryUri = (uri: string): boolean =>
  /^ph:\/\//i.test(uri) || /^assets-library:\/\//i.test(uri);

const getProjectDir = (projectId: string): string =>
  `${PROJECT_IMAGES_ROOT}/${projectId}`;

const getProjectImagesDir = (projectId: string): string =>
  `${getProjectDir(projectId)}/images`;

const isUnderProjectImagesRoot = (pathOrUri: string): boolean => {
  const normalized = stripFileScheme(pathOrUri);
  return normalized.startsWith(PROJECT_IMAGES_ROOT);
};

class ProjectImageStore {
  private static instance: ProjectImageStore;

  static getInstance(): ProjectImageStore {
    if (!ProjectImageStore.instance) {
      ProjectImageStore.instance = new ProjectImageStore();
    }
    return ProjectImageStore.instance;
  }

  /**
   * Check whether a given URI already points at persistent project storage.
   */
  isPersistentProjectImageUri(uri: string, projectId?: string): boolean {
    if (!uri) {
      return false;
    }
    const normalized = stripFileScheme(uri);
    if (projectId) {
      return normalized.startsWith(`${getProjectImagesDir(projectId)}/`);
    }
    return isUnderProjectImagesRoot(normalized);
  }

  /**
   * Normalize a file URI into a plain filesystem path.
   */
  toPath(uri: string): string {
    return stripFileScheme(uri);
  }

  /**
   * Determine whether a file exists for the given URI.
   */
  async exists(uri: string): Promise<boolean> {
    if (!uri) {
      return false;
    }
    try {
      const path = stripFileScheme(uri);
      return RNFS.exists(path);
    } catch (error) {
      console.warn('ProjectImageStore.exists failed:', error);
      return false;
    }
  }

  /**
   * Persist a local file into Documents/project-images/<projectId>/images.
   * Returns a file:// URI when successful, or null if it cannot persist.
   */
  async persistImageForProject(params: {
    uri: string;
    projectId: string;
    slideIndex: number;
    previousUri?: string;
  }): Promise<string | null> {
    const { uri, projectId, slideIndex, previousUri } = params;
    if (!uri || !projectId) {
      return null;
    }

    // If it's already persistent and exists, keep it.
    if (this.isPersistentProjectImageUri(uri, projectId)) {
      const alreadyExists = await this.exists(uri);
      return alreadyExists ? uri : null;
    }

    // Handle iOS photo library URIs (ph:// or assets-library://).
    if (!isLocalFileUri(uri)) {
      if (Platform.OS !== 'ios' || !isAssetLibraryUri(uri)) {
        return null;
      }

      const imagesDir = getProjectImagesDir(projectId);
      await RNFS.mkdir(imagesDir);

      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
      const destPath = `${imagesDir}/slide_${slideIndex}_${uniqueSuffix}.jpg`;

      try {
        await RNFS.copyAssetsFileIOS(uri, destPath, 0, 0, 1, 1, 'contain');
      } catch (error) {
        console.warn('ProjectImageStore.copyAssetsFileIOS failed:', error);
        return null;
      }

      // Best-effort cleanup of the previous persistent file for this project.
      if (
        previousUri &&
        previousUri !== uri &&
        this.isPersistentProjectImageUri(previousUri, projectId)
      ) {
        const prevPath = stripFileScheme(previousUri);
        if (prevPath !== destPath) {
          RNFS.unlink(prevPath).catch(() => {
            // Ignore cleanup errors.
          });
        }
      }

      return toFileUri(destPath);
    }

    const sourcePath = stripFileScheme(uri);
    const sourceExists = await RNFS.exists(sourcePath);
    if (!sourceExists) {
      return null;
    }

    const imagesDir = getProjectImagesDir(projectId);
    await RNFS.mkdir(imagesDir);

    const ext = extractExtension(uri);
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
    const destPath = `${imagesDir}/slide_${slideIndex}_${uniqueSuffix}.${ext}`;

    try {
      await RNFS.copyFile(sourcePath, destPath);
    } catch (error) {
      console.warn('ProjectImageStore.copyFile failed:', error);
      return null;
    }

    // Best-effort cleanup of the previous persistent file for this project.
    if (
      previousUri &&
      previousUri !== uri &&
      this.isPersistentProjectImageUri(previousUri, projectId)
    ) {
      const prevPath = stripFileScheme(previousUri);
      if (prevPath !== destPath) {
        RNFS.unlink(prevPath).catch(() => {
          // Ignore cleanup errors.
        });
      }
    }

    return toFileUri(destPath);
  }
}

export default ProjectImageStore.getInstance();
