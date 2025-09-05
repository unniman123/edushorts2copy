/**
 * useGuestAuth - Hook for handling guest mode authentication prompts
 * 
 * Provides utilities for guest mode applications to prompt for authentication
 * when users try to access protected features. Handles contextual navigation
 * and smooth transitions between guest and authenticated states.
 * 
 * @hook
 * @returns {UseGuestAuthReturn} Authentication prompt utilities
 * 
 * @example
 * const { promptForAuth, isGuest } = useGuestAuth();
 * 
 * const handleSaveArticle = () => {
 *   if (isGuest) {
 *     promptForAuth('bookmarks', 'Save this article to read later');
 *   } else {
 *     // Proceed with save
 *   }
 * };
 */
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseGuestAuthReturn {
  /** Whether user is in guest mode (not authenticated) */
  isGuest: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Prompt for authentication with context */
  promptForAuth: (context: string, message?: string) => void;
  /** Navigate to login with context */
  navigateToLogin: (context: string, returnTo?: string) => void;
  /** Navigate to register */
  navigateToRegister: () => void;
  /** Modal visibility state */
  modalVisible: boolean;
  /** Modal content */
  modalContent: {
    context: string;
    title: string;
    message: string;
    loginText: string;
  };
  /** Close modal */
  closeModal: () => void;
  /** Handle sign in from modal */
  handleModalSignIn: () => void;
  /** Handle create account from modal */
  handleModalCreateAccount: () => void;
}

export function useGuestAuth(): UseGuestAuthReturn {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    context: '',
    title: '',
    message: '',
    loginText: ''
  });
  
  const isAuthenticated = !!session;
  const isGuest = !session;

  const promptForAuth = (context: string, message?: string) => {
    const contextMessages = {
      bookmarks: {
        title: 'Save Articles',
        message: message || 'Sign in to save articles and access them anywhere, anytime.',
        loginText: 'Sign In to Save'
      },
      profile: {
        title: 'Access Profile',
        message: message || 'Sign in to access your profile and preferences.',
        loginText: 'Sign In'
      },
      notifications: {
        title: 'Enable Notifications',
        message: message || 'Sign in to receive personalized education news and visa alerts.',
        loginText: 'Sign In for Alerts'
      },
      settings: {
        title: 'Access Settings',
        message: message || 'Sign in to customize your experience and manage preferences.',
        loginText: 'Sign In'
      }
    };

    const content = contextMessages[context as keyof typeof contextMessages] || contextMessages.bookmarks;

    setModalContent({
      context,
      title: content.title,
      message: content.message,
      loginText: content.loginText
    });
    setModalVisible(true);
  };

  const navigateToLogin = (context: string, returnTo: string = 'Guest') => {
    navigation.navigate('Login', {
      returnTo,
      context
    });
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleModalSignIn = () => {
    setModalVisible(false);
    // Minimal delay for smooth transition
    setTimeout(() => {
      navigateToLogin(modalContent.context, 'Guest');
    }, 100);
  };

  const handleModalCreateAccount = () => {
    setModalVisible(false);
    // Minimal delay for smooth transition
    setTimeout(() => {
      navigateToRegister();
    }, 100);
  };

  return {
    isGuest,
    isAuthenticated,
    promptForAuth,
    navigateToLogin,
    navigateToRegister,
    modalVisible,
    modalContent,
    closeModal,
    handleModalSignIn,
    handleModalCreateAccount
  };
}
