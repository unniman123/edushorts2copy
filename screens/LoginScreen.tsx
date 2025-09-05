import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { COMMON_STYLES } from '../constants/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { handleGoogleSignIn } from '../utils/authHelpers';
import { getErrorMessage, handleAuthError } from '../utils/errorHandler';
import * as Linking from 'expo-linking';
import AuthForm from '../components/auth/AuthForm';
import SocialSignInButtons from '../components/auth/SocialSignInButtons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const { isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get navigation context from route params
  const { returnTo, context } = route.params || {};

  // Entrance animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current; // small upward motion
  const scale = useRef(new Animated.Value(0.995)).current; // subtle pop

  useEffect(() => {
    // Composite entrance animation for smoother visual transition
    // Slower duration and easing for a gentler appearance
    const duration = 420;
    const ease = Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        easing: ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Verified',
            'Please check your inbox to confirm your email address.'
          );
          navigation.navigate('EmailConfirmation', { email });
        } else {
          throw error;
        }
      } else if (user) {
        // Navigate based on where user came from
        if (returnTo === 'Guest') {
          // User came from guest mode, send them to authenticated main
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          // Default navigation for direct login
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      }
    } catch (error: unknown) {
      const errorMessage = handleAuthError(error, {
        component: 'LoginScreen',
        operation: 'user_login',
        additionalData: { email }
      });
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setIsLoading(true);
    try {
      await handleGoogleSignIn();
    } catch (error: unknown) {
      const errorMessage = handleAuthError(error, {
        component: 'LoginScreen',
        operation: 'social_login'
      });
      console.error('Social login error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to reset your password.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL('auth/reset-password'),
      });
      if (error) throw error;
      Alert.alert('Password Reset', 'A password reset link has been sent to your email.');
    } catch (error: unknown) {
      const errorMessage = handleAuthError(error, {
        component: 'LoginScreen',
        operation: 'password_reset',
        additionalData: { email }
      });
      Alert.alert('Error', errorMessage || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error("Couldn't open URL", err);
      Alert.alert('Error', 'Unable to open the link. Please try again.');
    });
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f8f8', '#f0f0f0']}
      style={styles.backgroundImage}
    >
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: translateY },
              { scale: scale },
            ],
          }
        ]}
      >
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        {/* Fixed Logo Section - Not affected by keyboard */}
        <View style={styles.logoSection}>
                      <View style={styles.logoContainer}>
              <Image
                source={require('../assets/adaptive-icon-foreground.png')}
                style={styles.logo}
                onError={(error) => console.error('LoginScreen: Error loading logo:', error)}
              />
              <Text style={styles.logoText}>Edushorts</Text>
              <Text style={styles.taglineText}>
                {context === 'bookmarks' 
                  ? 'Sign in to save articles and access them anywhere, anytime.'
                  : context === 'profile' 
                  ? 'Sign in to access your personalized education hub'
                  : context === 'notifications'
                  ? 'Sign in to receive personalized education alerts'
                  : 'One simplified feed for the latest trusted foreign education and visa insights'
                }
              </Text>
            </View>
        </View>

        {/* Keyboard-Responsive Form Section */}
        <View style={styles.keyboardAvoidingView}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <AuthForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onForgotPassword={handleForgotPassword}
              />
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
              <SocialSignInButtons
                onGoogleSignIn={handleSocialLogin}
                isLoading={isLoading}
              />
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Legal Policy Links - Google Play Compliance */}
            <View style={styles.legalLinksContainer}>
              <Text style={styles.legalDisclaimerText}>
                By signing in, you agree with our{' '}
              </Text>
              <View style={styles.legalLinksRow}>
                <TouchableOpacity onPress={() => handleExternalLink('https://edushorts-website.vercel.app/terms-conditions.html')}>
                  <Text style={styles.legalLinkText}>terms of use</Text>
                </TouchableOpacity>
                <Text style={styles.legalSeparator}> and </Text>
                <TouchableOpacity onPress={() => handleExternalLink('https://edushorts-website.vercel.app/privacy-policy.html')}>
                  <Text style={styles.legalLinkText}>privacy policy</Text>
                </TouchableOpacity>
                <Text style={styles.legalSeparator}> and for further information </Text>
                <TouchableOpacity onPress={() => handleExternalLink('https://edushorts-website.vercel.app/#contact')}>
                  <Text style={styles.legalLinkText}>contact us</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
        </SafeAreaView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    ...COMMON_STYLES.flex1,
    backgroundColor: COLORS.WHITE,
  },
  animatedContainer: {
    ...COMMON_STYLES.flex1,
  },
  container: {
    ...COMMON_STYLES.flex1,
  },
  logoSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 15,
    ...COMMON_STYLES.centerHorizontal,
  },
  keyboardAvoidingView: COMMON_STYLES.flex1,
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    ...COMMON_STYLES.centerHorizontal,
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TITLE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.EXTRA_BOLD,
    color: COLORS.PRIMARY,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  taglineText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  formContainer: {
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    borderRadius: BORDER_RADIUS.LARGE,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    width: '100%',
    ...COMMON_STYLES.centerHorizontal,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.GRAY_300,
    borderColor: COLORS.GRAY_300,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  registerContainer: {
    ...COMMON_STYLES.flexRowCenter,
    marginBottom: 16,
  },
  registerText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.TEXT_SECONDARY,
  },
  registerLink: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.PRIMARY,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  // New styles for legal compliance
  legalLinksContainer: {
    ...COMMON_STYLES.centerHorizontal,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  legalDisclaimerText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  legalLinksRow: {
    ...COMMON_STYLES.flexRowCenter,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legalLinkText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.TEXT_SECONDARY,
  },
});
