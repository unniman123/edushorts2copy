import { NOTIFICATION_CONFIG, NOTIFICATION_TYPES, DELIVERY_STATUS } from '../constants/config';
import type { NotificationType, DeliveryStatus } from '../constants/config';
import { supabase } from '../utils/supabase';
import MonitoringService from './MonitoringService';
import DeepLinkHandler from './DeepLinkHandler';
// import type { RemoteMessage as FirebaseRemoteMessage } from '@react-native-firebase/messaging'; // Original
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'; // New import strategy
import * as Notifications from 'expo-notifications';

// Import Branch with a fallback in case of errors
let branch: any;
try {
  branch = require('react-native-branch').default;
} catch (error) {
  console.error('Error importing Branch SDK in NotificationBridge:', error);
  // Create a minimal fallback
  branch = {
    openURL: (url: string) => {
      console.warn('Branch SDK not available, cannot open URL:', url);
      return Promise.resolve(false);
    }
  };
}

interface NotificationPayload {
  type: NotificationType;
  payload: {
    title: string;
    body: string;
    deep_link?: string;
    data?: Record<string, unknown>;
  };
}

interface DeliveryStatusUpdate {
  notificationId: string;
  status: DeliveryStatus;
  timestamp: Date;
}

class NotificationBridge {
  private static instance: NotificationBridge;
  private monitoring: MonitoringService;
  private retryQueue: Map<string, { payload: NotificationPayload; attempts: number }>;

  private constructor() {
    this.monitoring = MonitoringService.getInstance();
    this.retryQueue = new Map();
  }

  static getInstance(): NotificationBridge {
    if (!NotificationBridge.instance) {
      NotificationBridge.instance = new NotificationBridge();
    }
    return NotificationBridge.instance;
  }

