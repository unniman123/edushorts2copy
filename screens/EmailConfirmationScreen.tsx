import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as Linking from 'expo-linking'; // Import Linking
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type EmailConfirmationRouteProp = RouteProp<RootStackParamList, 'EmailConfirmation'>;
type EmailConfirmationNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EmailConfirmationScreen() {
  const route = useRoute<EmailConfirmationRouteProp>();
  const navigation = useNavigation<EmailConfirmationNavigationProp>();
  const { token, email } = route.params || {}; // Get both token and email

  // State for different processes
  const [isConfirming, setIsConfirming] = useState(!!token); // Only true if token exists initially
  const [isResending, setIsResending] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'success' | 'error' | 'idle'>('idle');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      if (!token) {
        // No token, just display the initial message and resend button
        setConfirmationStatus('idle');
        setIsConfirming(false);
        return;
      }

      // Token exists, attempt confirmation
      setIsConfirming(true);
      setConfirmationStatus('pending');
      console.log('Confirming email with token:', token); // For debugging

      try {

        // Confirm the email using the token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (verifyError) {
          console.error('Verification error:', verifyError); // For debugging
          throw verifyError;
        }

        setConfirmationStatus('success');
        toast.success('Email confirmed successfully!');

        // Get the current user to potentially create profile/role if needed
        // Note: Profile/role creation might be better handled on first login after confirmation
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) console.error('Get user error after confirmation:', userError); // Log but don't block navigation

        // Navigate to login with success flag
        navigation.navigate('Login', { emailConfirmed: true });

      } catch (error) {
        setConfirmationStatus('error');
        console.error('Error confirming email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to confirm email';
        toast.error(`Confirmation failed: ${errorMessage}`);
        // Stay on this screen or navigate back to Login without success flag? Staying for now.
        // navigation.navigate('Login', { emailConfirmed: false });
      } finally {
        setIsConfirming(false);
      }
    };

    handleEmailConfirmation();
  }, [token, navigation]); // Depend on token

  // Function to handle resending the verification email
  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Cannot resend email. Email address not provided.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: Linking.createURL('auth/confirm') // Use the same redirect URL
        }
      });

      if (error) throw error;

      toast.success('Verification email resent! Please check your inbox.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsResending(false);
    }
  };

  // Determine what to display
  const renderContent = () => {
    if (isConfirming) {
      return (
        <>
          <ActivityIndicator size="large" color="#ff0000" />
          <Text style={styles.text}>Confirming your email...</Text>
        </>
      );
    }

    if (confirmationStatus === 'success') {
       return <Text style={styles.text}>Email confirmed! Redirecting to login...</Text>;
    }

    // Default state: Show message and resend button
    return (
      <>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.text}>
          We've sent a confirmation link to <Text style={styles.emailText}>{email || 'your email address'}</Text>.
          Please click the link to verify your account.
        </Text>
        {confirmationStatus === 'error' && (
           <Text style={[styles.text, styles.errorText]}>
             There was an issue confirming your email. Please try resending the link.
           </Text>
        )}
        <TouchableOpacity
          style={[styles.button, isResending && styles.buttonDisabled]}
          onPress={handleResendVerification}
          disabled={isResending || !email}
        >
          {isResending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Resend Confirmation Email</Text>
          )}
        </TouchableOpacity>
         <TouchableOpacity onPress={() => navigation.navigate('Login', {})}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24, // Increased padding
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#666', // Darker grey
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24, // Improved readability
  },
  emailText: {
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    color: '#cc0000', // Error color
    marginTop: 8,
  },
  button: {
    backgroundColor: '#ff0000',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32, // More space before button
    paddingHorizontal: 24,
    width: '100%', // Make button full width
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
   backToLoginText: {
    marginTop: 24,
    fontSize: 14,
    color: '#ff0000',
    textDecorationLine: 'underline',
  },
});
