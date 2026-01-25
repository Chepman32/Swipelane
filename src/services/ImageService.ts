/**
 * Image Service for Text-to-Slides app
 * Handles image picking, camera functionality, and image processing
 */

import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import RNImageManipulator, {
  RNImageManipulatorResult,
} from 'react-native-image-manipulator';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';
import { Alert, Platform, Linking } from 'react-native';

export interface ImagePickerOptions {
  mediaType?: MediaType;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png';
  quality?: number;
  compress?: number;
}

class ImageService {
  private static instance: ImageService;

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Check and request camera permission
   */
  private async checkCameraPermission(): Promise<boolean> {
    const permission: Permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }

    return false;
  }

  /**
   * Check photo library permission status without requesting
   */
  public async checkPhotoLibraryPermissionStatus(): Promise<string> {
    const permission: Permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

    try {
      const result = await check(permission);
      return result;
    } catch (error) {
      console.error('Error checking photo library permission status:', error);
      return RESULTS.UNAVAILABLE;
    }
  }

  /**
   * Check and request photo library permission
   */
  private async checkPhotoLibraryPermission(): Promise<boolean> {
    const permission: Permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

    try {
      const result = await check(permission);
      console.log('Permission check result:', result);

      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
        console.log('Requesting permission...');
        const requestResult = await request(permission);
        console.log('Permission request result:', requestResult);
        return requestResult === RESULTS.GRANTED;
      }

      // If permission is unavailable or restricted, try to request anyway
      if (result === RESULTS.UNAVAILABLE || result === RESULTS.RESTRICTED) {
        console.log('Permission unavailable/restricted, trying to request...');
        const requestResult = await request(permission);
        console.log('Permission request result:', requestResult);
        return requestResult === RESULTS.GRANTED;
      }

      return false;
    } catch (error) {
      console.error('Error checking photo library permission:', error);
      return false;
    }
  }

  /**
   * Show image picker options (camera or gallery)
   */
  public async showImagePickerOptions(t: (key: string, options?: any) => string): Promise<string | null> {
    return new Promise(resolve => {
      Alert.alert(t('select_image_title'), t('select_image_message'), [
        {
          text: t('camera'),
          onPress: () => this.pickFromCamera(t).then(resolve),
        },
        {
          text: t('photo_library'),
          onPress: () => this.pickFromGallery(t).then(resolve),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]);
    });
  }

  /**
   * Pick image from camera
   */
  public async pickFromCamera(t: (key: string, options?: any) => string): Promise<string | null> {
    const hasPermission = await this.checkCameraPermission();

    if (!hasPermission) {
      Alert.alert(
        t('camera_permission_required'),
        t('camera_permission_message'),
        [{ text: t('ok') }],
      );
      return null;
    }

    return new Promise(resolve => {
      const options: ImagePickerOptions = {
        mediaType: 'photo',
        quality: 1.0, // Use highest quality to preserve original image
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          resolve(response.assets[0].uri || null);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Pick image from gallery
   */
  public async pickFromGallery(t: (key: string, options?: any) => string): Promise<string | null> {
    try {
      const hasPermission = await this.checkPhotoLibraryPermission();

      if (!hasPermission) {
        Alert.alert(
          t('photo_library_permission_required'),
          t('photo_library_permission_message'),
          [
            { text: t('ok') },
            {
              text: t('settings'),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return null;
      }

      return new Promise(resolve => {
        const options: ImagePickerOptions = {
          mediaType: 'photo',
          quality: 1.0, // Use highest quality to preserve original image
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
          if (response.didCancel || response.errorMessage) {
            console.log(
              'Image picker cancelled or error:',
              response.errorMessage,
            );
            resolve(null);
            return;
          }

          if (response.assets && response.assets[0]) {
            console.log('Image selected:', response.assets[0].uri);
            resolve(response.assets[0].uri || null);
          } else {
            console.log('No image selected');
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error in pickFromGallery:', error);
      Alert.alert(
        t('error'),
        t('photo_library_access_failed'),
        [{ text: t('ok') }],
      );
      return null;
    }
  }

  /**
   * Process image (resize, compress, format conversion)
   */
  public async processImage(
    imageUri: string,
    options: ImageProcessingOptions = {},
  ): Promise<string | null> {
    try {
      const {
        width = 1080,
        height = 1080,
        format = 'jpeg',
        quality = 0.8,
        compress = 0.8,
      } = options;

      // Only compress the image, don't resize to maintain original aspect ratio
      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(
          imageUri,
          [], // No resize operations - keep original dimensions
          {
            compress,
            format,
          },
        );

      return result.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  }

  /**
   * Create a square crop of the image
   */
  public async cropToSquare(imageUri: string): Promise<string | null> {
    try {
      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(
          imageUri,
          [{ crop: { originX: 0, originY: 0, width: 1080, height: 1080 } }],
          {
            compress: 0.8,
            format: 'jpeg',
          },
        );

      return result.uri;
    } catch (error) {
      console.error('Error cropping image:', error);
      return null;
    }
  }

  /**
   * Apply filters to image
   */
  public async applyFilter(
    imageUri: string,
    filter:
      | 'none'
      | 'grayscale'
      | 'sepia'
      | 'vintage'
      | 'blur'
      | 'brightness'
      | 'contrast',
  ): Promise<string | null> {
    try {
      let actions: any[] = [];

      switch (filter) {
        case 'grayscale':
          actions = [{ grayscale: 1 }];
          break;
        case 'sepia':
          actions = [{ sepia: 0.5 }];
          break;
        case 'vintage':
          actions = [{ sepia: 0.3 }, { grayscale: 0.2 }];
          break;
        case 'blur':
          actions = [{ blur: 2 }];
          break;
        case 'brightness':
          actions = [{ brightness: 0.2 }];
          break;
        case 'contrast':
          actions = [{ contrast: 1.2 }];
          break;
        default:
          actions = [];
      }

      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(imageUri, actions, {
          compress: 0.8,
          format: 'jpeg',
        });

      return result.uri;
    } catch (error) {
      console.error('Error applying filter:', error);
      return null;
    }
  }

  /**
   * Apply multiple effects to image
   */
  public async applyEffects(
    imageUri: string,
    effects: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      blur?: number;
      sharpen?: number;
    },
  ): Promise<string | null> {
    try {
      const actions: any[] = [];

      if (effects.brightness !== undefined) {
        actions.push({ brightness: effects.brightness });
      }
      if (effects.contrast !== undefined) {
        actions.push({ contrast: effects.contrast });
      }
      if (effects.blur !== undefined) {
        actions.push({ blur: effects.blur });
      }

      if (actions.length === 0) {
        return imageUri;
      }

      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(imageUri, actions, {
          compress: 0.8,
          format: 'jpeg',
        });

      return result.uri;
    } catch (error) {
      console.error('Error applying effects:', error);
      return null;
    }
  }

  /**
   * Crop image to specific dimensions
   */
  public async cropImage(
    imageUri: string,
    cropOptions: {
      originX: number;
      originY: number;
      width: number;
      height: number;
    },
  ): Promise<string | null> {
    try {
      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(
          imageUri,
          [
            {
              crop: {
                originX: cropOptions.originX,
                originY: cropOptions.originY,
                width: cropOptions.width,
                height: cropOptions.height,
              },
            },
          ],
          {
            compress: 0.8,
            format: 'jpeg',
          },
        );

      return result.uri;
    } catch (error) {
      console.error('Error cropping image:', error);
      return null;
    }
  }

  /**
   * Rotate image
   */
  public async rotateImage(
    imageUri: string,
    degrees: number,
  ): Promise<string | null> {
    try {
      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(imageUri, [{ rotate: degrees }], {
          compress: 0.8,
          format: 'jpeg',
        });

      return result.uri;
    } catch (error) {
      console.error('Error rotating image:', error);
      return null;
    }
  }

  /**
   * Flip image horizontally or vertically
   */
  public async flipImage(
    imageUri: string,
    direction: 'horizontal' | 'vertical',
  ): Promise<string | null> {
    try {
      const result: RNImageManipulatorResult =
        await RNImageManipulator.manipulate(imageUri, [{ flip: direction }], {
          compress: 0.8,
          format: 'jpeg',
        });

      return result.uri;
    } catch (error) {
      console.error('Error flipping image:', error);
      return null;
    }
  }

  /**
   * Get predefined filter presets
   */
  public getFilterPresets() {
    return {
      none: { name: 'None', description: 'No filter applied' },
      grayscale: {
        name: 'Grayscale',
        description: 'Convert to black and white',
      },
      sepia: { name: 'Sepia', description: 'Vintage sepia tone' },
      vintage: { name: 'Vintage', description: 'Aged vintage look' },
      blur: { name: 'Blur', description: 'Soft blur effect' },
      brightness: { name: 'Bright', description: 'Increase brightness' },
      contrast: { name: 'High Contrast', description: 'Increase contrast' },
    };
  }

  /**
   * Get predefined effect presets
   */
  public getEffectPresets() {
    return {
      dramatic: {
        name: 'Dramatic',
        description: 'High contrast and saturation',
        effects: { brightness: 0.1, contrast: 1.3, saturation: 1.2 },
      },
      soft: {
        name: 'Soft',
        description: 'Gentle, muted tones',
        effects: { brightness: 0.2, contrast: 0.9, blur: 0.5 },
      },
      vibrant: {
        name: 'Vibrant',
        description: 'Bright and colorful',
        effects: { brightness: 0.3, contrast: 1.1, saturation: 1.4 },
      },
      moody: {
        name: 'Moody',
        description: 'Dark and atmospheric',
        effects: { brightness: -0.2, contrast: 1.2, saturation: 0.8 },
      },
    };
  }

  /**
   * Generate a placeholder image with text
   */
  public generatePlaceholderImage(
    width: number,
    height: number,
    text?: string,
  ): string {
    if (text) {
      return `https://placehold.co/${width}x${height}?text=${encodeURIComponent(
        text,
      )}`;
    }
    return `https://placehold.co/${width}x${height}`;
  }

  /**
   * Validate if a string is a valid image URI
   */
  public isValidImageUri(uri: string): boolean {
    if (!uri || typeof uri !== 'string') {
      return false;
    }

    // Check if it's a local file URI
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      return true;
    }

    // Check if it's a valid URL
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  }
}

export default ImageService.getInstance();
