import {Platform, useWindowDimensions} from 'react-native';
import {useMemo} from 'react';

// Device detection
export const isPad = Platform.OS === 'ios' && Platform.isPad;

// Scaling factors
const IPAD_SCALE = 1.5;
const IPAD_FONT_SCALE = 1.3;

interface ResponsiveValues {
  // Device info
  isPad: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;

  // Scaling functions
  scale: (value: number) => number;
  scaleFont: (value: number) => number;

  // Pre-computed values
  gridColumns: number;
  sliderHeight: number;
  minTouchTarget: number;
  controlGap: number;
  paddingHorizontal: number;

  // Button sizes
  smallButtonSize: number;
  mediumButtonSize: number;
  largeButtonSize: number;
  navArrowSize: number;
  colorSwatchSize: number;

  // Panel heights
  maxPanelHeight: number;
}

export function useResponsive(): ResponsiveValues {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  return useMemo(() => {
    const scale = (value: number): number => {
      if (!isPad) return value;
      return Math.round(value * IPAD_SCALE);
    };

    const scaleFont = (value: number): number => {
      if (!isPad) return value;
      return Math.round(value * IPAD_FONT_SCALE);
    };

    // Grid columns: iPhone=2, iPad portrait=3, iPad landscape=4
    const gridColumns = isPad ? (isLandscape ? 4 : 3) : 2;

    return {
      // Device info
      isPad,
      isLandscape,
      screenWidth: width,
      screenHeight: height,

      // Scaling functions
      scale,
      scaleFont,

      // Pre-computed values
      gridColumns,
      sliderHeight: isPad ? 300 : 200,
      minTouchTarget: isPad ? 54 : 44,
      controlGap: isPad ? 30 : 20,
      paddingHorizontal: isPad ? 30 : 20,

      // Button sizes
      smallButtonSize: isPad ? 48 : 32,
      mediumButtonSize: isPad ? 54 : 36,
      largeButtonSize: isPad ? 66 : 44,
      navArrowSize: isPad ? 75 : 50,
      colorSwatchSize: isPad ? 48 : 32,

      // Panel heights
      maxPanelHeight: isPad ? 540 : 360,
    };
  }, [width, height, isLandscape]);
}
