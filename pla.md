Okay, I see the issue clearly. The warnings are indeed due to using the "namespaced" API of React Native Firebase (e.g., analytics() or messaging()) instead of the newer "modular" API (e.g., getAnalytics(app) or getMessaging(app)).
Your package.json confirms you're on 22.1.0 for all @react-native-firebase packages, which is compatible with the modular API. Your app.tsx correctly uses getApp() to obtain the Firebase app instance. The problem is that this app instance isn't being passed down to the services that then use analytics() and messaging().
To resolve this, we'll modify your AnalyticsService and NotificationService to accept the Firebase app instance upon initialization. I'll also provide a template for RemoteConfigService, assuming it follows a similar pattern.
Here are the changes you need to make:
1. Update analytics.ts
You need to import getAnalytics and pass the FirebaseApp instance to your AnalyticsService singleton.
// analytics.ts
import analytics, { FirebaseAnalyticsTypes, getAnalytics } from '@react-native-firebase/analytics'; // Add getAnalytics
import { FirebaseApp } from '@react-native-firebase/app'; // Import FirebaseApp type
import {
  ANALYTICS_EVENTS,
  ArticleAnalyticsParams,
  AdAnalyticsParams,
  UserInteractionAnalyticsParams,
  ScreenViewAnalyticsParams,
  AnalyticsEventName,
  EventParams
} from '../src/types/analytics'; // Adjust path as needed

class AnalyticsService {
  private static instance: AnalyticsService;
  private firebaseApp: FirebaseApp | null = null; // Store the app instance

  private constructor() {
    // Private constructor for singleton pattern
    // Firebase-specific initialization is moved to the `initialize` method.
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initializes the AnalyticsService with the Firebase App instance.
   * This MUST be called before any other analytics methods.
   * @param app The FirebaseApp instance obtained from `@react-native-firebase/app`.
   */
  async initialize(app: FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    await this.setAnalyticsCollectionEnabled(true); // Enable collection by default
    if (__DEV__) {
      console.log('[AnalyticsService] Initialized with Firebase App.');
    }
  }

  /**
   * Generic method to log any analytics event.
   * @param name - The name of the event.
   * @param params - Optional parameters for the event.
   */
  async logEvent(name: AnalyticsEventName | string, params?: EventParams): Promise<void> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized with Firebase App. Call initialize() first.');
      return;
    }
    try {
      // Basic validation
      if (!name || typeof name !== 'string' || name.length > 40) {
      if (__DEV__) {
        console.warn(`[Analytics] Invalid event name: ${name}`);
      }
        return;
      }
      
      await getAnalytics(this.firebaseApp).logEvent(name, params); // MODIFIED
      if (__DEV__) {
        console.log(`[Analytics] Event logged: ${name}`, params || '');
      }
    } catch (error) {
      if (__DEV__) {
        console.error(`[Analytics] Error logging event "${name}":`, error);
      }
    }
  }

  // --- Specific Event Logging Methods (No changes needed here, as they call logEvent) ---
  async logArticleView(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_VIEW, params);
  }
  async logArticleShare(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_SHARE, params);
  }
  async logArticleBookmark(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_BOOKMARK, params);
  }
  async logArticleReadTime(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_READ_TIME, params);
  }
  async logArticleScroll(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_SCROLL, params);
  }
  async logAdImpression(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_IMPRESSION, params);
  }
  async logAdClick(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_CLICK, params);
  }
  async logAdViewComplete(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_VIEW_COMPLETE, params);
  }
  async logAdSkip(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_SKIP, params);
  }
  async logAdClose(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_CLOSE, params);
  }
  async logCategorySelect(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.CATEGORY_SELECT, params);
  }
  async logSearchAction(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SEARCH_ACTION, params);
  }
  async logUserEngagement(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.USER_ENGAGEMENT, params);
  }
  async logScreenView(params: ScreenViewAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SCREEN_VIEW, params);
  }
  async logLogin(method: string): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.LOGIN, { method });
  }
  async logSignUp(method: string): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SIGN_UP, { method });
  }

  // --- User Properties and Settings ---

  /**
   * Sets the user ID for analytics tracking.
   * @param userId - The unique identifier for the user.
   */
  async setUserId(userId: string | null): Promise<void> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized.');
      return;
    }
    try {
      await getAnalytics(this.firebaseApp).setUserId(userId); // MODIFIED
      if (__DEV__) {
        console.log(`[Analytics] User ID set: ${userId}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Error setting User ID:', error);
      }
    }
  }

  /**
   * Sets a user property for analytics.
   * @param name - The name of the user property.
   * @param value - The value of the user property.
   */
  async setUserProperty(name: string, value: string | null): Promise<void> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized.');
      return;
    }
    try {
      // ... existing validation
      
      await getAnalytics(this.firebaseApp).setUserProperty(name, value); // MODIFIED
      if (__DEV__) {
        console.log(`[Analytics] User property set: ${name} = ${value}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error(`[Analytics] Error setting User Property "${name}":`, error);
      }
    }
  }

  /**
   * Sets multiple user properties at once.
   * @param properties - An object containing user property key-value pairs.
   */
  async setUserProperties(properties: { [key: string]: string | null }): Promise<void> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized.');
      return;
    }
    try {
      // ... existing validation
      
      await getAnalytics(this.firebaseApp).setUserProperties(validProperties); // MODIFIED
      if (__DEV__) {
        console.log('[Analytics] User properties set:', validProperties);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Error setting User Properties:', error);
      }
    }
  }

  /**
   * Enables or disables analytics data collection.
   * @param enabled - Boolean indicating whether collection should be enabled.
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized.');
      return;
    }
    try {
      await getAnalytics(this.firebaseApp).setAnalyticsCollectionEnabled(enabled); // MODIFIED
      if (__DEV__) {
        console.log(`[Analytics] Collection ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Error setting collection status:', error);
      }
    }
  }

  /**
   * Resets all analytics data for this instance. Used primarily for testing or user logout.
   */
  async resetAnalyticsData(): Promise<void> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized.');
      return;
    }
    try {
      await getAnalytics(this.firebaseApp).resetAnalyticsData(); // MODIFIED
      if (__DEV__) {
        console.log('[Analytics] Data reset');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Error resetting data:', error);
      }
    }
  }
  
  /**
   * Gets the app instance ID. Useful for debugging.
   */
  async getAppInstanceId(): Promise<string | null> {
    if (!this.firebaseApp) {
      console.error('[Analytics] Error: AnalyticsService not initialized.');
      return null;
    }
    try {
      const id = await getAnalytics(this.firebaseApp).getAppInstanceId(); // MODIFIED
      if (__DEV__) {
        console.log('[Analytics] App Instance ID:', id);
      }
      return id;
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Error getting App Instance ID:', error);
      }
      return null;
    }
  }
}

