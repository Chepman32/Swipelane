import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StorageService from '../services/StorageService';
import FeedbackService from '../services/FeedbackService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import IAPService from '../services/IAPService';
import type { SlideFontId } from '../constants/fonts';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

const TestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { themeDefinition, setTheme } = useTheme();
  const { t, changeLanguage } = useLanguage();

  const runTests = async () => {
    const results: TestResult[] = [];

    // Test 1: StorageService - Save and Load Project
    try {
      const testProject = {
        id: 'test-project-1',
        text: 'Test slide content',
        slides: [{
          id: 1,
          text: 'Slide 1',
          image: '',
          position: { x: 0, y: 0 },
          fontSize: 16,
          color: '#000',
          backgroundColor: '#fff',
          textAlign: 'center' as const,
          fontWeight: 'normal' as const,
          fontFamily: undefined,
          fontId: 'fira_sans_regular' as SlideFontId,
        }],
        images: [],
        lastModified: new Date().toISOString(),
        isCompleted: false,
      };

      await StorageService.saveCurrentProject(testProject);
      const loaded = await StorageService.loadCurrentProject();

      if (loaded && loaded.id === testProject.id) {
        results.push({ name: 'StorageService - Save/Load', status: 'success' });
      } else {
        results.push({ name: 'StorageService - Save/Load', status: 'failed', error: 'Data mismatch' });
      }
    } catch (error) {
      results.push({ name: 'StorageService - Save/Load', status: 'failed', error: String(error) });
    }

    // Test 2: FeedbackService - Haptic Feedback
    try {
      FeedbackService.buttonTap();
      FeedbackService.success();
      FeedbackService.error();
      results.push({ name: 'FeedbackService - Haptics', status: 'success' });
    } catch (error) {
      results.push({ name: 'FeedbackService - Haptics', status: 'failed', error: String(error) });
    }

    // Test 3: Theme Switching
    try {
      const originalTheme = themeDefinition.name;
      setTheme('dark');
      await new Promise(resolve => setTimeout(resolve, 100));
      setTheme('solar');
      await new Promise(resolve => setTimeout(resolve, 100));
      setTheme('mono');
      await new Promise(resolve => setTimeout(resolve, 100));
      setTheme(originalTheme);
      results.push({ name: 'Theme Switching', status: 'success' });
    } catch (error) {
      results.push({ name: 'Theme Switching', status: 'failed', error: String(error) });
    }

    // Test 4: Language Switching
    try {
      const originalLang = 'en';
      await changeLanguage('es');
      await new Promise(resolve => setTimeout(resolve, 100));
      await changeLanguage('fr');
      await new Promise(resolve => setTimeout(resolve, 100));
      await changeLanguage(originalLang);
      results.push({ name: 'Language Switching', status: 'success' });
    } catch (error) {
      results.push({ name: 'Language Switching', status: 'failed', error: String(error) });
    }

    // Test 5: IAP Service
    try {
      const products = await IAPService.getProducts();
      const isProStatus = await IAPService.isPro();
      results.push({ name: 'IAP Service', status: 'success' });
    } catch (error) {
      results.push({ name: 'IAP Service', status: 'failed', error: String(error) });
    }

    // Test 6: Preferences
    try {
      await StorageService.savePreferences({
        soundEnabled: false,
        hapticsEnabled: true,
      });
      const prefs = await StorageService.getPreferences();
      if (!prefs.soundEnabled && prefs.hapticsEnabled) {
        results.push({ name: 'Preferences Storage', status: 'success' });
      } else {
        results.push({ name: 'Preferences Storage', status: 'failed', error: 'Preferences mismatch' });
      }
    } catch (error) {
      results.push({ name: 'Preferences Storage', status: 'failed', error: String(error) });
    }

    // Test 7: Recent Projects
    try {
      const recentProjects = await StorageService.getRecentProjects();
      results.push({ name: 'Recent Projects', status: 'success' });
    } catch (error) {
      results.push({ name: 'Recent Projects', status: 'failed', error: String(error) });
    }

    setTestResults(results);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const handleRetest = () => {
    setTestResults([]);
    runTests();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeDefinition.colors.text }]}>
          System Tests
        </Text>
        <TouchableOpacity onPress={handleRetest} style={styles.retestButton}>
          <Text style={styles.retestText}>Run Tests</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {testResults.map((result, index) => (
          <View key={index} style={[styles.testItem, { borderBottomColor: themeDefinition.colors.border }]}>
            <View style={styles.testHeader}>
              <Text style={[styles.testName, { color: themeDefinition.colors.text }]}>
                {result.name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) }]}>
                <Text style={styles.statusText}>
                  {result.status.toUpperCase()}
                </Text>
              </View>
            </View>
            {result.error && (
              <Text style={[styles.errorText, { color: '#FF3B30' }]}>
                {result.error}
              </Text>
            )}
          </View>
        ))}

        {testResults.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: themeDefinition.colors.text }]}>
              Running tests...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: themeDefinition.colors.text }]}>
          Total: {testResults.length} |
          Passed: {testResults.filter(r => r.status === 'success').length} |
          Failed: {testResults.filter(r => r.status === 'failed').length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  retestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retestText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  testItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  summary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TestScreen;
