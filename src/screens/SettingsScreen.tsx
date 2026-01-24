import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { themes, Theme } from '../context/ThemeContext';
import { usePreferences } from '../hooks/usePreferences';
import FeedbackService from '../services/FeedbackService';
import { useResponsive } from '../hooks/useResponsive';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
];

const SettingsScreen: React.FC = () => {
  const { currentTheme, setTheme, themeDefinition } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { preferences, updatePreferences } = usePreferences();
  const { scale, scaleFont } = useResponsive();

  const [showLanguageModal, setShowLanguageModal] = React.useState(false);

  const handleThemeChange = (theme: Theme) => {
    FeedbackService.buttonTap();
    setTheme(theme);
  };

  const handleLanguageChange = (language: Language) => {
    FeedbackService.buttonTap();
    setLanguage(language);
    setShowLanguageModal(false);
    FeedbackService.success();
  };

  const currentLanguageName = languages.find(l => l.code === currentLanguage)?.nativeName || currentLanguage;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
      <Text style={[styles.title, { color: themeDefinition.colors.text, fontSize: scaleFont(24), paddingHorizontal: scale(20) }]}>{t('settings_title')}</Text>

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
                { backgroundColor: theme.colors.card }
              ]}
              onPress={() => handleThemeChange(theme.name as Theme)}>
              <Text style={[styles.themeText, { color: theme.colors.text, fontSize: scaleFont(16) }]}>
                {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
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
          onPress={() => setShowLanguageModal(true)}>
          <Text style={[styles.settingLabel, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>{t('settings_language')}</Text>
          <Text style={[styles.settingValue, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}>
            {currentLanguageName} ›
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeDefinition.colors.card }]}>
            <Text style={[styles.modalTitle, { color: themeDefinition.colors.text }]}>
              {t('settings_language')}
            </Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    { borderBottomColor: themeDefinition.colors.border },
                    currentLanguage === item.code && styles.selectedLanguage
                  ]}
                  onPress={() => handleLanguageChange(item.code)}>
                  <View>
                    <Text style={[styles.languageName, { color: themeDefinition.colors.text }]}>
                      {item.nativeName}
                    </Text>
                    <Text style={[styles.languageSubtitle, { color: themeDefinition.colors.text + '99' }]}>
                      {item.name}
                    </Text>
                  </View>
                  {currentLanguage === item.code && (
                    <Text style={{ color: themeDefinition.colors.primary, fontSize: 20 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeDefinition.colors.primary }]}
              onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCloseButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  modalCloseButton: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;