import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
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

type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ImageSelection: { text: string; images?: string[] };
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
  Settings: undefined;
};

type ImageSelectionRouteProp = RouteProp<RootStackParamList, 'ImageSelection'>;
type ImageSelectionNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Editor'
>;

const ImageSelectionScreen: React.FC = () => {
  const route = useRoute<ImageSelectionRouteProp>();
  const navigation = useNavigation<ImageSelectionNavigationProp>();
  const { text, images: initialImages } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const optimizedText = optimizeForSlides(text);
  const optimalSlideCount = getOptimalSlideCount(optimizedText);
  const computedSlides = smartSplit(optimizedText, optimalSlideCount);
  const slides =
    computedSlides && computedSlides.length > 0
      ? computedSlides
      : [optimizedText || text || 'No content'];

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
        }
      } catch (error) {
        console.error('Failed to restore selected images:', error);
      }
    };

    restoreImages();

    return () => {
      isActive = false;
    };
  }, [requiredImages]);

  const handleSelectImage = async (index: number) => {
    FeedbackService.buttonTap();

    try {
      // First try to get permission by directly calling pickFromGallery
      const imageUri = await ImageService.pickFromGallery();

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
    navigation.navigate('Editor', { text, images: normalizedImages });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.subtitle}>
        {t('image_selection_subtitle', {
          count: requiredImages,
          plural: requiredImages > 1 ? 's' : '',
        })}
      </Text>

      <ScrollView style={styles.content}>
        {slides.map((slideText, index) => (
          <View key={index} style={styles.slideContainer}>
            <Text style={styles.slideTitle}>
              {t('image_selection_slide', { number: index + 1 })}
            </Text>
            <Text style={styles.slidePreview} numberOfLines={3}>
              {slideText}
            </Text>

            <View style={styles.imageOptions}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleSelectImage(index)}
              >
                <Text style={styles.imageButtonText}>
                  {t('image_selection_select_image')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imageButton, styles.plainButton]}
                onPress={() => handleUsePlainBackground(index)}
              >
                <Text style={styles.imageButtonText}>
                  {t('image_selection_plain_background')}
                </Text>
              </TouchableOpacity>
            </View>

            {hasUserMadeChoice[index] ? (
              <TouchableOpacity
                style={styles.imagePreview}
                onPress={() => handleSelectImage(index)}
              >
                {selectedImages[index] !== '' ? (
                  <Image
                    source={{ uri: selectedImages[index] }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.plainBackgroundPreview}>
                    <Text style={styles.plainBackgroundText}>
                      {t('image_selection_plain_background')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.emptyImagePreview}
                onPress={() => handleSelectImage(index)}
              >
                <Text style={styles.emptyImageText}>
                  {t('image_selection_no_image')}
                </Text>
              </TouchableOpacity>
            )}
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
        <Text style={styles.continueButtonText}>
          {t('image_selection_continue')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  slideContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 15,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slidePreview: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  plainButton: {
    backgroundColor: '#666',
  },
  imageButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  selectedText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: 'bold',
  },
  imagePreview: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  plainBackgroundPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainBackgroundText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyImagePreview: {
    marginTop: 10,
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  emptyImageText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#ccc',
    padding: 15,
    margin: 8,
    marginBottom: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#007AFF',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ImageSelectionScreen;
