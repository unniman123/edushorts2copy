import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { toast, TOAST_MESSAGES, TOAST_CONFIG, TOAST_SUCCESS_CONFIG, TOAST_ERROR_CONFIG } from '../src/utils/toast/config';
import messaging, { FirebaseMessagingTypes, getMessaging } from '@react-native-firebase/messaging';
import type { ReactNativeFirebase } from '@react-native-firebase/app';
import { NotificationResponse as LocalNotificationResponse, PushNotificationData, NotificationPreferences } from '../src/types/notification';
import DeepLinkHandler from './DeepLinkHandler';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification data interface for local notifications
 * 
 * @interface NotificationData
 * @deprecated Use PushNotificationData from types/notification instead
 */
export interface NotificationData {
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Optional deep link URL */
  deep_link?: string;
  /** Additional notification data */
  data?: Record<string, unknown>;
}

/**
 * NotificationService - Comprehensive push notification management service
 * 
 * Handles both Expo push notifications and Firebase Cloud Messaging (FCM) for the
 * React Native Expo application. Manages notification permissions, token registration,
 * local notifications, and notification preferences. Implements singleton pattern
 * for consistent notification management across the application.
 * 
 * Key Features:
 * - Dual notification system (Expo + FCM) for maximum compatibility
 * - Automatic token refresh and synchronization
 * - User notification preferences management
 * - Local notification scheduling and handling
 * - Deep linking support for notification actions
 * - Platform-specific permission handling (iOS/Android)
 * - Notification channel configuration for Android
 * - Comprehensive error handling and user feedback
 * 
 * @class NotificationService
 * @example
 * ```typescript
 * const notificationService = NotificationService.getInstance();
 * await notificationService.initialize(firebaseApp);
 * 
 * // Register for push notifications
 * const tokens = await notificationService.registerForPushNotifications();
 * 
 * // Schedule local notification
 * await notificationService.scheduleLocalNotification({
 *   title: 'New Article',
 *   body: 'Check out the latest education news!',
 *   deep_link: 'edushorts://articles/123'
 * });
 * ```
 */
class NotificationService {
  private static instance: NotificationService;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private firebaseApp: ReactNativeFirebase.FirebaseApp | null = null;
  private messagingInstance: FirebaseMessagingTypes.Module | null = null;
  private currentExpoToken: string | null = null;
  private currentFcmToken: string | null = null;

  /**
   * Private constructor implementing singleton pattern
   * Initializes the service without Firebase dependencies, which are
   * configured later through the initialize method.
   * 
   * @private
   * @memberof NotificationService
   */
  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Gets the singleton instance of NotificationService
   * 
   * @returns {NotificationService} The singleton instance
   * @static
   * @memberof NotificationService
   * @example
   * ```typescript
   * const notificationService = NotificationService.getInstance();
   * ```
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initializes the NotificationService with Firebase App instance
   * 
   * This method MUST be called before any methods that rely on Firebase Messaging.
   * Sets up the Firebase Messaging instance for FCM token management and
   * message handling.
   * 
   * @param {ReactNativeFirebase.FirebaseApp} app - The Firebase App instance
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {Error} When Firebase App initialization fails
   * @memberof NotificationService
   * @example
   * ```typescript
   * const firebaseApp = getApp();
   * await notificationService.initialize(firebaseApp);
   * ```
   */
  async initialize(app: ReactNativeFirebase.FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    this.messagingInstance = getMessaging(app);
    if (__DEV__) {
      console.log('[NotificationService] Initialized with Firebase App');
    }
    // Ensure expo-notification listeners are registered as part of service initialization
    try {
      this.initializeListeners();
    } catch (listenerInitError) {
      console.error('[NotificationService] Failed to initialize listeners during initialize():', listenerInitError);
    }
  }

