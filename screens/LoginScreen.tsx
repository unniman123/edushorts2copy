import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { handleOAuthSignIn } from '../utils/authHelpers';

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

  useEffect(() => {
    if (emailConfirmed === true) {
      Alert.alert('Success', 'Email confirmed successfully! You can now log in.');
    } else if (emailConfirmed === false && pendingConfirmation) {
      Alert.alert(
        'Email Verification Required',
        'Please check your email for verification link',
        [
          {
            text: 'Resend Email',
            onPress: handleResendVerification,
          },
          {
            text: 'OK',
          },
        ]
      );
    }
  }, [emailConfirmed, pendingConfirmation]);

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: Linking.createURL('auth/confirm')
        }
      });

      if (error) throw error;

      Alert.alert('Success', 'Verification email resent! Please check your inbox.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLogin = async () => {
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
          Alert.alert(
            'Email Not Verified',
            'Please confirm your email address. Check your inbox for the verification link.',
            [
              {
                text: 'Resend Email',
                onPress: handleResendVerification,
              },
              {
                text: 'OK',
              },
            ]
          );
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

  const handleSocialLogin = async (provider: 'google') => {
    setIsLoading(true);
    try {
      await handleOAuthSignIn(provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      Alert.alert('Error', message);
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
              source={{ uri: 'https://api.a0.dev/assets/image?text=GlobalEdu%20News%20Logo&aspect=1:1&seed=123' }}
              style={styles.logo}
            />
            <Text style={styles.logoText}>Edushorts</Text>
          </View>

          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to access personalized news for international students</Text>

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
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendVerification}
              >
                <Text style={styles.resendButtonText}>Resend confirmation</Text>
              </TouchableOpacity>
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
                onPress={() => handleSocialLogin('google')}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff0000',
    marginTop: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
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
    color: '#ff0000',
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
    color: '#888',
    marginHorizontal: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff0000',
    marginLeft: 4,
  },
});
