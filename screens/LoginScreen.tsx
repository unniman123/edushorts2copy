import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
// Import the new function and remove the old one if unused elsewhere
import { handleGoogleSignIn } from '../utils/authHelpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type RouteProps = RouteProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { emailConfirmed, pendingConfirmation } = route.params || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Removed useEffect for confirmation alerts

  // Removed handleResendVerification function

  const handleLogin = async () => {
    // Correct start of handleLogin
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          // Navigate to EmailConfirmationScreen instead of showing alert
          Alert.alert( // Keep a simple alert for user feedback before navigating
            'Email Not Verified',
            'Please confirm your email address. Redirecting you to the confirmation screen.'
          );
          navigation.navigate('EmailConfirmation', { email: email });
          return;
        }

        // For other errors
        console.error('Sign in error:', signInError); // For debugging
        throw signInError;
      }
      if (!user) throw new Error('No user returned from sign in');

      // Check if profile exists, if not create one
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username: email.split('@')[0],
              notification_preferences: { push: true, email: false }
            }
          ]);

        if (createError) throw createError;
      }

      // Check user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!rolesError && roles?.role === 'admin') {
        Alert.alert('Welcome', 'Welcome back, Admin!');
      } else {
        Alert.alert('Success', 'Login successful!');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated to call the new native Google Sign-In helper
  const handleSocialLogin = async () => { // No provider needed anymore
    setIsLoading(true);
    try {
      // Call the new function, it returns true/false but we don't need to act on it here
      // as navigation is handled by AuthContext
      await handleGoogleSignIn();
      // No navigation needed here on success
    } catch (error) {
      // Error handling is done within handleGoogleSignIn (shows toast)
      // We could potentially add more specific handling here if needed
      console.error('LoginScreen: Error during handleGoogleSignIn call:', error);
      // Optionally show a generic alert as a fallback, though toast is preferred
      // Alert.alert('Error', 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL('auth/reset-password')
      });
      if (error) throw error;
      Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/app-logo.png')}
              style={styles.logo}
            />
            <Text style={styles.logoText}>Edushorts</Text>
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
              <Text style={styles.subtitle}>"Your Daily Briefing on Foreign Education & Immigration."</Text>
            </Animated.View>
          </View>

          <View style={styles.formContainer}>
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
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              {/* Removed Resend confirmation button */}
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Logging in...</Text>
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={[styles.socialButton, { flex: 1 }]}
                onPress={handleSocialLogin} // Call without provider argument
                disabled={isLoading}
              >
                <Feather name="chrome" size={20} color="#DB4437" />
                <Text style={styles.socialButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

            </ScrollView>
          </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#FF0000', // Solid red background
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.25,
    lineHeight: 22,
    maxWidth: '80%',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white background for inputs
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    color: '#555', // Darker icon color
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333', // Keep input text dark
  },
  eyeIcon: {
    padding: 4,
    color: '#555', // Darker icon color
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPassword: {
    flex: 1,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FFFFFF', // Changed to white
    fontWeight: 'bold', // Make it bolder
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  resendButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resendButtonText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#ff0000',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#eeeeee',
  },
  orText: {
    color: '#FFFFFF', // Changed to white
    fontWeight: 'bold',
    marginHorizontal: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly less transparent white for social button
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333', // Keep text dark
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#FFFFFF', // Changed to white
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF', // Changed to white
    marginLeft: 4,
    textDecorationLine: 'underline', // Add underline
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});
