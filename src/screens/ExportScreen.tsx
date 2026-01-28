/**
 * Export Screen - Save and share edited images
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Share, { Social } from 'react-native-share';
import {
  Canvas,
  useImage,
  useCanvasRef,
  ImageFormat,
} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import { EffectRenderer } from '../components/effects/EffectRenderer';
import { EFFECTS } from '../domain/effects/registry';
import FeedbackService from '../services/FeedbackService';

const InstagramIcon = require('../assets/icons/export/Instagram.png');
const XIcon = require('../assets/icons/export/X.png');
const GalleryIcon = require('../assets/icons/export/Gallery.png');
const ShareIcon = require('../assets/icons/export/Share.png');

type ExportAction = 'instagram' | 'x' | 'gallery' | 'share' | null;

const EXPORT_SIZE = 1080; // Export at high resolution

export const ExportScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, effectId, params } = route.params as {
    imageUri: string;
    effectId?: string;
    params?: Record<string, any>;
  };

  const image = useImage(imageUri);
  const effect = effectId ? EFFECTS.find(e => e.id === effectId) : null;
  const canvasRef = useCanvasRef();

  const [exportingAction, setExportingAction] = useState<ExportAction>(null);

  // Capture the canvas with effect applied and return file path
  const captureProcessedImage = useCallback(async (): Promise<string> => {
    if (!image) {
      throw new Error('Image not ready');
    }
    const snapshot = canvasRef.current?.makeImageSnapshot();
    if (!snapshot) {
      throw new Error('Failed to capture canvas snapshot');
    }

    // Encode as base64 PNG for better quality
    const base64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);

    // Save to temp file
    const exportDir = `${RNFS.CachesDirectoryPath}/exports`;
    await RNFS.mkdir(exportDir).catch(() => {}); // Ignore if exists

    const exportPath = `${exportDir}/export_${Date.now()}.png`;
    await RNFS.writeFile(exportPath, base64, 'base64');

    return `file://${exportPath}`;
  }, [canvasRef, image]);

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
      FeedbackService.triggerHaptic('impactMedium');

      // Capture canvas with effect applied
      const processedImageUri = await captureProcessedImage();

      // Save to camera roll
      await CameraRoll.save(processedImageUri, { type: 'photo' });

      // Clean up temp file
      await RNFS.unlink(processedImageUri.replace('file://', '')).catch(
        () => {},
      );

      FeedbackService.triggerHaptic('notificationSuccess');
      Alert.alert('Success', 'Image saved to Photos!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      FeedbackService.triggerHaptic('notificationError');
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setExportingAction(null);
    }
  };

  const handleShare = async () => {
    try {
      setExportingAction('share');
      FeedbackService.triggerHaptic('impactMedium');

      // Capture canvas with effect applied
      const processedImageUri = await captureProcessedImage();

      await Share.open({
        url: processedImageUri,
        type: 'image/png',
      });

      // Clean up temp file
      await RNFS.unlink(processedImageUri.replace('file://', '')).catch(
        () => {},
      );

      FeedbackService.triggerHaptic('notificationSuccess');
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
        FeedbackService.triggerHaptic('notificationError');
      }
    } finally {
      setExportingAction(null);
    }
  };

  const handleShareInstagram = async () => {
    try {
      setExportingAction('instagram');
      FeedbackService.triggerHaptic('impactMedium');

      // Capture canvas with effect applied
      const processedImageUri = await captureProcessedImage();

      if (Platform.OS === 'ios') {
        // Save to camera roll first
        const savedResult = await CameraRoll.save(processedImageUri, {
          type: 'photo',
        });

        const localIdentifier =
          typeof savedResult === 'string' ? savedResult : savedResult?.node?.id || '';

        if (!localIdentifier) {
          throw new Error('Failed to get photo identifier');
        }

        // Open Instagram with the photo - this shows the native share modal
        const instagramUrl = `instagram://library?LocalIdentifier=${encodeURIComponent(
          localIdentifier,
        )}`;

        const canOpen = await Linking.canOpenURL('instagram://');
        if (!canOpen) {
          throw new Error('instagram_not_installed');
        }

        await Linking.openURL(instagramUrl);
      } else {
        // Android - use share single
        await Share.shareSingle({
          url: processedImageUri,
          type: 'image/png',
          social: Social.Instagram,
        });
      }

      // Clean up temp file
      await RNFS.unlink(processedImageUri.replace('file://', '')).catch(
        () => {},
      );

      FeedbackService.triggerHaptic('notificationSuccess');
    } catch (error: any) {
      console.error('Instagram share error:', error);
      FeedbackService.triggerHaptic('notificationError');

      if (error?.message === 'instagram_not_installed') {
        Alert.alert(
          'Instagram not installed',
          'Please install Instagram to share.',
        );
      } else if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share to Instagram');
      }
    } finally {
      setExportingAction(null);
    }
  };

  const handleShareX = async () => {
    try {
      setExportingAction('x');
      FeedbackService.triggerHaptic('impactMedium');

      // Capture canvas with effect applied
      const processedImageUri = await captureProcessedImage();

      await Share.shareSingle({
        url: processedImageUri,
        type: 'image/png',
        social: Social.Twitter,
      });

      // Clean up temp file
      await RNFS.unlink(processedImageUri.replace('file://', '')).catch(
        () => {},
      );

      FeedbackService.triggerHaptic('notificationSuccess');
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
        FeedbackService.triggerHaptic('notificationError');
      }
    } finally {
      setExportingAction(null);
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => navigation.goBack()} />
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        {/* Preview */}
        <View style={styles.previewContainer}>
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
                effect={effect}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    height: 0,
    overflow: 'hidden',
  },
  preview: {
    borderRadius: 12,
    overflow: 'hidden',
    transform: [{ scale: 300 / EXPORT_SIZE }],
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

export default ExportScreen;
