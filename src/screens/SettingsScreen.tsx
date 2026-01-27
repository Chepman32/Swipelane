import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { themes, Theme } from '../context/ThemeContext';
import FeedbackService from '../services/FeedbackService';
import StorageService from '../services/StorageService';
import { useResponsive } from '../hooks/useResponsive';
import type { RootStackParamList } from '../navigation/AppNavigator';

const languageFlags: Record<Language, any> = {
  en: require('../assets/icons/flags/en.png'),
  zh: require('../assets/icons/flags/zh.png'),
  ja: require('../assets/icons/flags/ja.png'),
  ko: require('../assets/icons/flags/ko.png'),
  de: require('../assets/icons/flags/de.png'),
  fr: require('../assets/icons/flags/fr.png'),
  es: require('../assets/icons/flags/es.png'),
  'es-MX': require('../assets/icons/flags/es.png'),
  pt: require('../assets/icons/flags/pt-BR.png'),
  'pt-BR': require('../assets/icons/flags/pt-BR.png'),
  ar: require('../assets/icons/flags/ar.png'),
  ru: require('../assets/icons/flags/ru.png'),
  it: require('../assets/icons/flags/it.png'),
  nl: require('../assets/icons/flags/nl.png'),
  tr: require('../assets/icons/flags/tr.png'),
  th: require('../assets/icons/flags/th.png'),
  vi: require('../assets/icons/flags/vi.png'),
  id: require('../assets/icons/flags/id.png'),
  pl: require('../assets/icons/flags/pl.png'),
  uk: require('../assets/icons/flags/uk.png'),
  hi: require('../assets/icons/flags/hi.png'),
  he: require('../assets/icons/flags/he.png'),
  sv: require('../assets/icons/flags/sv.png'),
  no: require('../assets/icons/flags/no.png'),
  da: require('../assets/icons/flags/da.png'),
  fi: require('../assets/icons/flags/fi.png'),
  cs: require('../assets/icons/flags/cs.png'),
  hu: require('../assets/icons/flags/hu.png'),
  ro: require('../assets/icons/flags/ro.png'),
  el: require('../assets/icons/flags/el.png'),
  ms: require('../assets/icons/flags/ms.png'),
  fil: require('../assets/icons/flags/fil.png'),
};

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
];

const SettingsScreen: React.FC = () => {
  const { currentTheme, setTheme, themeDefinition } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Settings'>>();

  const [languageExpanded, setLanguageExpanded] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleLanguageExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLanguageExpanded(prev => !prev);
  };

  const handleThemeChange = (theme: Theme) => {
    FeedbackService.buttonTap();
    setTheme(theme);
  };

  const handleLanguageChange = (language: Language) => {
    FeedbackService.buttonTap();
    setLanguage(language);
    FeedbackService.success();
  };

  const handleOpenAbout = () => {
    FeedbackService.buttonTap();
    navigation.navigate('About');
  };

  const handleResetOnboarding = async () => {
    FeedbackService.buttonTap();
    try {
      await StorageService.resetOnboarding();
      FeedbackService.success();
      navigation.replace('Onboarding');
    } catch (error) {
      FeedbackService.error();
      console.error('Error resetting onboarding:', error);
    }
  };

  const currentLanguageName = languages.find(l => l.code === currentLanguage)?.nativeName || currentLanguage;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        {/* Theme Selection */}
        <View style={[styles.section, { paddingHorizontal: scale(20) }]}>
          <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text, fontSize: scaleFont(18) }]}>{t('settings_theme')}</Text>
          <View style={styles.themeOptions}>
            {Object.values(themes).map((theme) => (
              <TouchableOpacity
                key={theme.name}
                style={[
                  styles.themeOption,
                  { padding: scale(15) },
                  currentTheme === theme.name && styles.selectedTheme,
                  { backgroundColor: theme.colors.card },
                ]}
                onPress={() => handleThemeChange(theme.name as Theme)}
              >
                <Text style={[styles.themeText, { color: theme.colors.text, fontSize: scaleFont(16) }]}>
                  {t(`theme_${theme.name}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selection */}
        <View style={[styles.section, { paddingHorizontal: scale(20) }]}>
          <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text, fontSize: scaleFont(18) }]}>{t('settings_language')}</Text>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: themeDefinition.colors.border }]}
            onPress={toggleLanguageExpanded}
          >
            <View style={styles.languageHeaderLeft}>
              <Image source={languageFlags[currentLanguage]} style={styles.flag} />
              <Text style={[styles.settingLabel, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>
                {t('settings_language')}
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>
              {currentLanguageName} {languageExpanded ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>

          {languageExpanded && (
            <View style={[styles.languageList, { borderColor: themeDefinition.colors.border, backgroundColor: themeDefinition.colors.card }]}>
              {languages.map(item => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.languageItem,
                    { borderBottomColor: themeDefinition.colors.border },
                    currentLanguage === item.code && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <View style={styles.languageItemLeft}>
                    <Image source={languageFlags[item.code]} style={styles.flag} />
                    <View>
                      <Text style={[styles.languageName, { color: themeDefinition.colors.text }]}>{item.nativeName}</Text>
                      <Text style={[styles.languageSubtitle, { color: themeDefinition.colors.text + '99' }]}>{item.name}</Text>
                    </View>
                  </View>
                  {currentLanguage === item.code && (
                    <Text style={[styles.selectedCheck, { color: themeDefinition.colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* About */}
        <View style={[styles.section, { paddingHorizontal: scale(20) }]}>
          <Text style={[styles.sectionTitle, { color: themeDefinition.colors.text, fontSize: scaleFont(18) }]}>About</Text>
          <TouchableOpacity
            style={[
              styles.aboutRow,
              {
                borderColor: themeDefinition.colors.border,
                backgroundColor: themeDefinition.colors.card,
                paddingVertical: scale(14),
                paddingHorizontal: scale(16),
                borderRadius: scale(12),
              },
            ]}
            onPress={handleOpenAbout}
          >
            <Text style={[styles.aboutLabel, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>
              About Texora
            </Text>
            <Text style={[styles.aboutChevron, { color: themeDefinition.colors.text + '99', fontSize: scaleFont(18) }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset Onboarding */}
        <View style={[styles.section, { paddingHorizontal: scale(20) }]}>
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                backgroundColor: themeDefinition.colors.card,
                borderColor: themeDefinition.colors.border,
                paddingVertical: scale(14),
              },
            ]}
            onPress={handleResetOnboarding}
          >
            <Text style={[styles.resetButtonText, { color: themeDefinition.colors.notification, fontSize: scaleFont(16) }]}>
              {t('settings_reset_onboarding')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  themeOption: {
    width: '48%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: '#007AFF',
  },
  themeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  aboutLabel: {
    fontWeight: '700',
  },
  aboutChevron: {
    fontWeight: '800',
  },
  languageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  languageList: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  selectedLanguage: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  flag: {
    width: 26,
    height: 18,
    borderRadius: 3,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  selectedCheck: {
    fontSize: 20,
  },
  resetButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontWeight: '600',
  },
});

export default SettingsScreen;
