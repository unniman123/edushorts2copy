import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './HomeScreen';
import { toast } from 'sonner-native';
import { EXPO_PUBLIC_USE_MOCK } from '../lib/dataAdapter';
import { supabase } from '../lib/supabaseClient';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      if (EXPO_PUBLIC_USE_MOCK) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('Registration successful!');
        navigation.navigate('Login');
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed');
      }

      // Create profile record
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        password_hash: password, // Store for mock compatibility
        is_admin: false,
        is_active: true
      });

      if (profileError) {
        throw new Error('Failed to create profile');
      }

      toast.success('Registration successful!');
      navigation.navigate('Login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
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
          
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitle}>Join our community of international students</Text>
          
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
                accessible={true}
                accessibilityLabel="Email input field"
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
                accessible={true}
                accessibilityLabel="Password input field"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                accessible={true}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                accessible={true}
                accessibilityLabel="Confirm password input field"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessible={true}
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Register button"
              accessibilityHint="Creates a new account with the provided information"
            >
              {isLoading ? (
                <Text style={styles.registerButtonText}>Creating Account...</Text>
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              accessible={true}
              accessibilityLabel="Login link"
              accessibilityHint="Navigate to login screen"
            >
              <Text style={styles.loginLink}>Login</Text>
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
    color: '#0066cc',
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
  registerButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginLeft: 4,
  },
});