// Export a singleton instance
export const analyticsService = AnalyticsService.getInstance();
Use code with caution.
TypeScript
2. Update notificationservice.ts
You need to import getMessaging and pass the FirebaseApp instance to your NotificationService singleton.
// notificationservice.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { toast, TOAST_MESSAGES, TOAST_CONFIG, TOAST_SUCCESS_CONFIG, TOAST_ERROR_CONFIG } from '../src/utils/toast/config';
import messaging, { getMessaging } from '@react-native-firebase/messaging'; // Add getMessaging
import { FirebaseApp } from '@react-native-firebase/app'; // Import FirebaseApp type
import { NotificationResponse as LocalNotificationResponse, PushNotificationData, NotificationPreferences } from '../src/types/notification';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  deep_link?: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private firebaseApp: FirebaseApp | null = null; // Store the app instance

  private constructor() {
    // Private constructor
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initializes the NotificationService with the Firebase App instance.
   * This MUST be called before any methods that rely on Firebase Messaging.
   * @param app The FirebaseApp instance obtained from `@react-native-firebase/app`.
   */
  async initialize(app: FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    if (__DEV__) {
      console.log('[NotificationService] Initialized with Firebase App.');
    }
    // Any other global setup for NotificationService could go here
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }
    // ... rest of the method (no changes needed here)
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async registerForPushNotifications(): Promise<{ expoToken: string | null, fcmToken: string | null }> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { expoToken: null, fcmToken: null };
      }

      // Get Expo token
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const expoToken = tokenResponse.data;

      // Get FCM token
      if (!this.firebaseApp) { // Add this check
        console.error('[NotificationService] Firebase App not initialized for FCM token retrieval.');
        toast.error(TOAST_MESSAGES.TOKEN_ERROR, TOAST_ERROR_CONFIG);
        return { expoToken: null, fcmToken: null };
      }
      const fcmToken = await getMessaging(this.firebaseApp).getToken(); // MODIFIED
      console.log('FCM Token for testing:', fcmToken);

      if (!expoToken && !fcmToken) {
        console.error('Error: No push tokens returned');
        toast.error(TOAST_MESSAGES.TOKEN_ERROR, TOAST_ERROR_CONFIG);
        return { expoToken: null, fcmToken: null };
      }

      // Setup Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Store both tokens
      await this.storeTokens(expoToken, fcmToken);

      // Setup FCM token refresh listener
      getMessaging(this.firebaseApp).onTokenRefresh(async (newFcmToken) => { // MODIFIED
        await this.storeTokens(expoToken, newFcmToken);
      });

      return { expoToken, fcmToken };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      toast.error(TOAST_MESSAGES.REGISTRATION_ERROR, TOAST_ERROR_CONFIG);
      return { expoToken: null, fcmToken: null };
    }
  }

  // ... rest of the NotificationService methods (no changes needed to storeTokens, handleNotification, handleNotificationResponse, initializeListeners, removeNotificationListeners, cleanupListeners, storeNotification)
  private async storeTokens(expoToken: string | null, fcmToken: string | null): Promise<void> { /* ... */ }
  public handleNotification = (notification: Notifications.Notification): void => { /* ... */ };
  private handleNotificationResponse = (response: Notifications.NotificationResponse): void => { /* ... */ };
  public initializeListeners(): void { /* ... */ }
  public removeNotificationListeners(): void { /* ... */ }
  public cleanupListeners(): void { /* ... */ }
  async storeNotification(notification: { /* ... */ }) { /* ... */ }
}

