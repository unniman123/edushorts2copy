import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

export default function EmailConfirmationScreen() {
  const [isConfirming, setIsConfirming] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from the URL params
        const params = route.params as { token?: string };
        if (!params?.token) {
          throw new Error('No confirmation token found');
        }

        // Confirm the email
        const { error } = await supabase.auth.verifyOtp({
          token_hash: params.token,
          type: 'email'
        });

        if (error) throw error;

        toast.success('Email confirmed successfully!');
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
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
