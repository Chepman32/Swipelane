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

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  NewProject: undefined;
  ImageSelection: { text: string; projectId: string; images?: string[] };
  Editor: { text: string; images: string[]; projectId: string };
  Preview: { slides: any[] };
  Settings: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [showAdvancedSplash, setShowAdvancedSplash] = useState(true);
  const [hasRestoredProject, setHasRestoredProject] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
            title: 'New Project',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="ImageSelection"
          component={ImageSelectionScreen}
          options={{
            headerShown: true,
            title: 'Select Images',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Editor"
          component={EditorScreen}
          options={{
            headerShown: true,
            title: 'Slide Editor',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Preview"
          component={PreviewScreen}
          options={{
            headerShown: true,
            title: 'Preview',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: 'Settings',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            headerShown: true,
            title: 'About',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            headerShown: true,
            title: 'Privacy Policy',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
