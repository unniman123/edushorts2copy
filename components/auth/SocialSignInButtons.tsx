/**
 * SocialSignInButtons - Social authentication buttons component
 * 
 * Renders social sign-in options with Google authentication button and divider.
 * Features loading state handling, proper button styling, and responsive layout.
 * Includes visual separators and branded styling for social authentication
 * providers. Designed to be easily extensible for additional social providers.
 * 
 * @component
 * @param {SocialSignInButtonsProps} props - Component properties
 * @returns {React.ReactElement} The rendered social sign-in buttons component
 * 
 * @example
 * <SocialSignInButtons
 *   onGoogleSignIn={() => handleGoogleSignIn()}
 *   isLoading={isAuthLoading}
 * />
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Props interface for SocialSignInButtons component
 * @interface SocialSignInButtonsProps
 */
interface SocialSignInButtonsProps {
  /** Callback function for Google sign-in action */
  onGoogleSignIn: () => void;
  /** Whether authentication is in progress */
  isLoading: boolean;
}

// Custom Google Icon Component with official colors
const GoogleIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

const SocialSignInButtons: React.FC<SocialSignInButtonsProps> = ({
  onGoogleSignIn,
  isLoading,
}) => {
  return (
    <>
      <View style={styles.orContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={onGoogleSignIn}
          disabled={isLoading}
        >
          <View style={styles.googleIcon}>
            <GoogleIcon size={20} />
          </View>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
    color: '#666666',
    fontWeight: '500',
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  googleIcon: {
    marginRight: 15,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SocialSignInButtons; 