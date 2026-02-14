import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  type StackCardInterpolationProps,
} from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import NewProjectScreen from '../screens/NewProjectScreen';
import ImageSelectionScreen from '../screens/ImageSelectionScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RoadmapTemplateScreen from '../screens/RoadmapTemplateScreen';
import RoadmapBackgroundScreen from '../screens/RoadmapBackgroundScreen';
import RoadmapEditorScreen from '../screens/RoadmapEditorScreen';
import { useLanguage } from '../context/LanguageContext';
import type { SlideBackgroundGradient } from '../services/StorageService';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  NewProject: undefined;
  ImageSelection: { text: string; projectId: string; images?: string[] };
  Editor: { text: string; images: string[]; projectId: string };
  Preview: { slides: any[]; projectType?: 'text' | 'roadmap' };
  Settings: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  // Roadmap screens
  RoadmapTemplate: undefined;
  RoadmapBackground: { templateId: string; projectId: string };
  RoadmapEditor: {
    projectId: string;
    templateId?: string;
    backgroundGradient?: SlideBackgroundGradient;
    backgroundImageUri?: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const springyHomeInterpolator = ({ current, next, layouts }: StackCardInterpolationProps) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width * 0.22, 0],
  });

  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.55, 1],
  });

  const overlayOpacity = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.1],
      })
    : 0;

  return {
    cardStyle: {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    },
    overlayStyle: {
      opacity: overlayOpacity,
    },
  };
};

const AppNavigator: React.FC = () => {
  const { t } = useLanguage();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          headerBackTitle: t('back'),

          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            animationTypeForReplace: 'push',
            transitionSpec: {
              open: {
                animation: 'spring',
                config: {
                  stiffness: 680,
                  damping: 30,
                  mass: 0.9,
                  velocity: 6.2,
                  overshootClamping: false,
                  restDisplacementThreshold: 0.01,
                  restSpeedThreshold: 0.01,
                },
              },
              close: {
                animation: 'spring',
                config: {
                  stiffness: 700,
                  damping: 50,
                  mass: 1,
                  velocity: 2.6,
                  overshootClamping: true,
                  restDisplacementThreshold: 0.01,
                  restSpeedThreshold: 0.01,
                },
              },
            },
            cardStyleInterpolator: springyHomeInterpolator,
          }}
        />
        <Stack.Screen
          name="NewProject"
          component={NewProjectScreen}
          options={{
            headerShown: true,
            title: t('new_project_title'),
          }}
        />
        <Stack.Screen
          name="ImageSelection"
          component={ImageSelectionScreen}
          options={{
            headerShown: true,
            title: t('image_selection_title'),
          }}
        />
        <Stack.Screen
          name="Editor"
          component={EditorScreen}
          options={{
            headerShown: true,
            title: t('editor_title'),
          }}
        />
        <Stack.Screen
          name="Preview"
          component={PreviewScreen}
          options={{
            headerShown: true,
            title: t('preview_title'),
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: t('settings_title'),
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            headerShown: true,
            title: t('about_title'),
          }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            headerShown: true,
            title: t('privacy_policy_title'),
          }}
        />
        <Stack.Screen
          name="RoadmapTemplate"
          component={RoadmapTemplateScreen}
          options={{
            headerShown: true,
            title: t('roadmap_template_title') || 'Choose Template',
          }}
        />
        <Stack.Screen
          name="RoadmapBackground"
          component={RoadmapBackgroundScreen}
          options={{
            headerShown: true,
            title: t('roadmap_background_title') || 'Choose Background',
          }}
        />
        <Stack.Screen
          name="RoadmapEditor"
          component={RoadmapEditorScreen}
          options={{
            headerShown: true,
            title: t('roadmap_editor_title') || 'Edit Roadmap',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