export default NotificationService;
Use code with caution.
TypeScript
3. Create/Update RemoteConfigService.ts
Since you didn't provide this file, I'll give you a common structure and how to adapt it to the modular API.
// services/RemoteConfigService.ts
import remoteConfig, { getRemoteConfig, FirebaseRemoteConfigTypes } from '@react-native-firebase/remote-config'; // Add getRemoteConfig
import { FirebaseApp } from '@react-native-firebase/app'; // Import FirebaseApp type

// Define your config keys and their default types
export interface AppRemoteConfig {
  minimumAppVersion: string;
  featureFlagA: boolean;
  welcomeMessage: string;
  // Add other remote config parameters here
}

const DEFAULT_CONFIG_VALUES: AppRemoteConfig = {
  minimumAppVersion: '1.0.0',
  featureFlagA: false,
  welcomeMessage: 'Welcome to Edushorts!',
};

class RemoteConfigService {
  private static instance: RemoteConfigService;
  private firebaseApp: FirebaseApp | null = null;
  private remoteConfigInstance: FirebaseRemoteConfigTypes.Module | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  /**
   * Initializes the RemoteConfigService with the Firebase App instance.
   * This MUST be called before fetching or getting config values.
   * @param app The FirebaseApp instance obtained from `@react-native-firebase/app`.
   */
  async initialize(app: FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    this.remoteConfigInstance = getRemoteConfig(app); // MODIFIED

    if (__DEV__) {
      // For development, set a shorter fetch interval and enable developer mode
      await this.remoteConfigInstance.setDefaults(DEFAULT_CONFIG_VALUES);
      await this.remoteConfigInstance.setConfigSettings({
        minimumFetchIntervalMillis: 10000, // 10 seconds for dev
        fetchTimeOutMillis: 30000, // 30 seconds timeout
      });
      console.log('[RemoteConfigService] Initialized for development with short interval.');
    } else {
      // For production, set a longer fetch interval
      await this.remoteConfigInstance.setDefaults(DEFAULT_CONFIG_VALUES);
      await this.remoteConfigInstance.setConfigSettings({
        minimumFetchIntervalMillis: 1 * 60 * 60 * 1000, // 1 hour for production
        fetchTimeOutMillis: 60000, // 60 seconds timeout
      });
      console.log('[RemoteConfigService] Initialized for production with 1-hour interval.');
    }
    
    // Perform an initial fetch and activate
    await this.fetchAndActivate();
  }

