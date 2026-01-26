import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  StatusBar,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ImageService from '../services/ImageService';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import {
  smartSplit,
  getOptimalSlideCount,
  optimizeForSlides,
} from '../utils/textUtils';
import { useLanguage } from '../context/LanguageContext';
import type { ProjectState } from '../services/StorageService';

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ImageSelection: { text: string; projectId: string; images?: string[] };
  Editor: { text: string; images: string[]; projectId: string };
  Preview: { slides: any[] };
  Settings: undefined;
};

type ImageSelectionRouteProp = RouteProp<RootStackParamList, 'ImageSelection'>;
type ImageSelectionNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Editor'
>;

const PannableImage = ({ uri, onPress }: { uri: string; onPress: () => void }) => {
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setImageDimensions(null);
  }, [uri]);

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
  };

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
  };

  if (!imageDimensions || !containerDimensions) {
    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onLayout={handleLayout}
        onPress={onPress}
      >
        <Image
          source={{ uri }}
          style={styles.previewImage}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />
      </TouchableOpacity>
    );
  }

  const containerAspect = containerDimensions.width / containerDimensions.height;
  const imageAspect = imageDimensions.width / imageDimensions.height;
  const isTooTall = imageAspect < containerAspect;

  let renderWidth, renderHeight;

  if (isTooTall) {
    renderWidth = containerDimensions.width;
    renderHeight = renderWidth / imageAspect;
  } else {
    renderHeight = containerDimensions.height;
    renderWidth = renderHeight * imageAspect;
  }

  return (
    <View style={styles.imageContainer}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ width: renderWidth, height: renderHeight }}
        horizontal={!isTooTall}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
        <TouchableOpacity onPress={onPress}>
          <Image
            source={{ uri }}
            style={{ width: renderWidth, height: renderHeight }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const ImageSelectionScreen: React.FC = () => {
  const route = useRoute<ImageSelectionRouteProp>();
  const navigation = useNavigation<ImageSelectionNavigationProp>();
  const { text, images: initialImages, projectId } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Set translated navigation title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('image_selection_title'),
      headerBackTitle: t('back'),
    });
  }, [navigation, t]);
  // Ensure we have non-zero dimensions
  const validWidth = screenWidth || Dimensions.get('window').width || 360;
  const validHeight = screenHeight || Dimensions.get('window').height || 800;

  const slideSize = Math.min(validWidth * 0.99, validWidth - 10);
  // Calculate available height for image container (matching EditorScreen logic)
  const headerHeight = Math.max(insets.top, 20) + 60; // Safe area + title height
  const previewButtonHeight = 80; // Height for preview button + margins
  const availableHeight = validHeight - headerHeight - previewButtonHeight;
  const imageContainerHeight = availableHeight;

  const optimizedText = optimizeForSlides(text);
  const optimalSlideCount = getOptimalSlideCount(optimizedText);
  const computedSlides = smartSplit(optimizedText, optimalSlideCount);
  const slides = useMemo(() => 
    computedSlides && computedSlides.length > 0
      ? computedSlides
      : [optimizedText || text || 'No content'],
    [computedSlides, optimizedText, text]
  );

  const requiredImages = slides.length;

  const ensureCapacity = (images: string[]): string[] => {
    const truncated = images.slice(0, requiredImages);
    if (truncated.length < requiredImages) {
      return [
        ...truncated,
        ...Array(requiredImages - truncated.length).fill(''),
      ];
    }
    return truncated;
  };

  const [selectedImages, setSelectedImages] = useState<string[]>(() => {
    // If images are provided in navigation params, use them
    if (initialImages && initialImages.length > 0) {
      return ensureCapacity(initialImages);
    }
    // Otherwise, start with empty array
    return Array(requiredImages).fill('');
  });
  const [hasUserMadeChoice, setHasUserMadeChoice] = useState<boolean[]>(() => {
    // If images are provided, mark as having user choice
    if (initialImages && initialImages.length > 0) {
      const choiceArray = Array(initialImages.length).fill(true);
      // Ensure the array has the required length
      if (choiceArray.length < requiredImages) {
        return [...choiceArray, ...Array(requiredImages - choiceArray.length).fill(false)];
      }
      return choiceArray.slice(0, requiredImages);
    }
    return Array(requiredImages).fill(false);
  });
  const hasRestoredImages = React.useRef(false);

  const saveProjectState = useCallback(async (images: string[]) => {
    try {
      // Calculate centered positions
      const projectSlides = slides.map((slideText, index) => {
        const fontSize = 24;
        const textLength = slideText.length;
        const textPadding = 20;
        const charsPerLine = Math.max(
          1,
          Math.floor((slideSize * 0.9) / (fontSize * 0.6)),
        );
        const numberOfLines = Math.ceil(textLength / charsPerLine);
        const estimatedTextWidth = Math.min(
          slideSize * 0.9,
          textLength < charsPerLine
            ? textLength * fontSize * 0.6
            : slideSize * 0.9,
        );
        const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;
        
        const centerX = Math.max(0, (slideSize - estimatedTextWidth) / 2);
        const centerY = Math.max(0, (imageContainerHeight - estimatedTextHeight) / 2);

        return {
          id: index,
          text: slideText,
          image: images[index] || '',
          position: { x: centerX, y: centerY },
          fontSize: fontSize,
          color: '#000000',
          backgroundColor: '#ffffff',
          textAlign: 'center' as const,
          fontWeight: 'normal' as const,
          textEffects: [],
        };
      });

      const projectState: ProjectState = {
        id: projectId,
        text,
        slides: projectSlides,
        images,
        lastModified: new Date().toISOString(),
        isCompleted: false,
      };

      await StorageService.saveCurrentProject(projectState);
      console.log('Project state saved after image selection');
    } catch (error) {
      console.error('Failed to save project state:', error);
    }
  }, [slides, text, projectId, slideSize, imageContainerHeight]);

  useEffect(() => {
    if (hasRestoredImages.current) {
      return;
    }

    let isActive = true;

    const restoreImages = async () => {
      try {
        const savedProject = await StorageService.loadCurrentProject();
        if (
          !isActive ||
          !savedProject ||
          savedProject.isCompleted ||
          !savedProject.slides ||
          savedProject.slides.length === 0
        ) {
          return;
        }

        const restoredImages = Array.from(
          { length: requiredImages },
          (_, idx) => {
            const savedSlide = savedProject.slides?.[idx];
            if (!savedSlide) {
              return '';
            }
            return savedSlide.image ?? '';
          },
        );

        if (restoredImages.some(image => image !== '')) {
          hasRestoredImages.current = true;
          setSelectedImages(restoredImages);
          // Mark all restored slides as having user choice
          setHasUserMadeChoice(Array(requiredImages).fill(true));
          
          // Save project state with restored images
          await saveProjectState(restoredImages);
        }
      } catch (error) {
        console.error('Failed to restore selected images:', error);
      }
    };

    restoreImages();

    return () => {
      isActive = false;
    };
  }, [requiredImages, saveProjectState]);

  const handleSelectImage = async (index: number) => {
    FeedbackService.buttonTap();

    try {
      // First try to get permission by directly calling pickFromGallery
      const imageUri = await ImageService.pickFromGallery(t);

      if (imageUri) {
        console.log('Selected image URI:', imageUri);
        setSelectedImages(prevImages => {
          const normalized = ensureCapacity(prevImages);
          const next = [...normalized];
          next[index] = imageUri;
          return next;
        });
        setHasUserMadeChoice(prevChoices => {
          const next = [...prevChoices];
          next[index] = true;
          return next;
        });
        FeedbackService.success();

        // Check if all slides now have images selected and save project state
        const updatedChoices = [...hasUserMadeChoice];
        updatedChoices[index] = true;
        if (updatedChoices.filter(choice => choice).length === requiredImages) {
          const updatedImages = [...selectedImages];
          updatedImages[index] = imageUri;
          saveProjectState(updatedImages);
        }

        // Try to process the image in the background (optional)
        ImageService.processImage(imageUri, {
          width: 1080,
          height: 1920, // Use different dimensions to avoid forcing square
          quality: 0.8,
        })
          .then(processedUri => {
            if (!processedUri) {
              return;
            }
            console.log('Processed image URI:', processedUri);
            setSelectedImages(prevImages => {
              const normalized = ensureCapacity(prevImages);
              if (normalized[index] !== imageUri) {
                return prevImages;
              }
              const next = [...normalized];
              next[index] = processedUri;
              return next;
            });
          })
          .catch(err => {
            console.log('Image processing failed, using original:', err);
          });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      FeedbackService.error();
      Alert.alert(
        t('image_selection_error_title'),
        t('image_selection_error_select_failed'),
      );
    }
  };

  const handleUsePlainBackground = (index: number) => {
    FeedbackService.buttonTap();
    setSelectedImages(prevImages => {
      const normalized = ensureCapacity(prevImages);
      const next = [...normalized];
      next[index] = '';
      return next;
    });
    setHasUserMadeChoice(prevChoices => {
      const next = [...prevChoices];
      next[index] = true;
      return next;
    });
    FeedbackService.success();

    // Check if all slides now have images selected and save project state
    const updatedChoices = [...hasUserMadeChoice];
    updatedChoices[index] = true;
    if (updatedChoices.filter(choice => choice).length === requiredImages) {
      const updatedImages = [...selectedImages];
      updatedImages[index] = '';
      saveProjectState(updatedImages);
    }
  };

  const handleContinue = () => {
    FeedbackService.buttonTap();

    const normalizedImages = ensureCapacity(selectedImages);

    // Check if user has made a choice for all slides
    const choicesMade = hasUserMadeChoice.filter(choice => choice).length;

    if (choicesMade < requiredImages) {
      FeedbackService.error();
      Alert.alert(
        t('image_selection_error_title'),
        t('image_selection_error', { count: requiredImages }),
      );
      return;
    }

    FeedbackService.success();
    // Navigate to editor with text and selected images
    if (normalizedImages.some((img, idx) => selectedImages[idx] !== img)) {
      setSelectedImages(normalizedImages);
    }
    navigation.navigate('Editor', { text, images: normalizedImages, projectId });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {t('image_selection_subtitle', { count: requiredImages, plural: requiredImages > 1 ? 's' : '' })}
      </Text>

      <ScrollView style={styles.content}>
        {slides.map((slideText, index) => (
          <View key={index} style={styles.slideCard}>
            <View style={styles.slideHeader}>
              <Text style={styles.slideNumber}>{t('slide_number', { number: index + 1 })}</Text>
              <Text style={styles.slideLocation} numberOfLines={2} ellipsizeMode="tail">
                {slideText}
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.selectImageButton}
                onPress={() => handleSelectImage(index)}
              >
                <Text style={styles.buttonIcon}>📷</Text>
                <Text style={styles.selectImageText}>{t('select_image')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.plainBackgroundButton}
                onPress={() => handleUsePlainBackground(index)}
              >
                <Text style={styles.buttonIcon}>+</Text>
                <Text style={styles.plainBackgroundText}>{t('plain_background')}</Text>
              </TouchableOpacity>
            </View>

            {/* Image Preview Area */}
            <View style={styles.imagePreviewArea}>
              {hasUserMadeChoice[index] && selectedImages[index] !== '' ? (
                <PannableImage
                  uri={selectedImages[index]}
                  onPress={() => handleSelectImage(index)}
                />
              ) : hasUserMadeChoice[index] ? (
                <TouchableOpacity
                  style={styles.plainBackgroundContainer}
                  onPress={() => handleSelectImage(index)}
                >
                  <View style={styles.plainBackgroundPlaceholder} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.emptyImageContainer}
                  onPress={() => handleSelectImage(index)}
                >
                  <Text style={styles.emptyImageText}>{t('no_image_selected')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          hasUserMadeChoice.filter(choice => choice).length ===
            requiredImages && styles.continueButtonEnabled,
        ]}
        onPress={handleContinue}
        disabled={
          hasUserMadeChoice.filter(choice => choice).length !== requiredImages
        }
      >
        <Text style={styles.continueButtonText}>{t('continue_to_editor')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  slideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  slideHeader: {
    marginBottom: 20,
  },
  slideNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  slideLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  selectImageButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  selectImageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  plainBackgroundButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  plainBackgroundText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  imagePreviewArea: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  plainBackgroundContainer: {
    width: '100%',
    height: '100%',
  },
  plainBackgroundPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  emptyImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImageText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#007AFF',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageSelectionScreen;
