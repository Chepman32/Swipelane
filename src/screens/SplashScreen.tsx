import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
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

type Fragment = {
  id: number;
  col: number;
  row: number;
  startX: number;
  startY: number;
  delay: number;
  startRotation: number;
  startScale: number;
};

const GRID_COLUMNS = 20;
const GRID_ROWS = 10;
const FRAGMENT_COUNT = GRID_COLUMNS * GRID_ROWS;
const ICON_ASSET: ImageSourcePropType = require('../../ios/Swipelane/Images.xcassets/AppIcon.appiconset/Icon-1024.png');
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const seeded = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { ensureLanguageReady } = useLanguage();
  const assembleProgress = useRef(new Animated.Value(0)).current;
  const zoomScale = useRef(new Animated.Value(1)).current;
  const zoomFlash = useRef(new Animated.Value(0)).current;

  const iconSize = Math.min(screenWidth * 0.56, 220);
  const pieceWidth = iconSize / GRID_COLUMNS;
  const pieceHeight = iconSize / GRID_ROWS;

  const fragments = useMemo<Fragment[]>(() => {
    return Array.from({ length: FRAGMENT_COUNT }, (_, index) => {
      const col = index % GRID_COLUMNS;
      const row = Math.floor(index / GRID_COLUMNS);
      const angle = seeded(index + 1) * Math.PI * 2;
      const radiusX = screenWidth * (0.65 + seeded(index + 31) * 0.5);
      const radiusY = screenHeight * (0.65 + seeded(index + 67) * 0.5);

      return {
        id: index,
        col,
        row,
        startX: Math.cos(angle) * radiusX,
        startY: Math.sin(angle) * radiusY,
        delay: seeded(index + 101) * 0.22,
        startRotation: (seeded(index + 141) * 2 - 1) * 0.6,
        startScale: 0.72 + seeded(index + 187) * 0.28,
      };
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const onComplete = async () => {
      if (!isMounted) {
        return;
      }

      await ensureLanguageReady();
      const isFirstLaunch = await StorageService.isFirstLaunch();
      if (isFirstLaunch) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Home');
      }
    };

    Animated.sequence([
      Animated.timing(assembleProgress, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(zoomScale, {
          toValue: 4.2,
          duration: 500,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(zoomFlash, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });

    return () => {
      isMounted = false;
    };
  }, [assembleProgress, ensureLanguageReady, navigation, zoomFlash, zoomScale]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              width: iconSize,
              height: iconSize,
              transform: [{ scale: zoomScale }],
            },
          ]}
        >
          {fragments.map(fragment => {
            const fragmentProgress = assembleProgress.interpolate({
              inputRange: [fragment.delay, Math.min(fragment.delay + 0.78, 1)],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });

            const animatedStyle = {
              opacity: fragmentProgress.interpolate({
                inputRange: [0, 0.15, 1],
                outputRange: [0, 0.9, 1],
              }),
              transform: [
                {
                  translateX: fragmentProgress.interpolate({
                    inputRange: [0, 0.85, 1],
                    outputRange: [fragment.startX, fragment.startX * 0.08, 0],
                  }),
                },
                {
                  translateY: fragmentProgress.interpolate({
                    inputRange: [0, 0.85, 1],
                    outputRange: [fragment.startY, fragment.startY * 0.08, 0],
                  }),
                },
                {
                  rotate: fragmentProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [`${fragment.startRotation}rad`, '0rad'],
                  }),
                },
                {
                  scale: fragmentProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [fragment.startScale, 1],
                  }),
                },
              ],
            };

            return (
              <Animated.View
                key={fragment.id}
                style={[
                  styles.fragment,
                  {
                    width: pieceWidth,
                    height: pieceHeight,
                    left: fragment.col * pieceWidth,
                    top: fragment.row * pieceHeight,
                  },
                  animatedStyle,
                ]}
              >
                <Image
                  source={ICON_ASSET}
                  style={[
                    styles.iconImage,
                    {
                      width: iconSize,
                      height: iconSize,
                      left: -fragment.col * pieceWidth,
                      top: -fragment.row * pieceHeight,
                    },
                  ]}
                />
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.zoomFlash,
          {
            opacity: zoomFlash.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  fragment: {
    position: 'absolute',
    overflow: 'hidden',
  },
  iconImage: {
    position: 'absolute',
  },
  zoomFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});

export default SplashScreen;
