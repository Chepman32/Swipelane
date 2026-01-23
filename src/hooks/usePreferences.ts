import { useEffect } from 'react';
import { useStorage } from './useStorage';
import { Theme } from '../context/ThemeContext';
import { Language } from '../context/LanguageContext';

export interface UserPreferences {
  theme: Theme;
  language: Language;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  soundEnabled: true,
  hapticsEnabled: true,
};

export const usePreferences = () => {
  const [preferences, setPreferences, removePreferences] = useStorage<UserPreferences>(
    'userPreferences',
    defaultPreferences
  );

  // Apply theme when preferences change
  useEffect(() => {
    // In a complete implementation, this would update the theme context
    console.log('Theme updated to:', preferences.theme);
  }, [preferences.theme]);

  // Apply language when preferences change
  useEffect(() => {
    // In a complete implementation, this would update the language context
    console.log('Language updated to:', preferences.language);
  }, [preferences.language]);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    removePreferences,
  };
};

export default usePreferences;