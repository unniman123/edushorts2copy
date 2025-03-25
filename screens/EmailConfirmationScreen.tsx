import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type EmailConfirmationRouteProp = RouteProp<RootStackParamList, 'EmailConfirmation'>;
type EmailConfirmationNavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

export default function EmailConfirmationScreen() {
  const [isConfirming, setIsConfirming] = useState(true);
  const route = useRoute<EmailConfirmationRouteProp>();
  const navigation = useNavigation<EmailConfirmationNavigationProp>();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL params or deep link
        const token = route.params.token;

        if (!token) {
          throw new Error('No confirmation token found');
        }

        console.log('Confirming email with token:', token); // For debugging

        // Confirm the email
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (error) {
          console.error('Verification error:', error); // For debugging
          throw error;
        }

        toast.success('Email confirmed successfully!');

        // Get the current user and ensure data exists
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('Get user error:', userError); // For debugging
          throw userError;
        }

        if (!user) {
          throw new Error('No user found after confirmation');
        }
        
        if (user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                username: user.email?.split('@')[0],
                notification_preferences: { push: true, email: false }
              }
            ]);

          if (profileError) throw profileError;

          // Assign user role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([
              {
                user_id: user.id,
                role: 'user'
              }
            ]);

          if (roleError) throw roleError;
        }

        // Navigate to login
        navigation.navigate('Login', { emailConfirmed: true });
      } catch (error) {
        console.error('Error confirming email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to confirm email';
        toast.error(errorMessage);
        navigation.navigate('Login', { emailConfirmed: false });
      } finally {
        setIsConfirming(false);
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isConfirming ? (
          <>
            <ActivityIndicator size="large" color="#ff0000" />
            <Text style={styles.text}>Confirming your email...</Text>
          </>
        ) : (
          <Text style={styles.text}>Redirecting...</Text>
        )}
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
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
});
