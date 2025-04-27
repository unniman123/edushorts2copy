import { toast as sonnerToast } from 'sonner-native';
import { Dimensions, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');

// Define interface for type safety
interface ToastConfig {
  duration: number;
  style: ViewStyle;
}

// Base toast configuration with mobile-specific settings
const baseConfig: ToastConfig = {
  duration: 5000,
  style: {
    width: width * 0.9, // 90% of screen width
    marginBottom: 20
  }
};

// Success messages use shorter duration
export const TOAST_SUCCESS_CONFIG: ToastConfig = {
  ...baseConfig,
  duration: 3000
};

// Error messages use full duration
export const TOAST_ERROR_CONFIG: ToastConfig = {
  ...baseConfig,
  duration: 5000
};

// Basic config for non-critical messages
export const TOAST_CONFIG: ToastConfig = baseConfig;

// Standardized toast messages matching admin panel exactly
export const TOAST_MESSAGES = {
  PUSH_ENABLED: 'Push notifications enabled successfully!',
  NO_DEVICES: 'No registered devices found. Users need to install the app and grant notification permissions first.',
  TOKEN_ERROR: 'Could not get push token from Expo.',
  REGISTRATION_ERROR: 'Failed to register for push notifications.',
  PROFILE_UPDATE_ERROR: 'Failed to update profile with notification token.',
  TOKEN_STORE_ERROR: 'Failed to store notification token.',
  LISTENER_ERROR: 'Failed to initialize notification listeners.'
};

// Export configured toast instance
export const toast = sonnerToast;
