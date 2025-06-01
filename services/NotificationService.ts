import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { toast, TOAST_MESSAGES, TOAST_CONFIG, TOAST_SUCCESS_CONFIG, TOAST_ERROR_CONFIG } from '../src/utils/toast/config';
import messaging, { FirebaseMessagingTypes, getMessaging } from '@react-native-firebase/messaging';
import type { ReactNativeFirebase } from '@react-native-firebase/app';
import { NotificationResponse as LocalNotificationResponse, PushNotificationData, NotificationPreferences } from '../src/types/notification';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep this interface if used elsewhere, otherwise it can be removed if PushNotificationData covers everything
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
  private firebaseApp: ReactNativeFirebase.FirebaseApp | null = null;
  private messagingInstance: FirebaseMessagingTypes.Module | null = null;
  private currentExpoToken: string | null = null;
  private currentFcmToken: string | null = null;

  private constructor() {
    // Private constructor for singleton pattern
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
  async initialize(app: ReactNativeFirebase.FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    this.messagingInstance = getMessaging(app);
    if (__DEV__) {
      console.log('[NotificationService] Initialized with Firebase App');
    }
  }

  private getMessagingInstance(): FirebaseMessagingTypes.Module {
    if (!this.messagingInstance) {
      console.error('[NotificationService] Error: MessagingService not initialized. Call initialize() first.');
      throw new Error('MessagingService not initialized.');
    }
    return this.messagingInstance;
  }

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

      let profileError: any = null;
      let notificationError: any = null;

      // Update notification preferences in profiles
      // Assuming existing preferences might exist, fetch them first or ensure upsert merges correctly.
      // For simplicity here, we'll overwrite, but a merge might be better in a real scenario
      // if other preferences are set independently.
      const profileUpdate = {
        id: userId, // Assuming 'id' is the column name for user_id in profiles table and is the conflict target
        notification_preferences: { // This structure should match your DB
          push: true, // Defaulting to true since we have tokens
          // email: false, // Preserve existing email preference if not explicitly changing it
          expo_token: expoToken,
          fcm_token: fcmToken 
        },
        updated_at: new Date().toISOString()
      };

      console.log('[NotificationService] Upserting to profiles for user:', userId, profileUpdate);
      const { error: supabaseProfileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate, { onConflict: 'id' }); // Ensure 'id' is the correct conflict column for profiles
      
      profileError = supabaseProfileError;

      // Create a notification record for token storage
      // Storing FCM token in expo_push_token column as per user's clarification.
      // If both tokens exist, Expo is generally preferred for sending via Expo's services, 
      // but storing both is good. The column name `expo_push_token` might be slightly misleading
      // if it exclusively stores FCM at times, but adhering to current schema.
      const tokenForNotificationsTable = expoToken || fcmToken; // Prioritize Expo token if available for the specific column

      if (tokenForNotificationsTable) { // Only insert if there's a token to store
        const notificationUpdate = {
          user_id: userId,
          expo_push_token: tokenForNotificationsTable, // Storing the primary token here
          // fcm_token: fcmToken, // If there's a separate fcm_token column in 'notifications' table, use it
          type: 'device_registration', // Clear type for this record
          title: 'Device Registered', // System notification title
          body: `Device token ${expoToken ? 'Expo' : ''} ${fcmToken && expoToken ? '&' : ''} ${fcmToken ? 'FCM' : ''} updated.`, // Descriptive body
          target_audience: 'user', // Or system, depending on conventions
          created_at: new Date().toISOString(),
          // sent_at: new Date().toISOString(), // 'sent_at' might not be applicable for a registration event
        };

        console.log('[NotificationService] Inserting into notifications for user:', userId, notificationUpdate);
        const { error: supabaseNotificationError } = await supabase
          .from('notifications') // Correct table
          .insert(notificationUpdate); // Insert as it's a new registration event/log
        
        notificationError = supabaseNotificationError;
      }


      if (profileError || notificationError) {
        console.error('[NotificationService] Error storing tokens. Details:', {
          profileError: profileError ? JSON.stringify(profileError, null, 2) : null,
          notificationError: notificationError ? JSON.stringify(notificationError, null, 2) : null,
          userId,
          expoTokenProvided: !!expoToken,
          fcmTokenProvided: !!fcmToken,
          timestamp: new Date().toISOString()
        });
        // Decide on toast behavior. Maybe one generic error or specific ones.
        if (profileError) toast.error(`Profile update error: ${profileError.message || 'Unknown error'}`, TOAST_ERROR_CONFIG);
        if (notificationError) toast.error(`Notification record error: ${notificationError.message || 'Unknown error'}`, TOAST_ERROR_CONFIG);
      } else {
        console.log('[NotificationService] Push notification tokens processed successfully for user:', userId);
        // toast.success(TOAST_MESSAGES.TOKEN_SUCCESS, TOAST_SUCCESS_CONFIG); // Optional success toast
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
      if (data?.deep_link) { // Use optional chaining
        console.log('Processing deep link:', data.deep_link);
        // Pass the whole response object to the response handler
        // Note: Expo's Notification type doesn't directly match NotificationResponse structure
        // We need to construct it or adjust the handler
        const response: Notifications.NotificationResponse = {
          actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER, // Default action
          notification: notification,
        };
        this.handleNotificationResponse(response);
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
        // e.g., DeepLinkHandler.getInstance().handleDeepLink(data.deep_link);
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
