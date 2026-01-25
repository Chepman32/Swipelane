import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import { MicrophoneFAB } from '../components/MicrophoneFAB';
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
  ImageSelection: { text: string; projectId: string };
  Home: undefined;
};

type NewProjectScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ImageSelection'
>;

const NewProjectScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const navigation = useNavigation<NewProjectScreenNavigationProp>();
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();

  // Track keyboard visibility
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
      // Navigate to image selection screen with the text and projectId
      navigation.navigate('ImageSelection', { text, projectId: newProject.id });
    });
  };

  const handleBack = () => {
    FeedbackService.buttonTap();
    navigation.goBack();
  };

  const handleHideKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSpeechResult = useCallback((spokenText: string) => {
    FeedbackService.success();
    setText(prevText => {
      if (prevText.trim().length > 0) {
        return `${prevText} ${spokenText}`;
      }
      return spokenText;
    });
  }, []);

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
              {t('back')}
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

          <View style={styles.textInputContainer}>
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
            <MicrophoneFAB
              onTextReceived={handleSpeechResult}
              style={styles.microphoneFab}
            />
          </View>

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

          {isKeyboardVisible && (
            <TouchableOpacity
              style={styles.hideKeyboardButton}
              onPress={handleHideKeyboard}
            >
              <Image source={require('../assets/icons/hideKeyboard.png')} style={{ width: 24, height: 24, opacity: 0.7 }} />
            </TouchableOpacity>
          )}
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
  textInputContainer: {
    flex: 1,
    position: 'relative',
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
  microphoneFab: {
    position: 'absolute',
    right: 12,
    bottom: 12,
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
  hideKeyboardButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  hideKeyboardText: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default NewProjectScreen;
