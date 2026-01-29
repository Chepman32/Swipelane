/**
 * Export Modal - Save and share edited images
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Share, { Social } from 'react-native-share';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import {
  Canvas,
  useImage,
  useCanvasRef,
  ImageFormat,
} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import { EffectRenderer } from './effects/EffectRenderer';
import { EFFECTS } from '../domain/effects/registry';
import FeedbackService from '../services/FeedbackService';

const InstagramIcon = require('../assets/icons/export/Instagram.png');
const XIcon = require('../assets/icons/export/X.png');
const GalleryIcon = require('../assets/icons/export/Gallery.png');
const ShareIcon = require('../assets/icons/export/Share.png');

type ExportAction = 'instagram' | 'x' | 'gallery' | 'share' | null;

const EXPORT_SIZE = 1080; // Export at high resolution
const SHARE_MESSAGE = 'Created with Texora';

const ensureFileScheme = (uri: string): string => {
  if (/^(file|content|ph|assets-library):\/\//i.test(uri)) {
    return uri;
  }
  return `file://${uri}`;
};

export interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri?: string;
  imageUris?: string[];
  effectId?: string;
  params?: Record<string, any>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  imageUri,
  imageUris,
  effectId,
  params,
}) => {
  const primaryImageUri = imageUri || imageUris?.[0] || '';
  const normalizedPrimaryImageUri = primaryImageUri
    ? ensureFileScheme(primaryImageUri)
    : null;
  const image = useImage(normalizedPrimaryImageUri);
  const effect = effectId ? EFFECTS.find(e => e.id === effectId) : null;
  const canvasRef = useCanvasRef();
  const tempFilesRef = useRef<string[]>([]);
  const cachedExportUriRef = useRef<string | null>(null);

  const [exportingAction, setExportingAction] = useState<ExportAction>(null);

  useEffect(() => {
    if (visible && !primaryImageUri) {
      Alert.alert('Error', 'No image available to export.', [
        { text: 'OK', onPress: onClose },
      ]);
    }
  }, [visible, primaryImageUri, onClose]);

  // Reset cached export URI when modal opens with new images
  useEffect(() => {
    if (visible) {
      cachedExportUriRef.current = null;
    }
  }, [visible, imageUri, imageUris]);

  useEffect(() => {
    return () => {
      tempFilesRef.current.forEach(path => {
        RNFS.unlink(path).catch(() => {});
      });
      tempFilesRef.current = [];
    };
  }, []);

  // Capture the canvas with effect applied and return file path
  const captureProcessedImage = useCallback(async (): Promise<string> => {
    if (cachedExportUriRef.current) {
      return cachedExportUriRef.current;
    }

    if (image && canvasRef.current) {
      const snapshot = canvasRef.current.makeImageSnapshot();
      if (snapshot) {
        const base64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);

        // Save to temp file
        const exportDir = `${RNFS.CachesDirectoryPath}/exports`;
        await RNFS.mkdir(exportDir).catch(() => {}); // Ignore if exists

        const exportPath = `${exportDir}/export_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.png`;
        await RNFS.writeFile(exportPath, base64, 'base64');
        tempFilesRef.current.push(exportPath);

        const fileUri = `file://${exportPath}`;
        cachedExportUriRef.current = fileUri;
        return fileUri;
      }
    }

    if (!primaryImageUri) {
      throw new Error('Image not ready');
    }

    const fallbackUri = ensureFileScheme(primaryImageUri);
    cachedExportUriRef.current = fallbackUri;
    return fallbackUri;
  }, [canvasRef, image, primaryImageUri]);

  const getShareUris = useCallback(async (): Promise<string[]> => {
    if (imageUris && imageUris.length > 0) {
      return imageUris.map(ensureFileScheme);
    }
    const processedImageUri = await captureProcessedImage();
    return [processedImageUri];
  }, [imageUris, captureProcessedImage]);

  // Calculate canvas dimensions to maintain aspect ratio
  const canvasDimensions = useMemo(() => {
    if (!image) return { width: EXPORT_SIZE, height: EXPORT_SIZE };
    const imgWidth = image.width();
    const imgHeight = image.height();
    const aspectRatio = imgWidth / imgHeight;

    if (aspectRatio > 1) {
      return {
        width: EXPORT_SIZE,
        height: Math.round(EXPORT_SIZE / aspectRatio),
      };
    }
    return {
      width: Math.round(EXPORT_SIZE * aspectRatio),
      height: EXPORT_SIZE,
    };
  }, [image]);

  const handleSave = async () => {
    try {
      setExportingAction('gallery');
      FeedbackService.triggerHaptic(HapticFeedbackTypes.impactMedium);

      if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY;
        const result = await check(permission);

        if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          if (requestResult !== RESULTS.GRANTED && requestResult !== RESULTS.LIMITED) {
            throw new Error('Permission denied');
          }
        } else if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
          Alert.alert(
            'Permission Required',
            'Please enable photo library access in settings to save images.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const shareUris = await getShareUris();

      for (const uri of shareUris) {
        await CameraRoll.save(uri, { type: 'photo' });
      }

      FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationSuccess);
      Alert.alert('Success', shareUris.length > 1 ? 'Images saved to Photos!' : 'Image saved to Photos!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationError);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setExportingAction(null);
    }
  };

  const handleShare = async () => {
    try {
      setExportingAction('share');
      FeedbackService.triggerHaptic(HapticFeedbackTypes.impactMedium);

      const shareUris = await getShareUris();

      await Share.open({
        urls: shareUris,
        type: 'image/png',
        message: SHARE_MESSAGE,
        failOnCancel: false,
      });

      FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationSuccess);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
        FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationError);
      }
    } finally {
      setExportingAction(null);
    }
  };

  const handleShareInstagram = async () => {
    let shareUris: string[] = [];
    try {
      setExportingAction('instagram');
      FeedbackService.triggerHaptic(HapticFeedbackTypes.impactMedium);

      shareUris = await getShareUris();
      const fileUri = shareUris[0];

      // Verify file exists
      const exists = await RNFS.exists(fileUri.replace('file://', ''));
      if (!exists) {
        throw new Error('File generation failed');
      }

      console.log('Sharing to Instagram:', shareUris);

      if (shareUris.length > 1) {
        // For carousel (multiple images), we use Share.open but target Instagram
        // This is the most reliable way to get the carousel option in the share sheet
        await Share.open({
          urls: shareUris,
          type: 'image/png',
          message: 'Created with Texora',
        });
      } else {
        // For single image, try specific share (Stories usually)
        await Share.shareSingle({
          social: Social.Instagram,
          url: fileUri,
          type: 'image/png',
          message: 'Created with Texora',
        });
      }

      FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationSuccess);
    } catch (error: any) {
      console.error('Instagram share error:', error);

      // Fallback
      if (shareUris.length > 0) {
        try {
           console.log('Fallback to generic share for Instagram');
           await Share.open({
            urls: shareUris,
            type: 'image/png',
            message: 'Created with Texora',
          });
          FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationSuccess);
        } catch (fallbackError) {
           console.log('Fallback cancelled or failed', fallbackError);
        }
      } else {
        FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationError);
        Alert.alert('Error', 'Failed to share to Instagram');
      }
    } finally {
      setExportingAction(null);
    }
  };

  const handleShareX = async () => {
    let shareUris: string[] = [];
    try {
      setExportingAction('x');
      FeedbackService.triggerHaptic(HapticFeedbackTypes.impactMedium);

      shareUris = await getShareUris();
      console.log('Sharing to X:', shareUris);

      // Use shareSingle to open Twitter-native modal
      // Note: We cast to any because 'urls' might not be in the strict type definition
      // but is supported by some underlying implementations or we fallback to single url
      if (shareUris.length > 1) {
         await Share.shareSingle({
          social: Social.Twitter,
          urls: shareUris,
          type: 'image/png',
          message: 'Created with Texora',
        } as any);
      } else {
        await Share.shareSingle({
          social: Social.Twitter,
          url: shareUris[0],
          type: 'image/png',
          message: 'Created with Texora',
        });
      }

      FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationSuccess);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
        // Fallback to Share.open if shareSingle fails (e.g. app not installed or urls not supported)
        try {
          await Share.open({
            urls: shareUris,
            type: 'image/png',
            message: 'Created with Texora',
          });
        } catch (fallbackError) {
          FeedbackService.triggerHaptic(HapticFeedbackTypes.notificationError);
          Alert.alert('Error', 'Failed to share to X');
        }
      }
    } finally {
      setExportingAction(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          {/* Preview (hidden, used for effect processing) */}
          <View
            style={[
              styles.previewContainer,
              { width: canvasDimensions.width, height: canvasDimensions.height },
            ]}
          >
            {image && (
              <Canvas
                ref={canvasRef}
                style={[
                  styles.preview,
                  {
                    width: canvasDimensions.width,
                    height: canvasDimensions.height,
                  },
                ]}
              >
                <EffectRenderer
                  image={image}
                  effect={effect ?? null}
                  params={params || null}
                  x={0}
                  y={0}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                />
              </Canvas>
            )}
          </View>

          {/* Export Options List */}
          <View style={styles.exportList}>
            <TouchableOpacity
              onPress={handleShareInstagram}
              disabled={exportingAction !== null}
              style={styles.rowItem}
            >
              <View style={styles.iconContainer}>
                {exportingAction === 'instagram' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Image
                    source={InstagramIcon}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.rowLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareX}
              disabled={exportingAction !== null}
              style={styles.rowItem}
            >
              <View style={styles.iconContainer}>
                {exportingAction === 'x' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Image
                    source={XIcon}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.rowLabel}>X</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={exportingAction !== null}
              style={styles.rowItem}
            >
              <View style={styles.iconContainer}>
                {exportingAction === 'gallery' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Image
                    source={GalleryIcon}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.rowLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              disabled={exportingAction !== null}
              style={styles.rowItem}
            >
              <View style={styles.iconContainer}>
                {exportingAction === 'share' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Image
                    source={ShareIcon}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.rowLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 8, 16, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#0F0F1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 6,
    paddingTop: 6,
  },
  previewContainer: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0,
    overflow: 'hidden',
  },
  preview: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportList: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  rowItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F2E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    width: 26,
    height: 26,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
  },
});

export default ExportModal;