  /**
   * Fetches the latest remote config values and activates them.
   */
  async fetchAndActivate(): Promise<boolean> {
    if (!this.remoteConfigInstance) {
      console.error('[RemoteConfigService] Error: RemoteConfigService not initialized. Call initialize() first.');
      return false;
    }
    try {
      const fetchedRemotely = await this.remoteConfigInstance.fetchAndActivate(); // MODIFIED
      if (fetchedRemotely) {
        if (__DEV__) {
          console.log('[RemoteConfigService] Remote Configs fetched and activated from server.');
        }
      } else {
        if (__DEV__) {
          console.log('[RemoteConfigService] Remote Configs not fetched (using cached or default values).');
        }
      }
      return fetchedRemotely;
    } catch (error) {
      console.error('[RemoteConfigService] Error fetching and activating remote config:', error);
      return false;
    }
  }

  /**
   * Gets a boolean value from remote config.
   * @param key The key of the config parameter.
   */
  getBoolean(key: keyof AppRemoteConfig): boolean {
    if (!this.remoteConfigInstance) {
      console.error('[RemoteConfigService] Error: RemoteConfigService not initialized.');
      return DEFAULT_CONFIG_VALUES[key] as boolean; // Fallback to default
    }
    const value = this.remoteConfigInstance.getBoolean(key); // MODIFIED
    // console.log(`[RemoteConfigService] Get boolean '${key}': ${value}`); // Uncomment for debugging
    return value;
  }

  /**
   * Gets a string value from remote config.
   * @param key The key of the config parameter.
   */
  getString(key: keyof AppRemoteConfig): string {
    if (!this.remoteConfigInstance) {
      console.error('[RemoteConfigService] Error: RemoteConfigService not initialized.');
      return DEFAULT_CONFIG_VALUES[key] as string; // Fallback to default
    }
    const value = this.remoteConfigInstance.getString(key); // MODIFIED
    // console.log(`[RemoteConfigService] Get string '${key}': ${value}`); // Uncomment for debugging
    return value;
  }

  /**
   * Gets a number value from remote config.
   * @param key The key of the config parameter.
   */
  getNumber(key: keyof AppRemoteConfig): number {
    if (!this.remoteConfigInstance) {
      console.error('[RemoteConfigService] Error: RemoteConfigService not initialized.');
      return DEFAULT_CONFIG_VALUES[key] as number; // Fallback to default
    }
    const value = this.remoteConfigInstance.getNumber(key); // MODIFIED
    // console.log(`[RemoteConfigService] Get number '${key}': ${value}`); // Uncomment for debugging
    return value;
  }

  /**
   * Gets the last fetch status.
   */
  getLastFetchStatus(): FirebaseRemoteConfigTypes.LastFetchStatus | null {
    if (!this.remoteConfigInstance) {
      console.error('[RemoteConfigService] Error: RemoteConfigService not initialized.');
      return null;
    }
    return this.remoteConfigInstance.lastFetchStatus;
  }
}

export const remoteConfigService = RemoteConfigService.getInstance();
Use code with caution.
TypeScript
4. Update app.tsx
You need to pass the Firebase app instance to the initialize methods of AnalyticsService, NotificationBridge (which will pass it to NotificationService), and RemoteConfigService.
// app.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getApp } from '@react-native-firebase/app'; // Already correct
import { getMessaging } from '@react-native-firebase/messaging'; // Already correct, but ensure it's imported
import { RootStackParamList } from './types/navigation';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { useNews } from './context/NewsContext';
import { SavedArticlesProvider } from './context/SavedArticlesContext';
import { NewsProvider } from './context/NewsContext';
import { AdvertisementProvider } from './context/AdvertisementContext';
import { initializeAuth } from './utils/authHelpers';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NotificationBridge, MonitoringService, DeepLinkHandler } from './services';
import { useScreenTracking } from './hooks/useAnalytics';
import { remoteConfigService } from './services/RemoteConfigService';
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import branch from 'react-native-branch';
import { analyticsService } from './services/AnalyticsService'; // IMPORT ANALYTICSSERVICE

