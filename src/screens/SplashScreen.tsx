import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLanguage } from '../context/LanguageContext';
import StorageService from '../services/StorageService';

type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
};

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home' | 'Onboarding'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { t, ensureLanguageReady } = useLanguage();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const [titleText, setTitleText] = React.useState('');
  const [subtitleText, setSubtitleText] = React.useState('');

  useEffect(() => {
    const fullTitle = t('splash_title');
    const fullSubtitle = t('splash_subtitle');

    // Phase 1: Fade and scale animations (0-1000ms)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: Teletype effect (starts at 1000ms)
    const titleDelay = 1000;
    const charDelay = 50; // 50ms per character

    // Title teletype
    const titleLength = fullTitle.length;
    const titleTimers: NodeJS.Timeout[] = [];

    for (let i = 0; i <= titleLength; i++) {
      const timer = setTimeout(() => {
        setTitleText(fullTitle.substring(0, i));
      }, titleDelay + (i * charDelay));
      titleTimers.push(timer);
    }

    // Subtitle teletype (starts after title completes)
    const subtitleDelay = titleDelay + (titleLength * charDelay) + 100; // 100ms pause
    const subtitleLength = fullSubtitle.length;
    const subtitleTimers: NodeJS.Timeout[] = [];

    for (let i = 0; i <= subtitleLength; i++) {
      const timer = setTimeout(() => {
        setSubtitleText(fullSubtitle.substring(0, i));
      }, subtitleDelay + (i * charDelay));
      subtitleTimers.push(timer);
    }

    // Navigation timer (2000ms total)
    const navTimer = setTimeout(async () => {
      await ensureLanguageReady();
      const isFirstLaunch = await StorageService.isFirstLaunch();
      if (isFirstLaunch) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Home');
      }
    }, 2000);

    // Cleanup
    return () => {
      titleTimers.forEach(timer => clearTimeout(timer));
      subtitleTimers.forEach(timer => clearTimeout(timer));
      clearTimeout(navTimer);
    };
  }, [fadeAnim, scaleAnim, navigation, ensureLanguageReady, t]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>
        </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SplashScreen;
