import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AnimatedSplashScreen from '../screens/AnimatedSplashScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import NewProjectScreen from '../screens/NewProjectScreen';
import StorageService from '../services/StorageService';
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

const AppNavigator: React.FC = () => {
  const [showAdvancedSplash, setShowAdvancedSplash] = useState(true);
  const [hasRestoredProject, setHasRestoredProject] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if there's a saved project to restore
    StorageService.loadCurrentProject().then(project => {
      if (project && !project.isCompleted) {
        setHasRestoredProject(true);
      }
    });

    // Determine which splash screen to show based on first launch
    StorageService.isFirstLaunch().then(isFirst => {
      setShowAdvancedSplash(isFirst);
      setShowOnboarding(isFirst);
    });
  }, []);

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
        <Stack.Screen name="Home" component={HomeScreen} />
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