// ... (rest of your imports and component definitions)

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useScreenTracking();
  const [notificationListener, setNotificationListener] = useState<Notifications.Subscription | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth first (as existing)
        const authCleanup = initializeAuth();

        // Configure expo-notifications handler for foreground notifications
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Set up notification response listener for handling taps (as existing)
        const subscription = Notifications.addNotificationResponseReceivedListener(
          response => {
            console.log('Notification response received:', response.notification.request.content.data);
            const deepLink = response.notification.request.content.data?.deep_link 
              || response.notification.request.content.data?.branch_link
              || response.notification.request.content.data?.url;
              
            if (deepLink && typeof deepLink === 'string') {
              console.log('Processing deep link from notification:', deepLink);
              DeepLinkHandler.getInstance().handleDeepLink(deepLink);
            } else {
              console.log('No deep link found in notification data:', response.notification.request.content.data);
            }
          }
        );
        setNotificationListener(subscription);

        // --- NEW/MODIFIED: Initialize Firebase services with the app instance ---
        const firebaseAppInstance = getApp(); // Get the Firebase App instance once

        try {
          // Initialize Analytics Service
          await analyticsService.initialize(firebaseAppInstance); // NEW
          console.log('[AppContent] AnalyticsService initialized.');

          // Initialize NotificationBridge (and through it, NotificationService)
          // Assuming NotificationBridge has an initialize method that takes the app instance
          // or internally calls NotificationService.getInstance().initialize(firebaseAppInstance)
          const notificationBridge = NotificationBridge.getInstance();
          await notificationBridge.initialize(firebaseAppInstance); // MODIFIED (pass app instance)
          console.log('[AppContent] NotificationBridge initialized.');

          // Initialize Remote Config Service
          await remoteConfigService.initialize(firebaseAppInstance); // MODIFIED (pass app instance)
          console.log('[AppContent] RemoteConfigService initialized.');

          // Setup FCM background handler using the modular API
          const messagingInstance = getMessaging(firebaseAppInstance); // Already correct
          messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background!', remoteMessage);
            
            const branchLink = remoteMessage.data?.branch_link || remoteMessage.data?.deep_link;
            if (branchLink && typeof branchLink === 'string') {
              try {
                console.log('FCM message contains Branch link:', branchLink);
              } catch (error) {
                console.error('Error processing Branch link from FCM:', error);
              }
            }
            
            try {
              if (remoteMessage.notification) {
                console.log('Received notification-type FCM message, letting FCM handle it natively');
                return;
              }
              await NotificationBridge.getInstance().processNotification({
                type: 'push',
                payload: {
                  title: typeof remoteMessage.data?.title === 'string' ? remoteMessage.data.title : '',
                  body: typeof remoteMessage.data?.body === 'string' ? remoteMessage.data.body : 
                        typeof remoteMessage.data?.message === 'string' ? remoteMessage.data.message : '',
                  data: {
                    ...remoteMessage.data,
                    deep_link: typeof remoteMessage.data?.deep_link === 'string' 
                      ? remoteMessage.data.deep_link 
                      : typeof remoteMessage.data?.branch_link === 'string'
                        ? remoteMessage.data.branch_link
                        : typeof remoteMessage.data?.url === 'string'
                          ? remoteMessage.data.url
                          : undefined
                  }
                }
              });
            } catch (processError) {
              console.error('Error processing FCM notification:', processError);
            }
          });
        } catch (firebaseInitError) {
          console.error('Error initializing Firebase services (Analytics, Messaging, Remote Config):', firebaseInitError);
        }

        try {
          const monitoringService = MonitoringService.getInstance();
          await monitoringService.initialize();
        } catch (monitoringError) {
          console.error('Error initializing monitoring service:', monitoringError);
        }

        // DeepLinkHandler will be initialized in NavigationContainer.onReady
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize core services:', error);
        setIsReady(true);
      }
    };

    initializeApp();

    return () => {
      // Call cleanup functions for services if they were returned/stored
      const notificationBridge = NotificationBridge.getInstance();
      const monitoringService = MonitoringService.getInstance();
      const deepLinkHandler = DeepLinkHandler.getInstance();
      
      // Clean up notification listener
      if (notificationListener) {
        notificationListener.remove();
      }
      
      notificationBridge.cleanup();
      monitoringService.cleanup();
      deepLinkHandler.cleanupBranchListeners();
    };
  }, []); // Run once on mount

  // ... rest of AppContent and App components (no changes needed)
}


