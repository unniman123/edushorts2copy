import { NotificationService } from '../../services';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import { Platform } from 'react-native';

// Setup mocks
jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../utils/supabase');

describe('Notification Service Integration Tests', () => {
  // Mock setup
  const mockExpoPushToken = 'ExponentPushToken[MOCK_TOKEN]';
  const mockDeviceId = 'mock-device-id';
  const mockUserId = 'mock-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    
    // Mock Device.isDevice
    (Device.isDevice as jest.Mock).mockReturnValue(true);
    
    // Mock expo-notifications methods
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      canAskAgain: true,
    });
    
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: mockExpoPushToken,
    });
    
    // Mock supabase auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
    
    // Mock successful database operations
    const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: mockUpsert,
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'pref-1',
              user_id: mockUserId,
              device_id: mockDeviceId,
              notification_preferences: {
                push_enabled: true,
                quiet_hours: {
                  enabled: false,
                  start: '22:00',
                  end: '07:00',
                },
                expo_push_token: mockExpoPushToken,
              }
            },
            error: null,
          }),
        }),
      }),
    });
    
    // Mock Platform
    Platform.OS = 'ios';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Device Registration Integration
  it('should register device for push notifications and persist token', async () => {
    // Execute registration flow
    await NotificationService.registerForPushNotifications();
    
    // Verify permissions were checked
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    
    // Verify token was obtained
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
    
    // Verify data was saved to supabase
    expect(supabase.from).toHaveBeenCalledWith('user_notification_preferences');
    const mockUpsert = (supabase.from as jest.Mock).mock.results[0].value.upsert;
    expect(mockUpsert).toHaveBeenCalled();
    
    // Check the payload contains the right data
    const upsertCall = mockUpsert.mock.calls[0][0];
    expect(upsertCall).toHaveProperty('notification_preferences');
    expect(upsertCall.notification_preferences).toHaveProperty('expo_push_token', mockExpoPushToken);
  });

  // Test Case 2: Permission Handling Integration
  it('should request permissions if not granted', async () => {
    // Setup initial permissions as not granted
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
    
    // Mock request permissions to succeed
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      canAskAgain: true,
    });
    
    // Execute registration
    await NotificationService.registerForPushNotifications();
    
    // Verify request was made
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    
    // Verify the rest of the flow continued
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
  });

  // Test Case 3: Non-Device Environment Integration
  it('should handle simulator/web environments gracefully', async () => {
    // Mock isDevice to false (simulator or web)
    (Device.isDevice as jest.Mock).mockReturnValue(false);
    
    // Execute registration
    await NotificationService.registerForPushNotifications();
    
    // Verify early exit - no token requested
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  // Test Case 4: Android Channel Creation
  it('should create notification channel on Android', async () => {
    // Mock platform as Android
    Platform.OS = 'android';
    
    // Execute registration
    await NotificationService.registerForPushNotifications();
    
    // Verify channel creation happened
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
    
    // Verify channel attributes
    const channelCall = (Notifications.setNotificationChannelAsync as jest.Mock).mock.calls[0];
    expect(channelCall[0]).toBe('default');
    expect(channelCall[1]).toMatchObject({
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  });

  // Test Case 5: Fetch User Preferences Integration
  it('should fetch user notification preferences from Supabase', async () => {
    // Execute fetch
    const preferences = await NotificationService.getUserNotificationPreferences();
    
    // Verify supabase was called correctly
    expect(supabase.auth.getUser).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('user_notification_preferences');
    
    // Verify data is returned correctly
    expect(preferences).toHaveProperty('push_enabled', true);
    expect(preferences).toHaveProperty('quiet_hours');
    expect(preferences.quiet_hours).toHaveProperty('enabled', false);
  });

  // Test Case 6: Update Preferences Integration
  it('should update user notification preferences in Supabase', async () => {
    // Prepare update data
    const newPreferences = {
      push_enabled: false,
      quiet_hours: {
        enabled: true,
        start: '23:00',
        end: '08:00',
      },
    };
    
    // Execute update
    await NotificationService.updateNotificationPreferences(newPreferences);
    
    // Verify data was updated
    const mockUpsert = (supabase.from as jest.Mock).mock.results[0].value.upsert;
    const upsertCall = mockUpsert.mock.calls[0][0];
    
    expect(upsertCall.notification_preferences).toMatchObject(newPreferences);
  });

  // Test Case 7: Schedule Local Notification Integration
  it('should schedule a local notification', async () => {
    // Mock schedule function
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');
    
    // Prepare notification data
    const notificationData = {
      title: 'Test Notification',
      body: 'This is a test notification',
      data: { type: 'test', id: '123' },
    };
    
    // Execute schedule
    const id = await NotificationService.scheduleLocalNotification(notificationData);
    
    // Verify correct scheduling
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    expect(id).toBe('notification-id');
    
    // Check content was passed correctly
    const scheduleCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(scheduleCall.content).toMatchObject({
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
    });
  });

  // Test Case 8: Notification Reception Integration
  it('should set up notification reception handlers', () => {
    // Mock event listeners
    const mockAddReceivedListener = jest.fn().mockReturnValue('listener-id-1');
    const mockAddResponseListener = jest.fn().mockReturnValue('listener-id-2');
    (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation(mockAddReceivedListener);
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(mockAddResponseListener);
    
    // Set up handlers
    const cleanup = NotificationService.setupNotificationHandlers(
      jest.fn(),
      jest.fn()
    );
    
    // Verify listeners were added
    expect(mockAddReceivedListener).toHaveBeenCalled();
    expect(mockAddResponseListener).toHaveBeenCalled();
    
    // Verify cleanup function works
    cleanup();
    expect(Notifications.removeNotificationSubscription).toHaveBeenCalledTimes(2);
  });
}); 