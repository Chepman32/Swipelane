import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  PanResponder,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useDerivedValue,
  interpolateColor,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { onboardingSlides } from '../constants/onboarding';
import StorageService from '../services/StorageService';
import { useLanguage } from '../context/LanguageContext';
import FeedbackService from '../services/FeedbackService';

const { width } = Dimensions.get('window');
const SLIDE_COUNT = onboardingSlides.length;
const ACCENT_COLORS = onboardingSlides.map((s) => s.accentColor);

// Pill-style dot indicator
const DotIndicator: React.FC<{
  isActive: boolean;
  onPress: () => void;
}> = ({ isActive, onPress }) => {
  const dotStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 28 : 8, { duration: 250, easing: Easing.out(Easing.ease) }),
    opacity: withTiming(isActive ? 1 : 0.35, { duration: 250 }),
  }));

  return (
    <TouchableOpacity
      style={styles.dotHitArea}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.dot, { backgroundColor: '#ffffff' }, dotStyle]} />
    </TouchableOpacity>
  );
};

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(1);
  const { t } = useLanguage();
  const flatListRef = useRef<any>(null);

  // Background color interpolates between accent colors as user scrolls
  const bgColor = useDerivedValue(() =>
    interpolateColor(
      scrollX.value / width,
      ACCENT_COLORS.map((_, i) => i),
      ACCENT_COLORS,
    ),
  );

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
  }));

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const animateTextIn = useCallback(() => {
    textOpacity.value = 0;
    textTranslateY.value = 28;
    textOpacity.value = withDelay(80, withTiming(1, { duration: 380, easing: Easing.out(Easing.ease) }));
    textTranslateY.value = withDelay(80, withSpring(0, { damping: 18, stiffness: 180 }));
  }, [textOpacity, textTranslateY]);

  const goToSlide = useCallback((index: number, withFeedback = true) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
    if (clamped === currentIndex) return;
    if (withFeedback) {
      FeedbackService.buttonTap();
    }
    flatListRef.current?.scrollToIndex({ index: clamped, animated: true });
    setCurrentIndex(clamped);
    animateTextIn();
  }, [animateTextIn, currentIndex]);

  const handleNext = () => {
    if (currentIndex < SLIDE_COUNT - 1) {
      goToSlide(currentIndex + 1, true);
    } else {
      FeedbackService.buttonTap();
      handleComplete();
    }
  };

  const handleSkip = () => {
    FeedbackService.buttonTap();
    handleComplete();
  };

  const handleComplete = async () => {
    await StorageService.setOnboardingCompleted();
    navigation.replace('Home');
  };

  const handleDotPress = (index: number) => {
    goToSlide(index, true);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, nextIndex));
    if (clamped !== currentIndex) {
      setCurrentIndex(clamped);
      animateTextIn();
    }
  };

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const textContainerStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const textSwipeResponder = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 8,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 40;
        if (gestureState.dx < -threshold) {
          goToSlide(currentIndex + 1, false);
          return;
        }
        if (gestureState.dx > threshold) {
          goToSlide(currentIndex - 1, false);
        }
      },
    }),
  [currentIndex, goToSlide]);

  // Animate text in on mount
  useEffect(() => {
    textOpacity.value = 0;
    textTranslateY.value = 28;
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));
    textTranslateY.value = withDelay(300, withSpring(0, { damping: 18, stiffness: 160 }));
  }, [textOpacity, textTranslateY]);

  const isLast = currentIndex === SLIDE_COUNT - 1;

  const renderSlide = ({ item }: { item: typeof onboardingSlides[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.animationContainer}>
          <LottieView
            source={item.lottieSource}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, bgStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
      </TouchableOpacity>

      {/* Slide animations */}
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.flatList}
      />

      {/* Text content — separate from FlatList so it can animate independently */}
      <Animated.View
        style={[styles.textContainer, textContainerStyle]}
        {...textSwipeResponder.panHandlers}
      >
        <Text style={styles.title} numberOfLines={3}>
          {t(onboardingSlides[currentIndex].titleKey)}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {t(onboardingSlides[currentIndex].descriptionKey)}
        </Text>
      </Animated.View>

      {/* Bottom bar: dots + button */}
      <View style={styles.bottomBar}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {onboardingSlides.map((_, i) => (
            <DotIndicator
              key={i}
              isActive={currentIndex === i}
              onPress={() => handleDotPress(i)}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          onPressIn={() => { buttonScale.value = withSpring(0.95, { damping: 12 }); }}
          onPressOut={() => { buttonScale.value = withSpring(1, { damping: 12 }); }}
        >
          <Animated.View
            style={[
              styles.ctaButton,
              isLast ? styles.ctaButtonLast : styles.ctaButtonDefault,
              buttonAnimStyle,
            ]}
          >
            <Text style={[styles.ctaText, isLast && styles.ctaTextLast]}>
              {isLast ? t('onboarding_get_started') : t('onboarding_next')}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 52 : 32,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: 300,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'FiraSans-SemiBold',
    letterSpacing: 0.2,
  },
  textContainer: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
    fontFamily: 'ArchivoBlack-Regular',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    lineHeight: 23,
    fontFamily: 'FiraSans-Regular',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotHitArea: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDefault: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ctaButtonLast: {
    backgroundColor: '#ffffff',
    borderWidth: 0,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'FiraSans-SemiBold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  ctaTextLast: {
    color: '#1a1a2e',
  },
});

export default OnboardingScreen;