  /**
   * Helper method to ensure messaging instance is available
   * 
   * Validates that the messaging instance has been properly initialized
   * before attempting to use Firebase Messaging methods.
   * 
   * @private
   * @returns {FirebaseMessagingTypes.Module} The initialized messaging instance
   * @throws {Error} When NotificationService has not been initialized
   * @memberof NotificationService
   */
  private getMessagingInstance(): FirebaseMessagingTypes.Module {
    if (!this.messagingInstance) {
      console.error('[NotificationService] Error: MessagingService not initialized. Call initialize() first.');
      throw new Error('MessagingService not initialized.');
    }
    return this.messagingInstance;
  }

  /**
   * Requests notification permissions from the user
   * 
   * Handles platform-specific permission requests for both iOS and Android.
   * On Android, uses Expo notifications permissions. On iOS, uses Firebase
   * Messaging authorization. Validates device compatibility and shows
   * appropriate error messages.
   * 
   * @returns {Promise<boolean>} Promise that resolves to true if permissions granted
   * @memberof NotificationService
   * @example
   * ```typescript
   * const hasPermission = await notificationService.requestPermissions();
   * if (hasPermission) {
   *   // Proceed with notification setup
   * }
   * ```
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        toast.error('Failed to get push token for push notification!');
        console.log('Failed to get push token for push notification!');
        return false;
      }
    } else if (Platform.OS === 'ios') {
        const authStatus = await this.getMessagingInstance().requestPermission();
        const enabled = 
            authStatus === FirebaseMessagingTypes.AuthorizationStatus.AUTHORIZED ||
            authStatus === FirebaseMessagingTypes.AuthorizationStatus.PROVISIONAL;
        if(!enabled){
            toast.error('Failed to get push token for push notification!');
            console.log('Failed to get push token for push notification! iOS permission not granted.');
            return false;
        }
    }
    if (!Device.isDevice) {
      toast.error('Must use physical device for Push Notifications');
      console.log('Must use physical device for Push Notifications');
      return false;
    }
    return true;
  }

  /**
   * Registers for push notifications and obtains tokens
   * 
   * Comprehensive registration process that:
   * 1. Requests necessary permissions
   * 2. Obtains both Expo and FCM tokens for maximum compatibility
   * 3. Configures Android notification channels
   * 4. Stores tokens in user profile
   * 5. Sets up automatic token refresh handling
   * 
   * @returns {Promise<{expoToken: string | null, fcmToken: string | null}>} Promise resolving to token object
   * @memberof NotificationService
   * @example
   * ```typescript
   * const { expoToken, fcmToken } = await notificationService.registerForPushNotifications();
   * console.log('Expo Token:', expoToken);
   * console.log('FCM Token:', fcmToken);
   * ```
   */
  async registerForPushNotifications(): Promise<{ expoToken: string | null, fcmToken: string | null }> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { expoToken: null, fcmToken: null };
      }

      let expoToken: string | null = null;
      try {
        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        expoToken = tokenResponse.data;
        this.currentExpoToken = expoToken;
      } catch (e: any) {
        console.error('Error getting Expo push token:', e.message);
        toast.error('Could not get Expo token: ' + e.message, TOAST_ERROR_CONFIG);
      }

      let fcmToken: string | null = null;
      try {
        console.log('[NotificationService] Attempting to get FCM token...');
        fcmToken = await this.getMessagingInstance().getToken();
        this.currentFcmToken = fcmToken;
        console.log('[NotificationService] FCM Token obtained:', fcmToken ? fcmToken.substring(0, 20) + '...': 'NULL_FCM_TOKEN');
      } catch (e: any) {
        console.error('[NotificationService] Error getting FCM token:', e.message);
        toast.error('Could not get FCM token: ' + e.message, TOAST_ERROR_CONFIG);
      }

      if (!expoToken && !fcmToken) {
        console.error('[NotificationService] Error: No push tokens returned (Expo and FCM both failed).');
        // toast.error(TOAST_MESSAGES.TOKEN_ERROR, TOAST_ERROR_CONFIG); // Already shown by individual errors
        return { expoToken: null, fcmToken: null };
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      // Only attempt to store if at least one token was successfully retrieved.
      if (expoToken || fcmToken) {
          await this.storeTokens(expoToken, fcmToken);
      } else {
          console.warn('[NotificationService] No tokens to store.');
      }

      this.getMessagingInstance().onTokenRefresh(async (newFcmToken) => {
        console.log('[NotificationService] FCM Token refreshed:', newFcmToken ? newFcmToken.substring(0,20) + '...' : 'NULL_REFRESH_TOKEN');
        this.currentFcmToken = newFcmToken;
        // Use the currentExpoToken which should have been fetched once initially.
        await this.storeTokens(this.currentExpoToken, newFcmToken);
      });

      return { expoToken, fcmToken };
    } catch (error: any) {
      console.error('[NotificationService] Error in registerForPushNotifications:', error.message);
      toast.error(TOAST_MESSAGES.REGISTRATION_ERROR, TOAST_ERROR_CONFIG);
      return { expoToken: null, fcmToken: null };
    }
  }

  /**
   * Stores notification tokens in user profile
   * 
   * Updates the user's profile with current Expo and FCM tokens for push notification
   * delivery. Handles authentication validation and provides comprehensive error handling.
   * Tokens are stored in the notification_preferences field of the user's profile.
   * 
   * @private
   * @param {string | null} expoToken - The Expo push token
   * @param {string | null} fcmToken - The Firebase Cloud Messaging token
   * @returns {Promise<void>} Promise that resolves when tokens are stored
   * @memberof NotificationService
   */
  private async storeTokens(expoToken: string | null, fcmToken: string | null): Promise<void> {
    console.log(`[NotificationService] Attempting to store tokens: Expo: ${expoToken ? 'SET' : 'NULL'}, FCM: ${fcmToken ? 'SET' : 'NULL'}`);
    if (!expoToken && !fcmToken) {
      console.warn('[NotificationService] Both Expo and FCM tokens are null. Skipping storage.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        console.warn('[NotificationService] No active user session. Cannot store tokens.');
        return; 
      }

      // Update notification preferences in profiles
      const profileUpdate = {
        id: userId,
        notification_preferences: {
          push: true,
          expo_token: expoToken,
          fcm_token: fcmToken 
        },
        updated_at: new Date().toISOString()
      };

      console.log('[NotificationService] Upserting to profiles for user:', userId, profileUpdate);
      const { error: supabaseProfileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate, { onConflict: 'id' });

      if (supabaseProfileError) {
        console.error('[NotificationService] Error storing tokens in profiles:', supabaseProfileError);
        toast.error(`Profile update error: ${supabaseProfileError.message || 'Unknown error'}`, TOAST_ERROR_CONFIG);
      } else {
        console.log('[NotificationService] Push notification tokens processed successfully for user:', userId);
      }
    } catch (e: any) {
      console.error('[NotificationService] General exception in storeTokens. Message:', e?.message);
      console.error('[NotificationService] General exception in storeTokens. Stack:', e?.stack);
      console.error('[NotificationService] General exception in storeTokens. Full error object:', e);
      toast.error(TOAST_MESSAGES.TOKEN_STORE_ERROR + (e?.message ? `: ${e.message}` : ': Unknown critical error'), TOAST_ERROR_CONFIG);
    }
  }

  // Public method to be used as listener callback
  public handleNotification = (notification: Notifications.Notification): void => {
    try {
      console.log('Received notification:', notification);
      const data = notification.request.content.data as NotificationData | undefined; // Allow undefined

      // Handle the notification based on the app state
      // Do NOT auto-navigate when a notification is merely received (foreground). Navigation
      // should occur only when the user taps the notification (handled by response listener).
      if (data?.deep_link) {
        console.log('Received notification with deep_link (no auto-navigation):', data.deep_link);
      }
    } catch (error) {
      console.error('Error handling received notification:', error);
    }
  };

  // Private method to handle responses (e.g., user tapping notification)
  private handleNotificationResponse = (response: Notifications.NotificationResponse): void => { // Use correct type from expo-notifications
    try {
      console.log('Handling notification response:', response);
      const data = response.notification.request.content.data as NotificationData | undefined; // Allow undefined

      if (data?.deep_link) { // Use optional chaining
        console.log('Handling deep link from notification response:', data.deep_link);
        // Actual deep link navigation should be triggered here or passed to a navigation service
        // Prefer Branch for Branch links, otherwise use DeepLinkHandler
        try {
          if (typeof data.deep_link === 'string' && (data.deep_link.includes('xbwk1.app.link') || data.deep_link.includes('xbwk1-alternate.app.link'))) {
            // Branch link detected - use Branch SDK to open
            const branch = require('react-native-branch').default;
            if (branch && typeof branch.openURL === 'function') {
              branch.openURL(data.deep_link as string);
            } else {
              // Fallback to DeepLinkHandler if Branch openURL isn't available
              DeepLinkHandler.getInstance().handleDeepLink(data.deep_link as string);
            }
          } else {
            // Non-Branch deep link - handle via DeepLinkHandler
            DeepLinkHandler.getInstance().handleDeepLink(data.deep_link as string);
          }
        } catch (navError) {
          console.error('Error navigating deep link from response:', navError);
        }
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  };

  // Renamed from setupNotificationListeners to avoid conflict if called elsewhere,
  // though it seems primarily used internally or during init.
  // Consider if this needs to be public or just called once during init.
  public initializeListeners(): void {
    try {
      // Remove any existing listeners first
      this.removeNotificationListeners();

      // Android channel setup (already done in registerForPushNotifications, maybe remove duplicate?)
      // Or ensure it's idempotent / only called once. Let's keep it here for now.
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default', // Consistent name
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        }).catch(error => {
          console.error('Error setting up Android notification channel:', error);
          // toast.error('Failed to configure notifications'); // Maybe too noisy?
        });
      }

      // Listener for notifications received while the app is foregrounded
      this.notificationListener = Notifications.addNotificationReceivedListener(
        this.handleNotification // Use the class method directly
      );

      // Listener for responses to notifications (user tapping)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse // Use the class method directly
      );

      console.log('Notification listeners initialized successfully.');

    } catch (error) {
      console.error('Error initializing notification listeners:', error);
      toast.error(TOAST_MESSAGES.LISTENER_ERROR, TOAST_ERROR_CONFIG);
    }
  }

  // Made public for potential external cleanup calls
  public removeNotificationListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  // Renamed from cleanup to avoid ambiguity
  public cleanupListeners(): void {
    this.removeNotificationListeners();
  }

  async storeNotification(notification: {
    title: string;
    body: string;
    type: string;
    target_audience: string;
    link_to_article?: string;
  }) {
    const timestamp = new Date().toISOString(); // Consistent timestamp format
    const deep_link = notification.link_to_article
      ? `edushorts://articles/${notification.link_to_article}`
      : undefined;

    return await supabase
      .from('notifications')
      .insert({
        title: notification.title,
        body: notification.body,
        type: 'push',
        target_audience: notification.target_audience,
        link_to_article: notification.link_to_article,
        deep_link,
        created_at: timestamp,
        sent_at: timestamp
      });
  }

  async getExpoToken(): Promise<string | null> {
      if(this.currentExpoToken) return this.currentExpoToken;
      // Fallback to fetching if not already set - though registerForPushNotifications should set it.
      try {
        const tokenResponse = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        this.currentExpoToken = tokenResponse.data;
        return this.currentExpoToken;
      } catch (e) {
        console.error("Failed to get Expo token directly in getExpoToken", e);
        return null;
      }
  }

  async storeNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({ user_id: userId, ...preferences }, { onConflict: 'user_id' });
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error storing notification preferences:', error.message);
      return false;
    }
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error;
      }
      return data as NotificationPreferences | null;
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error.message);
      return null;
    }
  }
 
  // Example method for sending a local notification (not directly related to Firebase modular API)
  async scheduleLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data,
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5 
        },
      });
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }
}

export default NotificationService;