  async initialize(): Promise<void> {
    await this.setupRealtimeSubscription();
    this.startRetryProcessor();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions for NotificationBridge!');
    }
  }

  private setupRealtimeSubscription(): void {
    const channel = supabase.channel('notifications');
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        this.handleNewNotification.bind(this)
      )
      .subscribe();
  }

  private async handleNewNotification(payload: { new: any }): Promise<void> {
    const notification = this.transformNotification(payload.new);
    await this.processNotification(notification);
  }

  private transformNotification(rawNotification: any): NotificationPayload {
    return {
      type: rawNotification.type as NotificationType,
      payload: {
        title: rawNotification.title,
        body: rawNotification.body,
        deep_link: rawNotification.deep_link,
        data: rawNotification.data
      }
    };
  }

  async processNotification(notification: NotificationPayload): Promise<void> {
    try {
      const currentMetrics = this.monitoring['metrics'].deliveryStats;
      await this.monitoring.updateMetrics({
        deliveryStats: {
          totalSent: currentMetrics.totalSent + 1,
          delivered: currentMetrics.delivered,
          failed: currentMetrics.failed,
          retried: currentMetrics.retried
        }
      });

      switch (notification.type) {
        case NOTIFICATION_TYPES.PUSH:
          await this.handlePushNotification(notification);
          break;
        case NOTIFICATION_TYPES.SCHEDULED:
          await this.handleScheduledNotification(notification);
          break;
        case NOTIFICATION_TYPES.ARTICLE_LINK:
          await this.handleArticleLinkNotification(notification);
          break;
        case NOTIFICATION_TYPES.WEB:
          await this.handleWebNotification(notification);
          break;
        default:
          console.warn(`Unhandled notification type: ${notification.type}`);
      }
    } catch (error: unknown) {
      console.error('Error processing notification:', error instanceof Error ? error.message : error);
      await this.handleDeliveryFailure(notification);
    }
  }

  private async handlePushNotification(notification: NotificationPayload): Promise<void> {
    try {
      // Process deep link if present
      if (notification.payload.deep_link) {
        this.handleDeepLink(notification.payload.deep_link);
      }
      
      const expoToken = await this.getExpoToken();
      if (!expoToken) {
        throw new Error('No Expo push token available');
      }
      
      const response = await fetch(NOTIFICATION_CONFIG.expo.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTIFICATION_CONFIG.expo.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: expoToken,
          title: notification.payload.title,
          body: notification.payload.body,
          data: {
            ...notification.payload.data,
            // Include the deep link in the data payload for FCM
            ...(notification.payload.deep_link ? { deep_link: notification.payload.deep_link } : {})
          }
        })
      });

      // Comprehensive status code validation
      if (!response.ok) {
        let errorMessage = `Push notification failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorBody = await response.text();
          if (errorBody) {
            errorMessage += ` - ${errorBody}`;
          }
        } catch (parseError) {
          // If we can't parse the error body, use the status text
        }
        
        throw new Error(errorMessage);
      }

      // Validate response body
      try {
        const responseData = await response.json();
        if (responseData.errors && responseData.errors.length > 0) {
          console.warn('Expo push notification warnings:', responseData.errors);
        }
      } catch (jsonError) {
        console.warn('Could not parse push notification response as JSON');
      }

      await this.updateDeliveryStatus({
        notificationId: notification.payload.data?.id as string,
        status: DELIVERY_STATUS.DELIVERED,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      throw new Error(`Push notification delivery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper method to handle deep links
  private handleDeepLink(deepLink: string): void {
    try {
      // If it's a Branch link (starts with the Branch domain)
      if (deepLink.includes('xbwk1.app.link') || deepLink.includes('xbwk1-alternate.app.link')) {
        // Use Branch SDK directly to open URL
        branch.openURL(deepLink);
      } else if (deepLink.startsWith('edushorts://')) {
        // Handle standard deep links using our DeepLinkHandler
        DeepLinkHandler.getInstance().handleDeepLink(deepLink);
      } else {
        // For any other URL, attempt to open it
        DeepLinkHandler.getInstance().handleDeepLink(deepLink);
      }
    } catch (error) {
      console.error('Error handling deep link from notification:', error);
    }
  }

  private async handleScheduledNotification(notification: NotificationPayload): Promise<void> {
    // Store the notification for later delivery
    const scheduledTime = notification.payload.data?.scheduledFor as string;
    if (!scheduledTime) {
      throw new Error('Scheduled notification missing scheduledFor time');
    }

    await supabase
      .from('scheduled_notifications')
      .insert({
        notification: notification,
        scheduled_for: scheduledTime,
        status: DELIVERY_STATUS.PENDING
      });
  }

  private async handleArticleLinkNotification(notification: NotificationPayload): Promise<void> {
    // Ensure the deep link is properly formatted
    if (!notification.payload.deep_link?.startsWith('edushorts://articles/')) {
      throw new Error('Invalid article deep link format');
    }

    await this.handlePushNotification({
      ...notification,
      type: NOTIFICATION_TYPES.PUSH
    });
  }

  private async handleWebNotification(notification: NotificationPayload): Promise<void> {
    // Web notifications are handled differently - they're shown in the app's UI
    await supabase
      .from('web_notifications')
      .insert({
        title: notification.payload.title,
        body: notification.payload.body,
        data: notification.payload.data,
        created_at: new Date()
      });
  }

  private async handleDeliveryFailure(notification: NotificationPayload): Promise<void> {
    const notificationId = notification.payload.data?.id as string;
    const currentAttempts = this.retryQueue.get(notificationId)?.attempts || 0;

    if (currentAttempts < NOTIFICATION_CONFIG.monitoring.retryAttempts) {
      this.retryQueue.set(notificationId, {
        payload: notification,
        attempts: currentAttempts + 1
      });

      const currentMetrics = this.monitoring['metrics'].deliveryStats;
      await this.monitoring.updateMetrics({
        deliveryStats: {
          totalSent: currentMetrics.totalSent,
          delivered: currentMetrics.delivered,
          failed: currentMetrics.failed + 1,
          retried: currentMetrics.retried + 1
        }
      });
    } else {
      await this.updateDeliveryStatus({
        notificationId,
        status: DELIVERY_STATUS.FAILED,
        timestamp: new Date()
      });

      this.retryQueue.delete(notificationId);
    }
  }

  private startRetryProcessor(): void {
    setInterval(async () => {
      for (const [id, { payload, attempts }] of this.retryQueue) {
        try {
          await this.processNotification(payload);
          this.retryQueue.delete(id);
        } catch (error: unknown) {
          console.error(`Retry attempt ${attempts} failed for notification ${id}:`, 
            error instanceof Error ? error.message : error);
        }
      }
    }, 60000); // Process retry queue every minute
  }

  async getExpoToken(): Promise<string> {
    const { data: profile } = await supabase.auth.getUser();
    if (!profile?.user?.id) {
      throw new Error('No authenticated user');
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', profile.user.id)
      .single();

    const expoToken = userProfile?.notification_preferences?.expo_token;
    if (!expoToken) {
      throw new Error('No Expo push token found');
    }

    return expoToken;
  }

  async updateDeliveryStatus(update: DeliveryStatusUpdate): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({
          status: update.status,
          updated_at: update.timestamp
        })
        .eq('id', update.notificationId);

      if (update.status === DELIVERY_STATUS.DELIVERED) {
        const currentMetrics = this.monitoring['metrics'].deliveryStats;
        await this.monitoring.updateMetrics({
          deliveryStats: {
            totalSent: currentMetrics.totalSent,
            delivered: currentMetrics.delivered + 1,
            failed: currentMetrics.failed,
            retried: currentMetrics.retried
          }
        });
      }
    } catch (error: unknown) {
      console.error('Failed to update delivery status:', error);
      throw error;
    }
  }

  cleanup(): void {
    // Clean up any subscriptions or intervals
    clearInterval(this.startRetryProcessor as unknown as number);
  }

  /**
   * Handles an FCM message received directly by the app.
   * This method processes both notification and data messages from FCM and displays them using expo-notifications.
   * @param remoteMessage The FCM message received from @react-native-firebase/messaging
   */
  async handleReceivedFcmMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    console.log('NotificationBridge: handleReceivedFcmMessage', JSON.stringify(remoteMessage, null, 2));
    try {
      // Extract notification data, prioritizing notification fields over data fields
      const notificationData = {
        title: remoteMessage.notification?.title || remoteMessage.data?.title || 'New Notification',
        body: remoteMessage.notification?.body || remoteMessage.data?.body || remoteMessage.data?.message || '',
        deep_link: (remoteMessage.data?.deep_link || remoteMessage.data?.url || remoteMessage.data?.click_action || '').toString(),
        // Preserve all original data for potential use
        originalData: remoteMessage.data || {},
        messageId: remoteMessage.messageId,
        // Include additional FCM-specific fields if present
        channelId: remoteMessage.notification?.android?.channelId,
      };

      // Handle deep link if present
      if (notificationData.deep_link) {
        this.handleDeepLink(notificationData.deep_link);
      }

      // Map FCM priority to a string priority value if present
      let priority: string | undefined;
      if (remoteMessage.notification?.android?.priority) {
        switch (remoteMessage.notification.android.priority) {
          case FirebaseMessagingTypes.NotificationAndroidPriority.PRIORITY_HIGH:
          case FirebaseMessagingTypes.NotificationAndroidPriority.PRIORITY_MAX:
            priority = 'high';
            break;
          case FirebaseMessagingTypes.NotificationAndroidPriority.PRIORITY_LOW:
          case FirebaseMessagingTypes.NotificationAndroidPriority.PRIORITY_MIN:
            priority = 'low';
            break;
          default:
            priority = 'default';
        }
      }

      // Ensure all data values are strings
      const sanitizedData = Object.entries(notificationData).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: typeof value === 'string' ? value : value?.toString() || ''
      }), {});

      // Schedule the notification using expo-notifications
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: String(notificationData.title),
          body: String(notificationData.body),
          data: sanitizedData,
          sound: 'default',
          // If we have an Android channel ID from FCM, use it
          ...(notificationData.channelId && { android: { channelId: notificationData.channelId } }),
          // Include priority if mapped
          ...(priority && { priority }),
        },
        trigger: null, // Display immediately
      });

      console.log('NotificationBridge: FCM notification scheduled with expo-notifications, ID:', notificationId);

      // Update delivery status if we have a message ID
      if (remoteMessage.messageId) {
        await this.updateDeliveryStatus({
          notificationId: remoteMessage.messageId,
          status: DELIVERY_STATUS.DELIVERED,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('NotificationBridge: Error in handleReceivedFcmMessage:', error);
      // If we have a message ID, update the delivery status as failed
      if (remoteMessage.messageId) {
        await this.handleDeliveryFailure({
          type: NOTIFICATION_TYPES.PUSH,
          payload: {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: { id: remoteMessage.messageId }
          }
        });
      }
      // Re-throw the error for upstream handling
      throw error;
    }
  }
}

export default NotificationBridge;
