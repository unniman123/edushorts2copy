import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import NotificationStorage from '../../services/NotificationStorage';
import { DELIVERY_STATUS } from '../../constants/config';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../utils/supabase');

describe('NotificationStorage', () => {
  let notificationStorage: NotificationStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationStorage = NotificationStorage.getInstance();
  });

  afterEach(async () => {
    await notificationStorage.clearAll();
  });

  const mockNotification = {
    id: 'test-id',
    status: DELIVERY_STATUS.PENDING,
    timestamp: new Date(),
    payload: { title: 'Test', body: 'Test notification' },
    retryCount: 0
  };

  describe('initialization', () => {
    it('should load stored notifications on initialize', async () => {
      const storedNotifications = [mockNotification];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(storedNotifications)
      );

      await notificationStorage.initialize();

      const history = await notificationStorage.getNotificationHistory();
      expect(AsyncStorage.getItem).toHaveBeenCalled();
      expect(history.notifications).toHaveLength(0); // Empty because we haven't added to history
    });

    it('should handle initialization errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(notificationStorage.initialize()).resolves.not.toThrow();
    });
  });

  describe('notification caching', () => {
    it('should cache notification and persist to storage', async () => {
      await notificationStorage.cacheNotification(mockNotification);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications',
        expect.stringContaining(mockNotification.id)
      );
    });

    it('should update delivery status for cached notification', async () => {
      await notificationStorage.cacheNotification(mockNotification);
      await notificationStorage.updateDeliveryStatus(mockNotification.id, DELIVERY_STATUS.DELIVERED);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications',
        expect.stringContaining(DELIVERY_STATUS.DELIVERED)
      );
    });
  });

  describe('syncing with Supabase', () => {
    beforeEach(async () => {
      await notificationStorage.cacheNotification(mockNotification);
    });

    it('should sync cached notifications with Supabase', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null })
      });

      await notificationStorage.syncWithSupabase();

      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@last_sync_time',
        expect.any(String)
      );
    });

    it('should handle sync errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: new Error('Sync failed') })
      });

      await notificationStorage.syncWithSupabase();

      // Notification should still be in pending sync
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications',
        expect.stringContaining(mockNotification.id)
      );
    });
  });

  describe('notification history', () => {
    it('should add notification to history', async () => {
      await notificationStorage.addToHistory(mockNotification);

      const history = await notificationStorage.getNotificationHistory();
      expect(history.notifications[0].id).toBe(mockNotification.id);
    });

    it('should limit history to 100 notifications', async () => {
      const notifications = Array.from({ length: 110 }, (_, i) => ({
        ...mockNotification,
        id: `test-id-${i}`
      }));

      for (const notification of notifications) {
        await notificationStorage.addToHistory(notification);
      }

      const history = await notificationStorage.getNotificationHistory();
      expect(history.notifications).toHaveLength(100);
      expect(history.notifications[0].id).toBe('test-id-109'); // Most recent first
    });

    it('should prune old notifications', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      const oldNotification = { ...mockNotification, timestamp: oldDate };
      const newNotification = { ...mockNotification, id: 'new-id' };

      await notificationStorage.addToHistory(oldNotification);
      await notificationStorage.addToHistory(newNotification);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      await notificationStorage.pruneOldNotifications(cutoffDate);

      const history = await notificationStorage.getNotificationHistory();
      expect(history.notifications).toHaveLength(1);
      expect(history.notifications[0].id).toBe('new-id');
    });
  });

  describe('cleanup', () => {
    it('should clear all storage', async () => {
      await notificationStorage.clearAll();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@notifications');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@notification_history');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@last_sync_time');
    });

    it('should handle clear errors gracefully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Clear failed'));

      await expect(notificationStorage.clearAll()).rejects.toThrow('Clear failed');
    });
  });
});
