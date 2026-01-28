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
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ImageService from '../services/ImageService';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import ProjectImageStore from '../services/ProjectImageStore';
import { normalizeImageUri, normalizeImageUris } from '../utils/imageUri';
import {
  smartSplit,
  getOptimalSlideCount,
  optimizeForSlides,
} from '../utils/textUtils';
import { useLanguage } from '../context/LanguageContext';
import type {
  ProjectState,
  SlideBackgroundGradient,
} from '../services/StorageService';
import GradientBackground from '../components/GradientBackground';
import { DEFAULT_GRADIENT, GRADIENT_VARIANTS } from '../constants/gradients';

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

  const optimizedText = useMemo(() => optimizeForSlides(text), [text]);
  const optimalSlideCount = useMemo(
    () => getOptimalSlideCount(optimizedText),
    [optimizedText],
  );
  const computedSlides = useMemo(
    () => smartSplit(optimizedText, optimalSlideCount),
    [optimalSlideCount, optimizedText],
  );
  const slides = useMemo(
    () =>
      computedSlides && computedSlides.length > 0
        ? computedSlides
        : [optimizedText || text || 'No content'],
    [computedSlides, optimizedText, text],
  );

  const requiredImages = slides.length;
  const gradientSwatchWidth = Math.min(170, Math.max(130, (validWidth - 96) / 2));
  const gradientSwatchHeight = Math.round(gradientSwatchWidth * 0.62);

  const ensureCapacity = useCallback((images: string[]): string[] => {
    const truncated = images.slice(0, requiredImages);
    if (truncated.length < requiredImages) {
      return [
        ...truncated,
        ...Array(requiredImages - truncated.length).fill(''),
      ];
    }
    return truncated;
  }, [requiredImages]);

  const ensureChoiceCapacity = useCallback((choices: boolean[]): boolean[] => {
    const truncated = choices.slice(0, requiredImages);
    if (truncated.length < requiredImages) {
      return [
        ...truncated,
        ...Array(requiredImages - truncated.length).fill(false),
      ];
    }
    return truncated;
  }, [requiredImages]);

  const ensureGradientCapacity = useCallback(
    (gradients: Array<SlideBackgroundGradient | null>): Array<SlideBackgroundGradient | null> => {
      const truncated = gradients.slice(0, requiredImages);
      if (truncated.length < requiredImages) {
        return [
          ...truncated,
          ...Array(requiredImages - truncated.length).fill(null),
        ];
      }
      return truncated;
    },
    [requiredImages],
  );

  const ensureTextCapacity = useCallback((texts: string[]): string[] => {
    const truncated = texts.slice(0, requiredImages);
    const filled = truncated.map((value, idx) => value ?? slides[idx] ?? '');
    if (filled.length < requiredImages) {
      for (let idx = filled.length; idx < requiredImages; idx += 1) {
        filled.push(slides[idx] ?? '');
      }
    }
    return filled;
  }, [requiredImages, slides]);

  const [selectedImages, setSelectedImages] = useState<string[]>(() => {
    if (initialImages && initialImages.length > 0) {
      return ensureCapacity(normalizeImageUris(initialImages));
    }
    return Array(requiredImages).fill('');
  });
  const [hasUserMadeChoice, setHasUserMadeChoice] = useState<boolean[]>(() => {
    if (initialImages && initialImages.length > 0) {
      const choiceArray = Array(initialImages.length).fill(true);
      return ensureChoiceCapacity(choiceArray);
    }
    return Array(requiredImages).fill(false);
  });
  const [slideTexts, setSlideTexts] = useState<string[]>(() => ensureTextCapacity(slides));
  const [selectedGradients, setSelectedGradients] = useState<
    Array<SlideBackgroundGradient | null>
  >(() => ensureGradientCapacity([]));
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [editingSlideDraft, setEditingSlideDraft] = useState('');
  const [gradientModalSlideIndex, setGradientModalSlideIndex] = useState<number | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const hasRestoredImages = React.useRef(false);
  const selectedImagesRef = React.useRef(selectedImages);
  const hasUserMadeChoiceRef = React.useRef(hasUserMadeChoice);
  const slideTextsRef = React.useRef(slideTexts);
  const selectedGradientsRef = React.useRef(selectedGradients);
  const restoredSlidesRef = React.useRef<ProjectState['slides'] | null>(null);
  const pendingPersistRef = React.useRef<Map<number, Promise<void>>>(new Map());
  const isFinalizingRef = React.useRef(false);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    hasUserMadeChoiceRef.current = hasUserMadeChoice;
  }, [hasUserMadeChoice]);

  useEffect(() => {
    slideTextsRef.current = slideTexts;
  }, [slideTexts]);

  useEffect(() => {
    selectedGradientsRef.current = selectedGradients;
  }, [selectedGradients]);

  const arraysEqual = <T,>(a: T[], b: T[]): boolean =>
    a.length === b.length && a.every((value, index) => Object.is(value, b[index]));

  useEffect(() => {
    setSelectedImages(prev => {
      const next = ensureCapacity(prev);
      return arraysEqual(prev, next) ? prev : next;
    });
    setHasUserMadeChoice(prev => {
      const next = ensureChoiceCapacity(prev);
      return arraysEqual(prev, next) ? prev : next;
    });
    setSlideTexts(prev => {
      const next = ensureTextCapacity(prev);
      return arraysEqual(prev, next) ? prev : next;
    });
    setSelectedGradients(prev => {
      const next = ensureGradientCapacity(prev);
      return arraysEqual(prev, next) ? prev : next;
    });
  }, [
    ensureCapacity,
    ensureChoiceCapacity,
    ensureGradientCapacity,
    ensureTextCapacity,
  ]);

  const createCenteredSlide = useCallback(
    (
      slideText: string,
      index: number,
      image: string,
      gradient: SlideBackgroundGradient | null,
    ) => {
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
        textLength < charsPerLine ? textLength * fontSize * 0.6 : slideSize * 0.9,
      );
      const estimatedTextHeight = numberOfLines * fontSize * 1.2 + textPadding;

      const centerX = Math.max(0, (slideSize - estimatedTextWidth) / 2);
      const centerY = Math.max(0, (imageContainerHeight - estimatedTextHeight) / 2);

      return {
        id: index,
        text: slideText,
        image,
        position: { x: centerX, y: centerY },
        fontSize,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.4)',
        textAlign: 'center' as const,
        fontWeight: 'normal' as const,
        textEffects: [],
        backgroundGradient: gradient,
      };
    },
    [imageContainerHeight, slideSize],
  );

  const saveProjectState = useCallback(
    async (images: string[]) => {
      try {
        const normalizedImages = ensureCapacity(images);
        const normalizedTexts = ensureTextCapacity(slideTextsRef.current);
        const normalizedGradients = ensureGradientCapacity(selectedGradientsRef.current);
        const existingSlides = restoredSlidesRef.current ?? [];

        const projectSlides = normalizedTexts.map((slideText, index) => {
          const existingSlide = existingSlides[index];
          const nextGradient =
            normalizedGradients[index] ?? existingSlide?.backgroundGradient ?? null;

          if (existingSlide) {
            return {
              ...existingSlide,
              id: index,
              text: slideText,
              image: normalizedImages[index] || '',
              backgroundGradient: nextGradient,
              textEffects: existingSlide.textEffects ?? [],
            };
          }

          return createCenteredSlide(
            slideText,
            index,
            normalizedImages[index] || '',
            nextGradient,
          );
        });

        const projectState: ProjectState = {
          id: projectId,
          text,
          slides: projectSlides,
          images: normalizedImages,
          lastModified: new Date().toISOString(),
          isCompleted: false,
        };

        restoredSlidesRef.current = projectSlides;
        await StorageService.saveCurrentProject(projectState);
        console.log('Project state saved after image selection');
      } catch (error) {
        console.error('Failed to save project state:', error);
      }
    },
    [
      createCenteredSlide,
      ensureCapacity,
      ensureGradientCapacity,
      ensureTextCapacity,
      projectId,
      text,
    ],
  );

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

        restoredSlidesRef.current = savedProject.slides;

        const restoredImages = ensureCapacity(
          Array.from({ length: requiredImages }, (_, idx) => {
            const savedSlide = savedProject.slides?.[idx];
            return savedSlide?.image ?? '';
          }),
        );
        const restoredTexts = ensureTextCapacity(
          Array.from({ length: requiredImages }, (_, idx) => {
            const savedSlide = savedProject.slides?.[idx];
            return savedSlide?.text ?? slides[idx] ?? '';
          }),
        );
        const restoredGradients = ensureGradientCapacity(
          Array.from({ length: requiredImages }, (_, idx) => {
            const savedSlide = savedProject.slides?.[idx];
            return savedSlide?.backgroundGradient ?? null;
          }),
        );
        const restoredChoices = ensureChoiceCapacity(
          Array.from(
            { length: requiredImages },
            (_, idx) => Boolean(savedProject.slides?.[idx]),
          ),
        );

        hasRestoredImages.current = true;
        selectedImagesRef.current = restoredImages;
        hasUserMadeChoiceRef.current = restoredChoices;
        slideTextsRef.current = restoredTexts;
        selectedGradientsRef.current = restoredGradients;
        setSelectedImages(restoredImages);
        setHasUserMadeChoice(restoredChoices);
        setSlideTexts(restoredTexts);
        setSelectedGradients(restoredGradients);
        await saveProjectState(restoredImages);
      } catch (error) {
        console.error('Failed to restore selected images:', error);
      }
    };

    restoreImages();

    return () => {
      isActive = false;
    };
  }, [
    ensureCapacity,
    ensureChoiceCapacity,
    ensureGradientCapacity,
    ensureTextCapacity,
    requiredImages,
    saveProjectState,
    slides,
  ]);

  const countChoices = (choices: boolean[]): number => choices.filter(Boolean).length;

  const handleSelectImage = async (index: number) => {
    FeedbackService.buttonTap();

    try {
      const imageUri = await ImageService.pickFromGallery(t);

      if (imageUri) {
        const normalizedImageUri = normalizeImageUri(imageUri);
        console.log('Selected image URI:', normalizedImageUri);
        const currentImages = ensureCapacity(selectedImagesRef.current);
        const currentChoices = ensureChoiceCapacity(hasUserMadeChoiceRef.current);
        const previousUri = currentImages[index];

        const nextImages = [...currentImages];
        nextImages[index] = normalizedImageUri;
        const nextChoices = [...currentChoices];
        nextChoices[index] = true;

        selectedImagesRef.current = nextImages;
        hasUserMadeChoiceRef.current = nextChoices;
        setSelectedImages(nextImages);
        setHasUserMadeChoice(nextChoices);
        FeedbackService.success();

        if (countChoices(nextChoices) === requiredImages) {
          await saveProjectState(nextImages);
        }

        const finalizeSelection = async () => {
          let processedUri = normalizedImageUri;
          try {
            const result = await ImageService.processImage(normalizedImageUri, {
              width: 1080,
              height: 1920,
              quality: 0.8,
            });
            if (result) {
              processedUri = result;
            }
          } catch (err) {
            console.log('Image processing failed, using original:', err);
          }

          try {
            // If the user re-selected the image before processing finished,
            // do not overwrite the newer choice.
            const latestImages = ensureCapacity(selectedImagesRef.current);
            if (latestImages[index] !== normalizedImageUri) {
              return;
            }

            let persistentUri = await ProjectImageStore.persistImageForProject({
              uri: processedUri,
              projectId,
              slideIndex: index,
              previousUri,
            });

            if (!persistentUri && processedUri !== normalizedImageUri) {
              persistentUri = await ProjectImageStore.persistImageForProject({
                uri: normalizedImageUri,
                projectId,
                slideIndex: index,
                previousUri,
              });
            }

            const finalUri = normalizeImageUri(persistentUri ?? processedUri);
            console.log('Final image URI (persistent if possible):', finalUri);

            const nextPersistedImages = [...latestImages];
            nextPersistedImages[index] = finalUri;
            selectedImagesRef.current = nextPersistedImages;
            setSelectedImages(nextPersistedImages);

            if (countChoices(hasUserMadeChoiceRef.current) === requiredImages) {
              await saveProjectState(nextPersistedImages);
            }
          } catch (err) {
            console.log('Image finalize failed, keeping original:', err);
          }
        };

        const persistPromise = finalizeSelection();
        pendingPersistRef.current.set(index, persistPromise);
        persistPromise.finally(() => {
          if (pendingPersistRef.current.get(index) === persistPromise) {
            pendingPersistRef.current.delete(index);
          }
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
    setGradientModalSlideIndex(index);
  };

  const handleOpenTextEditor = (index: number) => {
    FeedbackService.buttonTap();
    const normalizedTexts = ensureTextCapacity(slideTextsRef.current);
    const draft = normalizedTexts[index] ?? slides[index] ?? '';
    setEditingSlideIndex(index);
    setEditingSlideDraft(draft);
  };

  const closeTextEditor = () => {
    setEditingSlideIndex(null);
    setEditingSlideDraft('');
  };

  const handleCancelEditingSlideText = () => {
    closeTextEditor();
    FeedbackService.buttonTap();
  };

  const handleSaveEditingSlideText = async () => {
    if (editingSlideIndex === null) {
      return;
    }
    const normalizedTexts = ensureTextCapacity(slideTextsRef.current);
    const nextTexts = [...normalizedTexts];
    nextTexts[editingSlideIndex] = editingSlideDraft;
    slideTextsRef.current = nextTexts;
    setSlideTexts(nextTexts);
    closeTextEditor();
    FeedbackService.success();

    if (countChoices(hasUserMadeChoiceRef.current) === requiredImages) {
      await saveProjectState(selectedImagesRef.current);
    }
  };

  const handleCloseGradientModal = () => {
    setGradientModalSlideIndex(null);
  };

  const handleSelectGradient = async (gradient: SlideBackgroundGradient) => {
    if (gradientModalSlideIndex === null) {
      return;
    }

    const index = gradientModalSlideIndex;
    const currentImages = ensureCapacity(selectedImagesRef.current);
    const currentChoices = ensureChoiceCapacity(hasUserMadeChoiceRef.current);
    const currentGradients = ensureGradientCapacity(selectedGradientsRef.current);

    const nextImages = [...currentImages];
    nextImages[index] = '';
    const nextChoices = [...currentChoices];
    nextChoices[index] = true;
    const nextGradients = [...currentGradients];
    nextGradients[index] = gradient;

    selectedImagesRef.current = nextImages;
    hasUserMadeChoiceRef.current = nextChoices;
    selectedGradientsRef.current = nextGradients;
    setSelectedImages(nextImages);
    setHasUserMadeChoice(nextChoices);
    setSelectedGradients(nextGradients);
    setGradientModalSlideIndex(null);
    FeedbackService.success();

    if (countChoices(nextChoices) === requiredImages) {
      await saveProjectState(nextImages);
    }
  };

  const handleContinue = async () => {
    FeedbackService.buttonTap();

    if (isFinalizingRef.current) {
      return;
    }

    isFinalizingRef.current = true;
    setIsFinalizing(true);

    try {
      const choicesMade = countChoices(hasUserMadeChoiceRef.current);

      if (choicesMade < requiredImages) {
        FeedbackService.error();
        Alert.alert(
          t('image_selection_error_title'),
          t('image_selection_error', { count: requiredImages }),
        );
        return;
      }

      const pendingPersists = Array.from(pendingPersistRef.current.values());
      if (pendingPersists.length > 0) {
        await Promise.allSettled(pendingPersists);
      }

      const latestImages = ensureCapacity(selectedImagesRef.current);
      const latestImagesWithScheme = normalizeImageUris(latestImages);

      if (latestImagesWithScheme.some((img, idx) => selectedImagesRef.current[idx] !== img)) {
        selectedImagesRef.current = latestImagesWithScheme;
        setSelectedImages(latestImagesWithScheme);
      }

      await saveProjectState(latestImagesWithScheme);
      FeedbackService.success();
      navigation.navigate('Editor', { text, images: latestImagesWithScheme, projectId });
    } finally {
      isFinalizingRef.current = false;
      setIsFinalizing(false);
    }
  };

  const choicesMade = countChoices(hasUserMadeChoice);
  const allChoicesMade = choicesMade === requiredImages;
  const editingSlideNumber = editingSlideIndex !== null ? editingSlideIndex + 1 : null;
  const gradientModalSlideNumber =
    gradientModalSlideIndex !== null ? gradientModalSlideIndex + 1 : null;
  const gradientModalSelection =
    gradientModalSlideIndex !== null
      ? selectedGradients[gradientModalSlideIndex] ?? null
      : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {t('image_selection_subtitle', { count: requiredImages, plural: requiredImages > 1 ? 's' : '' })}
      </Text>

      <ScrollView style={styles.content}>
        {slides.map((_, index) => {
          const displayText = slideTexts[index] ?? slides[index] ?? '';
          const gradient = selectedGradients[index] ?? DEFAULT_GRADIENT;
          const hasChoice = Boolean(hasUserMadeChoice[index]);
          const hasImage = hasChoice && selectedImages[index] !== '';

          return (
            <View key={index} style={styles.slideCard}>
              <View style={styles.slideHeader}>
                <View style={styles.slideHeaderTextContainer}>
                  <Text style={styles.slideNumber}>{t('slide_number', { number: index + 1 })}</Text>
                  <Text style={styles.slideLocation} numberOfLines={3} ellipsizeMode="tail">
                    {displayText}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editTextButton}
                  onPress={() => handleOpenTextEditor(index)}
                >
                  <Text style={styles.editTextButtonText}>Edit</Text>
                </TouchableOpacity>
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

              <View style={styles.imagePreviewArea}>
                {hasImage ? (
                  <PannableImage
                    uri={selectedImages[index]}
                    onPress={() => handleSelectImage(index)}
                  />
                ) : hasChoice ? (
                  <TouchableOpacity
                    style={styles.plainBackgroundContainer}
                    onPress={() => handleUsePlainBackground(index)}
                  >
                    <GradientBackground
                      gradient={gradient}
                      style={styles.plainBackgroundPlaceholder}
                    />
                    <View style={styles.plainBackgroundBadge}>
                      <Text style={styles.plainBackgroundBadgeText}>Gradient</Text>
                    </View>
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
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          allChoicesMade && !isFinalizing && styles.continueButtonEnabled,
        ]}
        onPress={handleContinue}
        disabled={!allChoicesMade || isFinalizing}
      >
        <Text style={styles.continueButtonText}>{t('continue_to_editor')}</Text>
      </TouchableOpacity>

      <Modal
        visible={editingSlideIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={handleSaveEditingSlideText}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={handleSaveEditingSlideText} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingSlideNumber ? `Edit Slide ${editingSlideNumber}` : 'Edit Slide'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Adjust the slide text before choosing images.
            </Text>
            <TextInput
              style={styles.modalTextInput}
              value={editingSlideDraft}
              onChangeText={setEditingSlideDraft}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder={t('home_placeholder')}
              placeholderTextColor="#00000066"
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelEditingSlideText}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveEditingSlideText}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={gradientModalSlideIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseGradientModal}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseGradientModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Gradient</Text>
            <Text style={styles.modalSubtitle}>
              {gradientModalSlideNumber
                ? `Slide ${gradientModalSlideNumber}`
                : 'Select a gradient background'}
            </Text>
            <ScrollView
              style={styles.gradientScroll}
              contentContainerStyle={styles.gradientGrid}
              showsVerticalScrollIndicator={false}
            >
              {GRADIENT_VARIANTS.map(gradientOption => {
                const isSelected = gradientModalSelection?.id === gradientOption.id;
                return (
                  <TouchableOpacity
                    key={gradientOption.id}
                    style={[
                      styles.gradientSwatch,
                      { width: gradientSwatchWidth, height: gradientSwatchHeight },
                      isSelected && styles.gradientSwatchActive,
                    ]}
                    onPress={() => handleSelectGradient(gradientOption)}
                  >
                    <GradientBackground
                      gradient={gradientOption}
                      style={styles.gradientSwatchBackground}
                    />
                    {isSelected ? (
                      <View style={styles.gradientSwatchCheck}>
                        <Text style={styles.gradientSwatchCheckText}>✓</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  slideHeaderTextContainer: {
    flex: 1,
    paddingRight: 12,
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
  editTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  editTextButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  plainBackgroundPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  plainBackgroundBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  plainBackgroundBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: 540,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalTextInput: {
    backgroundColor: '#ffffff',
    color: '#000000',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 140,
    maxHeight: 280,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  modalCancelButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  gradientScroll: {
    marginTop: 4,
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 8,
  },
  gradientSwatch: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    position: 'relative',
  },
  gradientSwatchBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientSwatchActive: {
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  gradientSwatchCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  gradientSwatchCheckText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
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
