import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { handleGoogleSignIn } from '../utils/authHelpers';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const useAuth = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        // Successful login
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setIsLoading(true);
    try {
      await handleGoogleSignIn();
      // On success, the AuthContext listener should handle the navigation
    } catch (error: any) {
      // Error is handled by a toast in `handleGoogleSignIn`
      console.error('Social login error:', error);
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin,
    handleSocialLogin,
    handleForgotPassword,
  };
}; 