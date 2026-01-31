import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useResponsive } from '../hooks/useResponsive';
import FeedbackService from '../services/FeedbackService';
import type { RootStackParamList } from '../navigation/AppNavigator';

const appIcon = require('../assets/icons/Swipelane_icon.png');
const APP_VERSION = '1.0.0';
const COPYRIGHT_YEAR = 2026;

type RowConfig = {
  label: string;
  value?: string;
  chevronColor?: string;
  showChevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
};

const AboutScreen: React.FC = () => {
  const { themeDefinition } = useTheme();
  const { t } = useLanguage();
  const { scale, scaleFont } = useResponsive();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'About'>>();

  const sectionCaptionColor = themeDefinition.colors.text + '80';
  const mutedTextColor = themeDefinition.colors.text + '99';
  const dividerColor = themeDefinition.colors.border;

  const sectionCardStyle = {
    backgroundColor: themeDefinition.colors.card,
    borderColor: themeDefinition.colors.border,
    borderRadius: scale(18),
  } as const;

  const handleOpenPrivacyPolicy = () => {
    FeedbackService.buttonTap();
    navigation.navigate('PrivacyPolicy');
  };

  const renderDivider = (inset: number = scale(16)) => (
    <View
      style={[
        styles.rowDivider,
        { backgroundColor: dividerColor, marginLeft: inset },
      ]}
    />
  );

  const renderRow = ({
    label,
    value,
    chevronColor,
    showChevron,
    onPress,
    isLast,
  }: RowConfig) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.rowLabel,
          { color: themeDefinition.colors.text, fontSize: scaleFont(16) },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value ? (
          <Text
            style={[
              styles.rowValue,
              { color: themeDefinition.colors.text, fontSize: scaleFont(16) },
            ]}
          >
            {value}
          </Text>
        ) : null}
        {showChevron ? (
          <Text
            style={[
              styles.rowChevron,
              {
                color: chevronColor ?? themeDefinition.colors.primary,
                fontSize: scaleFont(20),
              },
            ]}
          >
            ›
          </Text>
        ) : null}
      </View>
      {!isLast ? renderDivider() : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeDefinition.colors.background }]}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: scale(20),
            paddingBottom: scale(36),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.header,
            { marginTop: scale(8), marginBottom: scale(26) },
          ]}
        >
          <Image
            source={appIcon}
            style={[
              styles.logo,
              {
                width: scale(96),
                height: scale(96),
                borderRadius: scale(24),
              },
            ]}
          />
          <Text
            style={[
              styles.appName,
              {
                color: themeDefinition.colors.text,
                fontSize: scaleFont(32),
                marginTop: scale(12),
              },
            ]}
          >
            Swipelane
          </Text>
          <Text
            style={[
              styles.tagline,
              {
                color: mutedTextColor,
                fontSize: scaleFont(15),
                marginTop: scale(4),
              },
            ]}
          >
            {t('about_tagline')}
          </Text>
          <View
            style={[
              styles.versionBadge,
              {
                backgroundColor: themeDefinition.colors.border,
                marginTop: scale(10),
                paddingHorizontal: scale(16),
                paddingVertical: scale(6),
                borderRadius: scale(14),
              },
            ]}
          >
            <Text
              style={[
                styles.versionText,
                { color: mutedTextColor, fontSize: scaleFont(13) },
              ]}
            >
              {t('about_version', { version: APP_VERSION })}
            </Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionCaption,
              { color: sectionCaptionColor, fontSize: scaleFont(13) },
            ]}
          >
            {t('about_section_info')}
          </Text>
          <View style={[styles.sectionCard, sectionCardStyle]}>
            {renderRow({
              label: t('about_label_developer'),
              value: 'Anton Chepur',
            })}
            {renderRow({
              label: t('about_label_powered_by'),
              value: 'React Native',
            })}
            {renderRow({
              label: t('about_label_copyright'),
              value: `© ${COPYRIGHT_YEAR} Anton Chepur`,
              isLast: true,
            })}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionCaption,
              { color: sectionCaptionColor, fontSize: scaleFont(13) },
            ]}
          >
            {t('about_section_legal')}
          </Text>
          <View style={[styles.sectionCard, sectionCardStyle]}>
            {renderRow({
              label: t('privacy_policy_title'),
              chevronColor: themeDefinition.colors.primary,
              showChevron: true,
              onPress: handleOpenPrivacyPolicy,
              isLast: true,
            })}
          </View>
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
  },
  scrollContent: {
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  appName: {
    fontWeight: '800',
  },
  tagline: {
    fontWeight: '600',
  },
  versionBadge: {
    borderWidth: 0,
  },
  versionText: {
    fontWeight: '700',
  },
  sectionBlock: {
    width: '100%',
    marginBottom: 22,
  },
  sectionCaption: {
    fontWeight: '800',
    marginBottom: 10,
    paddingLeft: 6,
    textTransform: 'none',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontWeight: '700',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontWeight: '600',
  },
  rowChevron: {
    fontWeight: '900',
    marginLeft: 2,
  },
  rowDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});

export default AboutScreen;
