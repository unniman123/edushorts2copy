import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { toast, TOAST_MESSAGES, TOAST_CONFIG, TOAST_SUCCESS_CONFIG, TOAST_ERROR_CONFIG } from '../src/utils/toast/config';
import messaging from '@react-native-firebase/messaging';
import { NotificationResponse as LocalNotificationResponse, PushNotificationData, NotificationPreferences } from '../src/types/notification'; // Renamed import to avoid conflict

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
  private notificationListener: Notifications.Subscription | null = null; // Use correct type
  private responseListener: Notifications.Subscription | null = null; // Use correct type

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

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
      const fcmToken = await messaging().getToken();

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
      messaging().onTokenRefresh(async (newFcmToken) => {
        await this.storeTokens(expoToken, newFcmToken);
      });

      return { expoToken, fcmToken };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      toast.error(TOAST_MESSAGES.REGISTRATION_ERROR, TOAST_ERROR_CONFIG);
      return { expoToken: null, fcmToken: null };
    }
  }

  private async storeTokens(expoToken: string | null, fcmToken: string | null): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Create the notification preferences object
      const notificationPrefs: NotificationPreferences = {
        push: true,
        email: false,
        expo_push_token: expoToken || undefined,
        fcm_token: fcmToken || undefined,
        push_enabled: true,
        subscriptions: ['all']
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          notification_preferences: notificationPrefs
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error storing notification token in profile:', profileError);
        toast.error(TOAST_MESSAGES.PROFILE_UPDATE_ERROR, TOAST_ERROR_CONFIG);
        // Decide if this should throw or just log
        throw profileError;
      }

      // Also store a record in the notifications table (optional, based on requirements)
      const notificationRecord = {
        type: 'push' as const, // Use const assertion for literal type
        title: 'Device Registration',
        body: 'Push notifications enabled',
        target_audience: 'all' as const, // Use const assertion for literal type
        created_by: user.id,
        expo_push_token: expoToken || undefined,
        fcm_token: fcmToken || undefined,
        sent_at: new Date().toISOString()
      };

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notificationRecord); // Pass the correctly typed object

      if (notifError) {
        // Log this error but maybe don't fail the whole process? Depends on requirements.
        console.error('Error storing notification:', notifError);
        toast.warning('Device registered, but failed to create notification record.', TOAST_ERROR_CONFIG);
      } else {
        console.log('Successfully stored tokens:', { expoToken, fcmToken });
        toast.success(TOAST_MESSAGES.PUSH_ENABLED, TOAST_SUCCESS_CONFIG);
      }

    } catch (error) {
      console.error('Error storing push token:', error);
      toast.error(TOAST_MESSAGES.TOKEN_STORE_ERROR, TOAST_ERROR_CONFIG);
      // Re-throw or handle as appropriate
      throw error;
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
}

export default NotificationService;
