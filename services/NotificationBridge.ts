import { NOTIFICATION_CONFIG, NOTIFICATION_TYPES, DELIVERY_STATUS } from '../constants/config';
import type { NotificationType, DeliveryStatus } from '../constants/config';
import { supabase } from '../utils/supabase';
import MonitoringService from './MonitoringService';

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
      const response = await fetch(NOTIFICATION_CONFIG.expo.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTIFICATION_CONFIG.expo.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: await this.getExpoToken(),
          title: notification.payload.title,
          body: notification.payload.body,
          data: notification.payload.data
        })
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
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

    const expoToken = userProfile?.notification_preferences?.expo_push_token;
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
}

export default NotificationBridge;
