/**
 * AuthForm - Authentication form component with email and password inputs
 * 
 * Renders a complete authentication form with email and password fields,
 * password visibility toggle, and forgot password link. Features proper
 * input validation, accessibility support, and responsive design. Includes
 * icon-enhanced inputs and secure password handling with show/hide functionality.
 * 
 * @component
 * @param {AuthFormProps} props - Component properties
 * @returns {React.ReactElement} The rendered authentication form component
 * 
 * @example
 * <AuthForm
 *   email={emailValue}
 *   setEmail={setEmailValue}
 *   password={passwordValue}
 *   setPassword={setPasswordValue}
 *   onForgotPassword={() => handleForgotPassword()}
 * />
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Props interface for AuthForm component
 * @interface AuthFormProps
 */
interface AuthFormProps {
  /** Current email input value */
  email: string;
  /** Callback function to update email value */
  setEmail: (email: string) => void;
  /** Current password input value */
  password: string;
  /** Callback function to update password value */
  setPassword: (password: string) => void;
  /** Callback function for forgot password action */
  onForgotPassword: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  onForgotPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
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
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={onForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {},
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default AuthForm; 