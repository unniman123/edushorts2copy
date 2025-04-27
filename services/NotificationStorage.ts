import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { DELIVERY_STATUS } from '../constants/config';
import type { DeliveryStatus } from '../constants/config';

interface StoredNotification {
  id: string;
  status: DeliveryStatus;
  timestamp: Date;
  payload: Record<string, any>;
  retryCount: number;
}

interface NotificationHistory {
  notifications: StoredNotification[];
  lastSyncTime: Date;
}

const STORAGE_KEYS = {
  NOTIFICATIONS: '@notifications',
  HISTORY: '@notification_history',
  LAST_SYNC: '@last_sync_time'
};

class NotificationStorage {
  private static instance: NotificationStorage;
  private pendingSync: Map<string, StoredNotification>;

  private constructor() {
    this.pendingSync = new Map();
  }

  static getInstance(): NotificationStorage {
    if (!NotificationStorage.instance) {
      NotificationStorage.instance = new NotificationStorage();
    }
    return NotificationStorage.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load any pending notifications from storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const notifications = JSON.parse(stored);
        notifications.forEach((notification: StoredNotification) => {
          this.pendingSync.set(notification.id, {
            ...notification,
            timestamp: new Date(notification.timestamp)
          });
        });
      }
    } catch (error) {
      console.error('Failed to initialize notification storage:', error);
    }
  }

  async cacheNotification(notification: StoredNotification): Promise<void> {
    try {
      this.pendingSync.set(notification.id, notification);
      await this.persistToStorage();
    } catch (error) {
      console.error('Failed to cache notification:', error);
      throw error;
    }
  }

  async updateDeliveryStatus(id: string, status: DeliveryStatus): Promise<void> {
    try {
      const notification = this.pendingSync.get(id);
      if (notification) {
        notification.status = status;
        notification.timestamp = new Date();
        await this.persistToStorage();
      }
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      throw error;
    }
  }

  private async persistToStorage(): Promise<void> {
    try {
      const notifications = Array.from(this.pendingSync.values());
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to persist notifications to storage:', error);
      throw error;
    }
  }

  async syncWithSupabase(): Promise<void> {
    try {
      const notifications = Array.from(this.pendingSync.values());
      
      for (const notification of notifications) {
        const { error } = await supabase
          .from('notifications')
          .update({
            status: notification.status,
            updated_at: notification.timestamp
          })
          .eq('id', notification.id);

        if (!error) {
          this.pendingSync.delete(notification.id);
        }
      }

      // Update storage after sync
      await this.persistToStorage();
      await this.updateLastSyncTime();
    } catch (error) {
      console.error('Failed to sync with Supabase:', error);
      throw error;
    }
  }

  async getNotificationHistory(): Promise<NotificationHistory> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        const history = JSON.parse(stored);
        return {
          ...history,
          lastSyncTime: new Date(history.lastSyncTime),
          notifications: history.notifications.map((n: StoredNotification) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }))
        };
      }
      return {
        notifications: [],
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  async addToHistory(notification: StoredNotification): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (history.notifications.length > 100) {
        history.notifications = history.notifications.slice(0, 100);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add notification to history:', error);
      throw error;
    }
  }

  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update last sync time:', error);
      throw error;
    }
  }

  async pruneOldNotifications(olderThan: Date): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.notifications = history.notifications.filter(
        n => new Date(n.timestamp) > olderThan
      );
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to prune old notifications:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC)
      ]);
      this.pendingSync.clear();
    } catch (error) {
      console.error('Failed to clear notification storage:', error);
      throw error;
    }
  }
}

export default NotificationStorage;
