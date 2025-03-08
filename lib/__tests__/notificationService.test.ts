import { NotificationService } from '../notificationService';
import { supabase } from '../supabaseClient';
import { TimeoutError } from '../timeoutUtils';
import { DBNotification, NotificationTargetAudience } from '../../types/notifications';

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    },
    channel: jest.fn(),
    removeChannel: jest.fn()
  }
}));

interface MockChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
}

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockUserId = 'test-user-id';
  const mockTargetAudience: NotificationTargetAudience = {
    roles: ['user'],
    categories: ['Education']
  };

  const mockNotification: DBNotification = {
    id: 'test-notification-id',
    user_id: mockUserId,
    title: 'Test Notification',
    body: 'Test Message',
    target_audience: mockTargetAudience,
    created_at: '2025-03-08T10:00:00Z',
    scheduled_at: null,
    read: false
  };

  describe('getNotifications', () => {
    it('should return notifications and unread count', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockNotification],
              error: null
            })
          })
        })
      });

      const result = await NotificationService.getNotifications();
      expect(result.notifications).toEqual([mockNotification]);
      expect(result.unreadCount).toBe(1);
    });

    it('should handle timeout and retry', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      const mockSelect = jest.fn()
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 6000)))
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockNotification],
              error: null
            })
          })
        });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const promise = NotificationService.getNotifications();
      
      // Trigger first timeout
      jest.advanceTimersByTime(5001);
      
      // Allow retry to succeed
      jest.advanceTimersByTime(1000);
      
      const result = await promise;
      expect(result.notifications).toEqual([mockNotification]);
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(NotificationService.getNotifications())
        .rejects
        .toThrow('User not authenticated');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await NotificationService.markAsRead('test-notification-id');
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should handle timeout', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation(() => 
            new Promise(resolve => setTimeout(resolve, 6000))
          )
        })
      });

      const promise = NotificationService.markAsRead('test-notification-id');
      jest.advanceTimersByTime(5001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
  });

  describe('subscribeToNotifications', () => {
    it('should set up subscription correctly', () => {
      const mockChannel: MockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const onNotification = jest.fn();
      const unsubscribe = NotificationService.subscribeToNotifications(
        mockUserId,
        onNotification
      );

      expect(supabase.channel).toHaveBeenCalledWith('notification_changes');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Test cleanup
      unsubscribe();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should handle new notifications', () => {
      const onNotification = jest.fn();
      let subscribeCb: ((payload: { new: DBNotification }) => void) | undefined;

      const mockChannel: MockChannel = {
        on: jest.fn((event, filter, callback) => {
          subscribeCb = callback;
          return mockChannel;
        }),
        subscribe: jest.fn()
      };

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      NotificationService.subscribeToNotifications(mockUserId, onNotification);

      // Simulate new notification
      if (subscribeCb) {
        subscribeCb({ new: mockNotification });
        expect(onNotification).toHaveBeenCalledWith(mockNotification);
      }
    });
  });

  describe('createNotification', () => {
    const mockCreateNotification: Omit<DBNotification, 'id' | 'created_at'> = {
      user_id: mockUserId,
      title: 'Test Notification',
      body: 'Test Message',
      target_audience: mockTargetAudience,
      scheduled_at: null,
      read: false
    };

    it('should create notification successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await NotificationService.createNotification(mockCreateNotification);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should handle timeout', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 6000))
        )
      });

      const promise = NotificationService.createNotification(mockCreateNotification);
      jest.advanceTimersByTime(5001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      await NotificationService.markAllAsRead(mockUserId);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should handle timeout', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation(() => 
              new Promise(resolve => setTimeout(resolve, 6000))
            )
          })
        })
      });

      const promise = NotificationService.markAllAsRead(mockUserId);
      jest.advanceTimersByTime(5001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
  });
});
