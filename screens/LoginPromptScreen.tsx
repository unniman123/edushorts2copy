/**
 * LoginPromptScreen - Contextual authentication prompt for guest users
 * 
 * Displays an attractive, contextual prompt encouraging users to sign in
 * for protected features like bookmarks and profile access. Provides
 * clear value propositions and smooth transition to authentication flow.
 * 
 * @component
 * @param {LoginPromptProps} props - Component properties
 * @returns {React.ReactElement} The rendered login prompt screen
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { COMMON_STYLES } from '../constants/commonStyles';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LoginPromptProps {
  context?: string;
}

const PROMPT_CONTENT = {
  bookmarks: {
    icon: 'bookmark',
    title: 'Save Your Favorite Articles',
    subtitle: 'Sign in to bookmark articles and access them anywhere',
    features: [
      'Save articles for later reading',
      'Sync bookmarks across devices',
      'Never lose important education news',
      'Get personalized recommendations'
    ]
  },
  profile: {
    icon: 'user',
    title: 'Personalize Your Experience',
    subtitle: 'Sign in to unlock your personalized education hub',
    features: [
      'Track your reading progress',
      'Get personalized notifications',
      'Customize content preferences',
      'Access exclusive features'
    ]
  },
  notifications: {
    icon: 'bell',
    title: 'Stay Updated',
    subtitle: 'Sign in to receive personalized education alerts',
    features: [
      'Breaking education news alerts',
      'Visa deadline reminders',
      'University application updates',
      'Scholarship notifications'
    ]
  }
} as const;

export default function LoginPromptScreen({ context = 'bookmarks' }: LoginPromptProps) {
  const navigation = useNavigation<NavigationProp>();
  const content = PROMPT_CONTENT[context as keyof typeof PROMPT_CONTENT] || PROMPT_CONTENT.bookmarks;

  const handleSignIn = () => {
    navigation.navigate('Login', {
      returnTo: 'Guest',
      context: context
    });
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f9fa']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name={content.icon as any} size={48} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {content.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Feather name="check-circle" size={20} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>

            <Text style={styles.continueText}>
              or continue browsing as guest
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.flex1,
  },
  safeArea: {
    ...COMMON_STYLES.flex1,
  },
  content: {
    ...COMMON_STYLES.flex1,
    paddingHorizontal: 24,
    ...COMMON_STYLES.centerVertical,
  },
  header: {
    ...COMMON_STYLES.centerHorizontal,
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${COLORS.PRIMARY}15`,
    ...COMMON_STYLES.centerContent,
    marginBottom: 24,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.EXTRA_BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    ...COMMON_STYLES.flexRow,
    marginBottom: 16,
    paddingLeft: 8,
  },
  featureText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  signInButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.LARGE,
    ...COMMON_STYLES.centerHorizontal,
  },
  signInButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.LARGE,
    ...COMMON_STYLES.centerHorizontal,
  },
  signUpButtonText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  continueText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
});
