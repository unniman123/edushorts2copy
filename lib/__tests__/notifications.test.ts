import { NotificationService } from '../notificationService';
import { supabase } from '../supabaseClient';
import type { CreateNotificationDTO, UpdateNotificationDTO } from '../../types/notifications';

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn()
  }
}));

describe('NotificationService', () => {
  const mockNotification = {
    id: '123',
    title: 'Test Notification',
    body: 'Test Body',
    target_audience: { roles: ['user'], categories: [] },
    created_at: '2025-03-07T12:00:00Z',
    scheduled_at: null,
    is_read: false,
    user_id: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications with filters', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        data: [mockNotification],
        error: null
      });
      const mockCount = jest.fn().mockReturnValue({
        count: 1,
        error: null
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis()
      });

      const filters = {
        isRead: false,
        fromDate: '2025-03-01',
        toDate: '2025-03-07'
      };

      const result = await NotificationService.getNotifications(filters);

      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
    });

    it('should handle errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      await expect(NotificationService.getNotifications()).rejects.toThrow();
    });
  });

  describe('createNotification', () => {
    it('should create a notification with default target audience', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        data: mockNotification,
        error: null
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      });

      const createDTO: CreateNotificationDTO = {
        title: 'Test Notification',
        body: 'Test Body'
      };

      const result = await NotificationService.createNotification(createDTO);

      expect(result).toEqual(mockNotification);
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Test Notification',
          target_audience: { roles: ['user'], categories: [] }
        })
      ]);
    });
  });

  describe('updateNotification', () => {
    it('should update a notification', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        data: { ...mockNotification, is_read: true },
        error: null
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      });

      const updateDTO: UpdateNotificationDTO = {
        id: '123',
        is_read: true
      };

      const result = await NotificationService.updateNotification(updateDTO);

      expect(result.is_read).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        error: null
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: jest.fn().mockReturnThis()
      });

      await NotificationService.markAsRead('123');

      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });
  });

  describe('subscribeToNotifications', () => {
    it('should subscribe to notifications', () => {
      const mockSubscribe = jest.fn();
      const mockOn = jest.fn().mockReturnThis();

      (supabase.channel as jest.Mock).mockReturnValue({
        on: mockOn,
        subscribe: mockSubscribe
      });

      const callback = jest.fn();
      const unsubscribe = NotificationService.subscribeToNotifications(callback);

      expect(mockSubscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
