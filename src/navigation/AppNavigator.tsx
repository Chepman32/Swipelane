import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AnimatedSplashScreen from '../screens/AnimatedSplashScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import NewProjectScreen from '../screens/NewProjectScreen';
import StorageService from '../services/StorageService';
import ImageSelectionScreen from '../screens/ImageSelectionScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  NewProject: undefined;
  ImageSelection: { text: string; images?: string[] };
  Editor: { text: string; images: string[] };
  Preview: { slides: any[] };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [showAdvancedSplash, setShowAdvancedSplash] = useState(true);
  const [hasRestoredProject, setHasRestoredProject] = useState(false);

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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewProject" component={NewProjectScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
