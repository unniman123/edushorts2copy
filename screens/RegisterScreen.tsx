import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, COMPONENT_STYLES } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { toast } from 'sonner-native';
import { supabase } from '../utils/supabase';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user with Supabase auth
      const redirectUrl = Linking.createURL('auth/confirm');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            source: 'mobile'  // Add source to indicate where user signed up from
          },
          emailRedirectTo: redirectUrl
        }
      });

      console.log('Redirect URL:', redirectUrl); // For debugging

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('No user returned from sign up');

      // Note: Profile and role creation will happen in EmailConfirmationScreen
      // after the user confirms their email

      const identities = data.user?.identities ?? [];

      // Check if email confirmation is required
      if (identities.length === 0) {
        // This means the email already exists but is not confirmed
        Alert.alert(
          'Verification Required',
          'This email is already registered but not confirmed. Please check your inbox for the verification email.',
        );
      } else if (!identities[0]?.identity_data?.email_verified) {
        // Email confirmation is required
        Alert.alert(
          'Success',
          'Registration successful! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              // Navigate directly to EmailConfirmationScreen, passing the email
              onPress: () => navigation.navigate('EmailConfirmation', { email: email })
            }
          ]
        );
      } else {
        // Email confirmation is not required or already confirmed
        // This case might need review - should it still go to Login or Main? Assuming Login for now.
        Alert.alert(
          'Success',
          'Registration successful!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login', { emailConfirmed: true })
            }
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Error', errorMessage);
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Sign Up</Text>
          <Text style={styles.subHeader}>Join Edushorts - Educational News Aggregator</Text>

          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Legal Policy Links - Google Play Compliance */}
          <View style={styles.legalLinksContainer}>
            <Text style={styles.legalDisclaimerText}>
              By signing up, you agree with our{' '}
            </Text>
            <View style={styles.legalLinksRow}>
              <TouchableOpacity
                onPress={() => handleExternalLink('https://edushorts-website.vercel.app/terms-conditions.html')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.legalLinkTouchable}
              >
                <Text style={styles.legalLinkText}>terms of use</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}> and </Text>
              <TouchableOpacity
                onPress={() => handleExternalLink('https://edushorts-website.vercel.app/privacy-policy.html')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.legalLinkTouchable}
              >
                <Text style={styles.legalLinkText}>privacy policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}> and for further information </Text>
              <TouchableOpacity
                onPress={() => handleExternalLink('https://edushorts-website.vercel.app/#contact')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.legalLinkTouchable}
              >
                <Text style={styles.legalLinkText}>contact us</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLinkContainer}
            onPress={() => navigation.navigate('Login', { emailConfirmed: false })}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE
  },
  keyboard: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  header: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center'
  },
  subHeader: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    ...COMPONENT_STYLES.INPUT_CONTAINER,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.TEXT_PRIMARY
  },
  // Legal Policy Links - Google Play Compliance
  legalLinksContainer: {
    alignItems: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLinkTouchable: {
    paddingVertical: 2,
    paddingHorizontal: 2,
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
  button: {
    ...COMPONENT_STYLES.BUTTON_PRIMARY,
    height: 56,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.WHITE
  },
  loginLinkContainer: {
    alignItems: 'center',
    padding: 8,
  },
  loginLinkText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
  loginLinkHighlight: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
});
