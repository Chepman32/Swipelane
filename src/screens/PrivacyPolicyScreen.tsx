import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

const PRIVACY_POLICY_URL =
  'https://www.freeprivacypolicy.com/live/f4667801-4c38-475d-b68c-a813b586adae';

const PrivacyPolicyScreen: React.FC = () => {
  const { themeDefinition } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeDefinition.colors.background },
      ]}
    >
      <WebView
        source={{ uri: PRIVACY_POLICY_URL }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeDefinition.colors.primary} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PrivacyPolicyScreen;

