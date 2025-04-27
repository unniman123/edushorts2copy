import { NOTIFICATION_TYPES, DELIVERY_STATUS } from '../../constants/config';
import NotificationBridge from '../../services/NotificationBridge';
import MonitoringService from '../../services/MonitoringService';
import { supabase } from '../../utils/supabase';

jest.mock('../../services/MonitoringService');
jest.mock('../../utils/supabase');

describe('NotificationBridge', () => {
  let notificationBridge: NotificationBridge;
  const mockMonitoring = {
    metrics: {
      deliveryStats: {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        retried: 0
      }
    },
    updateMetrics: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (MonitoringService.getInstance as jest.Mock).mockReturnValue(mockMonitoring);
    notificationBridge = NotificationBridge.getInstance();
  });

  describe('initialization', () => {
    it('should setup realtime subscription', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      await notificationBridge.initialize();

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('processNotification', () => {
    const mockNotification = {
      type: NOTIFICATION_TYPES.PUSH,
      payload: {
        title: 'Test Title',
        body: 'Test Body',
        data: { id: 'test-id' }
      }
    };

    it('should handle push notifications successfully', async () => {
      const mockResponse = { ok: true };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'test-user' } }
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            notification_preferences: {
              expo_push_token: 'test-token'
            }
          }
        }),
        update: jest.fn().mockReturnThis()
      });

      await notificationBridge.processNotification(mockNotification);

      expect(mockMonitoring.updateMetrics).toHaveBeenCalledWith(expect.objectContaining({
        deliveryStats: expect.any(Object)
      }));
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle delivery failures', async () => {
      const mockResponse = { ok: false, statusText: 'Test Error' };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'test-user' } }
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            notification_preferences: {
              expo_push_token: 'test-token'
            }
          }
        }),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis()
      });

      await expect(notificationBridge.processNotification(mockNotification))
        .rejects.toThrow();

      expect(mockMonitoring.updateMetrics).toHaveBeenCalledWith(expect.objectContaining({
        deliveryStats: expect.objectContaining({
          failed: expect.any(Number)
        })
      }));
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update status and metrics on delivery success', async () => {
      const update = {
        notificationId: 'test-id',
        status: DELIVERY_STATUS.DELIVERED,
        timestamp: new Date()
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      });

      await notificationBridge.updateDeliveryStatus(update);

      expect(mockMonitoring.updateMetrics).toHaveBeenCalledWith(expect.objectContaining({
        deliveryStats: expect.objectContaining({
          delivered: expect.any(Number)
        })
      }));
    });

    it('should handle update failures', async () => {
      const update = {
        notificationId: 'test-id',
        status: DELIVERY_STATUS.FAILED,
        timestamp: new Date()
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Update failed'))
      });

      await expect(notificationBridge.updateDeliveryStatus(update))
        .rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clear retry processor interval', () => {
      const mockInterval = 123;
      global.setInterval = jest.fn().mockReturnValue(mockInterval);
      global.clearInterval = jest.fn();

      notificationBridge.initialize();
      notificationBridge.cleanup();

      expect(global.clearInterval).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});
