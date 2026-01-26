import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { onboardingSlides } from '../constants/onboarding';
import StorageService from '../services/StorageService';

// Import animation components
import TextTransformAnimation from '../components/onboarding/TextTransformAnimation';
import AIDesignAnimation from '../components/onboarding/AIDesignAnimation';
import VoiceToSlideAnimation from '../components/onboarding/VoiceToSlideAnimation';
import ProfessionalSlidesAnimation from '../components/onboarding/ProfessionalSlidesAnimation';
import TextToVisualAnimation from '../components/onboarding/TextToVisualAnimation';
import PocketDesignerAnimation from '../components/onboarding/PocketDesignerAnimation';
import DesignTeamAnimation from '../components/onboarding/DesignTeamAnimation';
import UniqueDesignAnimation from '../components/onboarding/UniqueDesignAnimation';

const { width } = Dimensions.get('window');

const DotIndicator: React.FC<{ 
  index: number; 
  isActive: boolean; 
  onPress: () => void;
  scrollX: any;
}> = ({ index, isActive, onPress, scrollX }) => {
  const dotStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value / width,
      [index - 1, index, index + 1],
      [0.8, 1.2, 0.8]
    );
    
    return {
      width: withTiming(isActive ? 24 : 8, { duration: 300 }),
      backgroundColor: withTiming(isActive ? '#3b82f6' : '#d1d5db', { duration: 300 }),
      transform: [{ scale: withTiming(isActive ? scale : 1, { duration: 300 }) }],
    };
  });

  return (
    <TouchableOpacity
      style={styles.dot}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.dotInner, dotStyle]} />
    </TouchableOpacity>
  );
};

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const titleOpacity = useSharedValue(1);
  const animationOpacity = useSharedValue(1);
  
  const flatListRef = useRef<any>(null);

  const animationComponents = {
    TextTransformAnimation,
    AIDesignAnimation,
    VoiceToSlideAnimation,
    ProfessionalSlidesAnimation,
    TextToVisualAnimation,
    PocketDesignerAnimation,
    DesignTeamAnimation,
    UniqueDesignAnimation,
  };

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      
      // Update opacity based on scroll
      const index = Math.round(event.contentOffset.x / width);
      titleOpacity.value = withTiming(1 - Math.abs((event.contentOffset.x / width) - index) * 0.5);
      animationOpacity.value = withTiming(1 - Math.abs((event.contentOffset.x / width) - index) * 0.3);
    },
  });

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await StorageService.setOnboardingCompleted();
    navigation.replace('Home');
  };

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const nextButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (Math.abs(event.translationX) > 50) {
        if (event.translationX > 0 && currentIndex > 0) {
          runOnJS(handleDotPress)(currentIndex - 1);
        } else if (event.translationX < 0 && currentIndex < onboardingSlides.length - 1) {
          runOnJS(handleDotPress)(currentIndex + 1);
        }
      }
    });

  const renderSlide = ({ item }: { item: any; index: number }) => {
    const AnimationComponent = animationComponents[item.svgComponent as keyof typeof animationComponents];
    
    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View style={[styles.animationContainer, { opacity: animationOpacity }]}>
          {AnimationComponent && <AnimationComponent />}
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity: titleOpacity }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderDot = (index: number) => {
    return (
      <DotIndicator
        key={index}
        index={index}
        isActive={currentIndex === index}
        onPress={() => handleDotPress(index)}
        scrollX={scrollX}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <GestureDetector gesture={panGesture}>
        <View style={styles.content}>
          {/* Skip button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Slides */}
          <Animated.FlatList
            ref={flatListRef}
            data={onboardingSlides}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
          />

          {/* Dots indicator */}
          <View style={styles.dotsContainer}>
            {onboardingSlides.map((_, index) => renderDot(index))}
          </View>

          {/* Next/Get Started button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                currentIndex === onboardingSlides.length - 1 && styles.getStartedButton,
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              onPressIn={() => {
                buttonScale.value = withSpring(0.95);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
            >
              <Animated.Text style={[styles.nextButtonText, nextButtonStyle]}>
                {currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
              </Animated.Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  animationContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    marginHorizontal: 4,
    padding: 4,
  },
  dotInner: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButton: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default OnboardingScreen;
