/**
 * AuthPromptModal - Modal-based authentication prompt with back button support
 * 
 * A React Native modal that properly handles hardware back button presses
 * and provides contextual authentication prompts for guest users. Replaces
 * Alert.alert() with a proper modal for better UX and back button handling.
 * 
 * @component
 * @param {AuthPromptModalProps} props - Component properties
 * @returns {React.ReactElement} The rendered auth prompt modal
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  BackHandler,
  Dimensions,
  Pressable,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Not available in this project
import { Feather } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { COMMON_STYLES } from '../constants/commonStyles';

interface AuthPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onCreateAccount: () => void;
  context: string;
  title: string;
  message: string;
  loginText: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function AuthPromptModal({
  visible,
  onClose,
  onSignIn,
  onCreateAccount,
  context,
  title,
  message,
  loginText
}: AuthPromptModalProps) {

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true; // Prevent default behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'bookmarks': return 'bookmark';
      case 'profile': return 'user';
      case 'notifications': return 'bell';
      case 'settings': return 'settings';
      default: return 'bookmark';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.blurContainer}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose}
          />
          
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <Pressable 
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed
              ]}
              onPress={onClose}
            >
              <Feather name="x" size={20} color={COLORS.TEXT_SECONDARY} />
            </Pressable>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Feather 
                name={getContextIcon(context) as any} 
                size={48} 
                color={COLORS.PRIMARY} 
              />
            </View>

            {/* Content */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable 
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed
                ]}
                onPress={onSignIn}
              >
                <View style={styles.buttonContent}>
                  <Feather name="log-in" size={20} color={COLORS.WHITE} style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>{loginText}</Text>
                </View>
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed
                ]}
                onPress={onCreateAccount}
              >
                <View style={styles.buttonContent}>
                  <Feather name="user-plus" size={20} color={COLORS.PRIMARY} style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>Create Account</Text>
                </View>
              </Pressable>

              <Pressable 
                style={({ pressed }) => [
                  styles.textButton,
                  pressed && styles.textButtonPressed
                ]}
                onPress={onClose}
              >
                <Text style={styles.textButtonText}>Continue as Guest</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...COMMON_STYLES.flex1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurContainer: {
    ...COMMON_STYLES.flex1,
    ...COMMON_STYLES.centerContent,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 24,
    borderRadius: BORDER_RADIUS.XL,
    padding: 32,
    maxWidth: screenWidth - 48,
    ...COMMON_STYLES.centerHorizontal,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.GRAY_100,
    ...COMMON_STYLES.centerContent,
    zIndex: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${COLORS.PRIMARY}15`,
    ...COMMON_STYLES.centerContent,
    marginBottom: 20,
    marginTop: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.EXTRA_BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  buttonContent: {
    ...COMMON_STYLES.flexRowCenter,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.LARGE,
    ...COMMON_STYLES.centerHorizontal,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.PRIMARY_DARK,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.LARGE,
    ...COMMON_STYLES.centerHorizontal,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonPressed: {
    backgroundColor: `${COLORS.PRIMARY}08`,
    borderColor: COLORS.PRIMARY_DARK,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.05,
    elevation: 2,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    letterSpacing: 0.5,
  },
  textButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.MEDIUM,
    ...COMMON_STYLES.centerHorizontal,
  },
  textButtonPressed: {
    backgroundColor: COLORS.GRAY_100,
    transform: [{ scale: 0.98 }],
  },
  textButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    textDecorationLine: 'underline',
  },
  closeButtonPressed: {
    backgroundColor: COLORS.GRAY_300,
    transform: [{ scale: 0.95 }],
  },
});
