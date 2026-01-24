import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { estimateSlideCount } from '../utils/textUtils';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import { useResponsive } from '../hooks/useResponsive';

type RootStackParamList = {
  ImageSelection: { text: string };
  Home: undefined;
};

type NewProjectScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ImageSelection'
>;

const NewProjectScreen: React.FC = () => {
  const [text, setText] = useState('');
  const navigation = useNavigation<NewProjectScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();

  const handleGenerateSlides = () => {
    if (text.trim().length === 0) {
      FeedbackService.error();
      Alert.alert(t('home_error_empty'), '');
      return;
    }

    FeedbackService.buttonTap();
    
    // Create a new project
    const newProject = {
      id: `project_${Date.now()}`,
      text,
      slides: [],
      images: [],
      lastModified: new Date().toISOString(),
      isCompleted: false,
    };

    // Save the new project as current
    StorageService.saveCurrentProject(newProject).then(() => {
      // Navigate to image selection screen with the text
      navigation.navigate('ImageSelection', { text });
    });
  };

  const handleBack = () => {
    FeedbackService.buttonTap();
    navigation.goBack();
  };

  const estimatedSlides = estimateSlideCount(text);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeDefinition.colors.background },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.header,
            { borderBottomColor: themeDefinition.colors.border, paddingHorizontal: scale(20) },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={[styles.backButton, { padding: scale(10) }]}>
            <Text style={[styles.backButtonText, { color: themeDefinition.colors.text, fontSize: scaleFont(24) }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeDefinition.colors.text, fontSize: scaleFont(24) }]}>
            {t('new_project_title') || 'New Project'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.content, { padding: scale(20) }]}>
          <Text
            style={[styles.subtitle, { color: themeDefinition.colors.text, fontSize: scaleFont(16) }]}
          >
            {t('home_subtitle')}
          </Text>

          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: themeDefinition.colors.card,
                color: themeDefinition.colors.text,
                borderColor: themeDefinition.colors.border,
                fontSize: scaleFont(16),
                padding: scale(15),
              },
            ]}
            multiline
            placeholder={t('home_placeholder')}
            placeholderTextColor={themeDefinition.colors.text + '66'}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />

          <View style={styles.infoContainer}>
            <Text
              style={[styles.infoText, { color: themeDefinition.colors.text, fontSize: scaleFont(14) }]}
            >
              {text.trim().length > 0
                ? `${t('home_character_count', {
                    count: text.trim().length,
                  })} | Estimated slides: ${estimatedSlides}`
                : t('home_start_typing')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              { padding: scale(15) },
              text.trim().length > 0
                ? { backgroundColor: '#007AFF' }
                : { backgroundColor: '#ccc' },
            ]}
            onPress={handleGenerateSlides}
            disabled={text.trim().length === 0}
          >
            <Text
              style={[
                styles.generateButtonText,
                { fontSize: scaleFont(18) },
                text.trim().length === 0 && { color: '#999' },
              ]}
            >
              {t('home_generate_button')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  infoContainer: {
    marginVertical: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewProjectScreen;