Step 2: Modify notificationbridge.ts to accept FirebaseApp and initialize NotificationService
// services/NotificationBridge.ts
import { NOTIFICATION_CONFIG, NOTIFICATION_TYPES, DELIVERY_STATUS } from '../constants/config';
import type { NotificationType, DeliveryStatus } from '../constants/config';
import { supabase } from '../utils/supabase';
import MonitoringService from './MonitoringService';
import DeepLinkHandler from './DeepLinkHandler';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import NotificationService from './NotificationService'; // <<< NEW: Import NotificationService
import { FirebaseApp } from '@react-native-firebase/app'; // <<< NEW: Import FirebaseApp type

let branch: any;
try {
  branch = require('react-native-branch').default;
} catch (error) {
  console.error('Error importing Branch SDK in NotificationBridge:', error);
  branch = {
    openURL: (url: string) => {
      console.warn('Branch SDK not available, cannot open URL:', url);
      return Promise.resolve(false);
    }
  };
}

interface NotificationPayload { /* ... */ }
interface DeliveryStatusUpdate { /* ... */ }

class NotificationBridge {
  private static instance: NotificationBridge;
  private monitoring: MonitoringService;
  private retryQueue: Map<string, { payload: NotificationPayload; attempts: number }>;
  private notificationService: NotificationService; // <<< NEW: Reference to NotificationService

  private constructor() {
    this.monitoring = MonitoringService.getInstance();
    this.retryQueue = new Map();
    this.notificationService = NotificationService.getInstance(); // <<< NEW: Get instance
  }

  static getInstance(): NotificationBridge {
    if (!NotificationBridge.instance) {
      NotificationBridge.instance = new NotificationBridge();
    }
    return NotificationBridge.instance;
  }

  // <<< MODIFIED: Accept FirebaseApp instance
  async initialize(app: FirebaseApp): Promise<void> {
    // Initialize NotificationService with the Firebase App instance
    await this.notificationService.initialize(app); // <<< NEW: Pass app instance
    await this.notificationService.initializeListeners(); // Initialize Expo listeners

    await this.setupRealtimeSubscription();
    this.startRetryProcessor();

    // The permission request below is generally handled by NotificationService.registerForPushNotifications().
    // If you call NotificationService.registerForPushNotifications() elsewhere (e.g., AuthContext, on login),
    // you might not need this redundant permission check here in NotificationBridge.
    // For now, I'll comment it out to avoid duplication and potential issues.
    /*
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions for NotificationBridge!');
    }
    */
  }

  private setupRealtimeSubscription(): void { /* ... */ }
  private handleNewNotification(payload: { new: any }): Promise<void> { /* ... */ }
  private transformNotification(rawNotification: any): NotificationPayload { /* ... */ }
  async processNotification(notification: NotificationPayload): Promise<void> { /* ... */ }
  private async handlePushNotification(notification: NotificationPayload): Promise<void> { /* ... */ }
  private handleDeepLink(deepLink: string): void { /* ... */ }
  private async handleScheduledNotification(notification: NotificationPayload): Promise<void> { /* ... */ }
  private async handleArticleLinkNotification(notification: NotificationPayload): Promise<void> { /* ... */ }
  private async handleWebNotification(notification: NotificationPayload): Promise<void> { /* ... */ }
  private async handleDeliveryFailure(notification: NotificationPayload): Promise<void> { /* ... */ }
  private startRetryProcessor(): void { /* ... */ }

  async getExpoToken(): Promise<string> {
    // This correctly gets Expo token from Supabase, not directly from Expo's API
    // The actual Expo token generation is handled by NotificationService.registerForPushNotifications
    return await this.notificationService.getExpoToken(); // <<< MODIFIED: Delegate to NotificationService
  }

  async updateDeliveryStatus(update: DeliveryStatusUpdate): Promise<void> { /* ... */ }

  cleanup(): void {
    clearInterval(this.startRetryProcessor as unknown as number);
    this.notificationService.cleanupListeners(); // <<< NEW: Ensure NotificationService listeners are cleaned up
  }

  async handleReceivedFcmMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    // No changes needed here, as it processes an already received FCM message, not initializes Firebase Messaging.
    console.log('NotificationBridge: handleReceivedFcmMessage', JSON.stringify(remoteMessage, null, 2));
    try {
      // ... (existing logic)
    } catch (error) {
      console.error('NotificationBridge: Error in handleReceivedFcmMessage:', error);
      // ... (existing error handling)
    }
  }
}

