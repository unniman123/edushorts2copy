import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService, DeepLinkHandler } from '../services';
import { useAuth } from './AuthContext';
import { NavigationContainerRef } from '@react-navigation/native';
import { normalizeNotificationDeepLink, routeNotificationDeepLink } from '../utils/notificationHelpers';

interface NotificationContextProps {
  setupNotifications: () => Promise<void>;
  updatePushToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children, navigation }: { children: React.ReactNode, navigation: NavigationContainerRef<any> }) {
  const { session } = useAuth();
  const notificationService = NotificationService.getInstance();
  const deepLinkHandler = DeepLinkHandler.getInstance();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

  // Check if NotificationService is initialized
  const checkServiceInitialization = () => {
    try {
      // Try to access the messaging instance - if it throws, service isn't initialized
      notificationService.requestPermissions();
      return true;
    } catch (error: any) {
      if (error.message?.includes('MessagingService not initialized')) {
        return false;
      }
      return true; // Other errors mean service is initialized but there's a different issue
    }
  };

  const setupNotifications = async () => {
    try {
      // Wait for service to be initialized before proceeding
      if (!checkServiceInitialization()) {
        console.log('[NotificationContext] NotificationService not yet initialized, waiting...');
        return;
      }

      // registerForPushNotifications will request permissions and store tokens internally
      const tokens = await notificationService.registerForPushNotifications();
      if (tokens.expoToken || tokens.fcmToken) {
        console.log('Push notification tokens registered and stored.');
      } else {
        console.warn('Failed to register or store push notification tokens.');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const updatePushToken = async () => {
    try {
      // Ensure service is initialized before updating tokens
      if (!checkServiceInitialization()) {
        console.log('[NotificationContext] NotificationService not yet initialized for token update.');
        return;
      }

      // registerForPushNotifications will handle requesting and storing new tokens
      const tokens = await notificationService.registerForPushNotifications();
      if (tokens.expoToken || tokens.fcmToken) {
        console.log('Push notification tokens updated and stored.');
      } else {
        console.warn('Failed to update or store push notification tokens.');
      }
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  };

  // Polling mechanism to check for service initialization
  useEffect(() => {
    const checkInitialization = () => {
      if (checkServiceInitialization()) {
        setIsServiceInitialized(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkInitialization()) {
      return;
    }

    // Poll every 500ms for up to 10 seconds
    const pollInterval = setInterval(() => {
      if (checkInitialization()) {
        clearInterval(pollInterval);
      }
    }, 500);

    // Cleanup after 10 seconds to avoid infinite polling
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      console.warn('[NotificationContext] Service initialization check timed out');
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (session?.user && isServiceInitialized) {
      setupNotifications();
    }

    // Configure foreground notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: Platform.OS === 'ios',
      }),
    });

    // Listen for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        notificationService.handleNotification(notification);
      }
    );

    // Handle notification responses (user taps notification)
    // Updated to use centralized deep link routing with normalization
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async response => {
        console.log('[NotificationContext] Notification response received:', response);
        const data = response.notification.request.content.data;
        
        // Use normalized deep link extraction to handle various payload key names
        const deepLink = normalizeNotificationDeepLink(data);
        
        if (deepLink) {
          console.log('[NotificationContext] Routing notification tap deep link:', deepLink);
          // Use centralized executor for consistent Branch/DeepLinkHandler routing
          const handled = await routeNotificationDeepLink(deepLink);
          if (!handled) {
            console.warn('[NotificationContext] Deep link routing returned false:', deepLink);
          }
        } else {
          console.log('[NotificationContext] No deep link found in notification response');
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [session?.user, navigation, deepLinkHandler, isServiceInitialized]);

  return (
    <NotificationContext.Provider value={{ setupNotifications, updatePushToken }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
