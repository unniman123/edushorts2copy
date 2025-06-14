import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService, DeepLinkHandler } from '../services';
import { useAuth } from './AuthContext';
import { NavigationContainerRef } from '@react-navigation/native';

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

  const setupNotifications = async () => {
    try {
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

  useEffect(() => {
    if (session?.user) {
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

    // Handle notification responses
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        if (data.deep_link) {
          deepLinkHandler.handleDeepLink(data.deep_link);
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
  }, [session?.user, navigation, deepLinkHandler]);

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