export default NotificationBridge;
Use code with caution.
TypeScript
Step 3: Update app.tsx to pass the FirebaseApp instance to NotificationBridge.initialize
// app.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';
import { RootStackParamList } from './types/navigation';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { useNews } from './context/NewsContext';
import { SavedArticlesProvider } from './context/SavedArticlesContext';
import { NewsProvider } from './context/NewsContext';
import { AdvertisementProvider } from './context/AdvertisementContext';
import { initializeAuth } from './utils/authHelpers';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import NotificationBridge from './services/NotificationBridge'; // Ensure this is imported
import MonitoringService from './services/MonitoringService'; // Ensure this is imported
import DeepLinkHandler from './services/DeepLinkHandler'; // Ensure this is imported
import { useScreenTracking } from './hooks/useAnalytics';
import { remoteConfigService } from './services/RemoteConfigService'; // Ensure this is imported
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import branch from 'react-native-branch';
import { analyticsService } from './services/AnalyticsService'; // Ensure this is imported

// ... (rest of your imports and component definitions like MainTabs, RootStackNavigator)

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useScreenTracking();
  const [notificationListener, setNotificationListener] = useState<Notifications.Subscription | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth first
        const authCleanup = initializeAuth();

        // Configure expo-notifications handler for foreground notifications
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Set up notification response listener for handling taps
        const subscription = Notifications.addNotificationResponseReceivedListener(
          response => {
            console.log('Notification response received:', response.notification.request.content.data);
            const deepLink = response.notification.request.content.data?.deep_link 
              || response.notification.request.content.data?.branch_link
              || response.notification.request.content.data?.url;
              
            if (deepLink && typeof deepLink === 'string') {
              console.log('Processing deep link from notification:', deepLink);
              DeepLinkHandler.getInstance().handleDeepLink(deepLink);
            } else {
              console.log('No deep link found in notification data:', response.notification.request.content.data);
            }
          }
        );
        setNotificationListener(subscription);

        // --- NEW/MODIFIED: Initialize Firebase services with the app instance ---
        const firebaseAppInstance = getApp(); // Get the Firebase App instance once

        try {
          // Initialize Analytics Service
          await analyticsService.initialize(firebaseAppInstance);
          console.log('[AppContent] AnalyticsService initialized.');

          // Initialize NotificationBridge, passing the Firebase App instance
          const notificationBridge = NotificationBridge.getInstance();
          await notificationBridge.initialize(firebaseAppInstance); // <<< MODIFIED: Pass app instance
          console.log('[AppContent] NotificationBridge initialized.');

          // Initialize Remote Config Service
          await remoteConfigService.initialize(firebaseAppInstance);
          console.log('[AppContent] RemoteConfigService initialized.');

          // Setup FCM background handler (already correct in app.tsx)
          const messagingInstance = getMessaging(firebaseAppInstance);
          messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
            console.log('Message handled in the background!', remoteMessage);
            
            const branchLink = remoteMessage.data?.branch_link || remoteMessage.data?.deep_link;
            if (branchLink && typeof branchLink === 'string') {
              try {
                console.log('FCM message contains Branch link:', branchLink);
              } catch (error) {
                console.error('Error processing Branch link from FCM:', error);
              }
            }
            
            try {
              if (remoteMessage.notification) {
                console.log('Received notification-type FCM message, letting FCM handle it natively');
                return;
              }
              await NotificationBridge.getInstance().handleReceivedFcmMessage(remoteMessage); // <<< MODIFIED: Call new method
            } catch (processError) {
              console.error('Error processing FCM notification:', processError);
            }
          });
        } catch (firebaseInitError) {
          console.error('Error initializing Firebase services (Analytics, Messaging, Remote Config):', firebaseInitError);
        }

        try {
          const monitoringService = MonitoringService.getInstance();
          await monitoringService.initialize();
        } catch (monitoringError) {
          console.error('Error initializing monitoring service:', monitoringError);
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize core services:', error);
        setIsReady(true);
      }
    };

    initializeApp();

    return () => {
      const notificationBridge = NotificationBridge.getInstance();
      const monitoringService = MonitoringService.getInstance();
      const deepLinkHandler = DeepLinkHandler.getInstance();
      
      if (notificationListener) {
        notificationListener.remove();
      }
      
      notificationBridge.cleanup();
      monitoringService.cleanup();
      deepLinkHandler.cleanupBranchListeners();
    };
  }, []);

  // ... rest of AppContent and App components
}
Use code with caution.
