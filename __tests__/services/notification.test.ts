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
  });

  describe('storeExpoToken', () => {
    it('should store token in Supabase profiles table', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser },
      });

      await notificationService.storeExpoToken('test-token');

      expect(supabase.from('profiles').update).toHaveBeenCalledWith({
        notification_preferences: {
          push: true,
          email: true,
          expo_push_token: 'test-token',
        },
      });
    });

    it('should throw error if no user is authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
      });

      await expect(notificationService.storeExpoToken('test-token')).rejects.toThrow(
        'No authenticated user found'
      );
    });
  });
});
