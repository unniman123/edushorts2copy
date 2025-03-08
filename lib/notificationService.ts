import { supabase } from './supabaseClient';
import { DBNotification } from '../types/notifications';
import { withTimeout, withRetry, DEFAULT_TIMEOUT, TimeoutError } from './timeoutUtils';

interface NotificationResponse {
  notifications: DBNotification[];
  unreadCount: number;
}

export class NotificationService {
  static async getNotifications(userId?: string): Promise<NotificationResponse> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        if (!userId) throw new Error('User not authenticated');
      }

      const result = await withRetry(
        async () => {
          const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          return notifications as DBNotification[];
        },
        {
          timeoutMs: DEFAULT_TIMEOUT.DATA,
          maxAttempts: 3,
          retryableError: (error) => error instanceof TimeoutError
        }
      );

      const unreadCount = result.filter(n => !n.read).length;

      return {
        notifications: result,
        unreadCount
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch notifications');
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await withTimeout(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

          if (error) throw error;
        },
        DEFAULT_TIMEOUT.DATA,
        'Mark as read operation timed out'
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  }

  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: DBNotification) => void
  ): () => void {
    const subscription = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          onNotification(payload.new as DBNotification);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications');
        } else if (status === 'CLOSED') {
          console.log('Notification subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error in notification subscription');
        }
      });

    // Return cleanup function
    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(subscription);
    };
  }

  static async createNotification(notification: Omit<DBNotification, 'id' | 'created_at'>): Promise<void> {
    try {
      await withTimeout(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .insert([notification]);

          if (error) throw error;
        },
        DEFAULT_TIMEOUT.DATA,
        'Create notification operation timed out'
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create notification');
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await withTimeout(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

          if (error) throw error;
        },
        DEFAULT_TIMEOUT.DATA,
        'Delete notification operation timed out'
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete notification');
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await withTimeout(
        async () => {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

          if (error) throw error;
        },
        DEFAULT_TIMEOUT.DATA,
        'Mark all as read operation timed out'
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await withTimeout(
        async () => {
          const { data, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('read', false);

          if (error) throw error;
          return data.length;
        },
        DEFAULT_TIMEOUT.DATA,
        'Get unread count operation timed out'
      );

      return response;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get unread count');
    }
  }
}
