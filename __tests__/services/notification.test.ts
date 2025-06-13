import { NotificationService } from '../../services';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../../utils/supabase';

jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('../../utils/supabase');

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = NotificationService.getInstance();
  });

  describe('requestPermissions', () => {
    it('should return false if not on a physical device', async () => {
      (Device as any).isDevice = false;
      
      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
    });

    it('should request permissions if not already granted', async () => {
      (Device as any).isDevice = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('registerForPushNotifications', () => {
    it('should return null if permissions are not granted', async () => {
      jest.spyOn(notificationService, 'requestPermissions').mockResolvedValueOnce(false);

      const result = await notificationService.registerForPushNotifications();

      expect(result).toBeNull();
    });

    it('should return token if permissions are granted', async () => {
      jest.spyOn(notificationService, 'requestPermissions').mockResolvedValueOnce(true);
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'test-token',
      });

      const result = await notificationService.registerForPushNotifications();

      expect(result).toBe('test-token');
    });

    it('should store notification token successfully', async () => {
      const notificationService = NotificationService.getInstance();
      
      // Mock the Firebase messaging and permissions
      jest.spyOn(notificationService as any, 'getMessagingInstance').mockReturnValue({
        getToken: jest.fn().mockResolvedValue('test-fcm-token'),
        requestPermission: jest.fn().mockResolvedValue(1), // AuthorizationStatus.AUTHORIZED
        onTokenRefresh: jest.fn()
      });
      
      const result = await notificationService.registerForPushNotifications();
      expect(result.fcmToken).toBeDefined();
    });

    it('should handle token storage errors gracefully', async () => {
      const notificationService = NotificationService.getInstance();
      
      // Mock to throw error
      jest.spyOn(notificationService as any, 'getMessagingInstance').mockReturnValue({
        getToken: jest.fn().mockRejectedValue(new Error('Token error')),
        requestPermission: jest.fn().mockResolvedValue(1),
        onTokenRefresh: jest.fn()
      });
      
      const result = await notificationService.registerForPushNotifications();
      expect(result.fcmToken).toBeNull();
    });
  });

  describe('token storage', () => {
    it('should handle token storage via registerForPushNotifications', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: { user: mockUser } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      });

      jest.spyOn(notificationService, 'requestPermissions').mockResolvedValueOnce(true);
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'test-expo-token',
      });

      const result = await notificationService.registerForPushNotifications();
      expect(result.expoToken).toBe('test-expo-token');
    });

    it('should handle token storage errors gracefully', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
      });

      jest.spyOn(notificationService, 'requestPermissions').mockResolvedValueOnce(true);
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'test-expo-token',
      });

      const result = await notificationService.registerForPushNotifications();
      expect(result.expoToken).toBe('test-expo-token');
    });
  });
});
