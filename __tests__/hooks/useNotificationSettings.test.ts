import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';

jest.mock('@react-native-async-storage/async-storage');

describe('useNotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default settings', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(result.current.settings).toEqual(
      expect.objectContaining({
        categories: [],
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        },
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true
      })
    );
  });

  it('should load saved settings', async () => {
    const mockSettings = {
      categories: ['news', 'updates'],
      quietHours: {
        enabled: true,
        start: '23:00',
        end: '08:00'
      },
      lastSyncTime: new Date().toISOString(),
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: false
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockSettings)
    );

    const { result } = renderHook(() => useNotificationSettings());

    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(result.current.settings).toEqual({
      ...mockSettings,
      lastSyncTime: expect.any(Date)
    });
  });

  it('should update quiet hours', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    const newQuietHours = {
      enabled: true,
      start: '21:00',
      end: '06:00'
    };

    await act(async () => {
      await result.current.updateQuietHours(newQuietHours);
    });

    expect(result.current.settings.quietHours).toEqual(newQuietHours);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@notification_settings',
      expect.stringContaining('"enabled":true')
    );
  });

  it('should toggle push notifications', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    await act(async () => {
      await result.current.togglePushNotifications();
    });

    expect(result.current.settings.pushEnabled).toBe(false);

    await act(async () => {
      await result.current.togglePushNotifications();
    });

    expect(result.current.settings.pushEnabled).toBe(true);
  });

  it('should detect quiet time correctly', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    // Mock current time to be within quiet hours
    const mockDate = new Date('2025-04-25T23:30:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    await act(async () => {
      await result.current.updateQuietHours({
        enabled: true,
        start: '22:00',
        end: '07:00'
      });
    });

    expect(result.current.isQuietTime()).toBe(true);

    // Mock time outside quiet hours
    const newMockDate = new Date('2025-04-25T15:30:00');
    jest.spyOn(global, 'Date').mockImplementation(() => newMockDate);

    expect(result.current.isQuietTime()).toBe(false);

    global.Date = Date;
  });

  it('should determine notification delivery based on settings', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    await act(async () => {
      await result.current.updateQuietHours({
        enabled: true,
        start: '22:00',
        end: '07:00'
      });
    });

    // Mock quiet time
    const mockDate = new Date('2025-04-25T23:30:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    expect(result.current.shouldDeliverNotification('push')).toBe(false);

    // Mock active time
    const newMockDate = new Date('2025-04-25T15:30:00');
    jest.spyOn(global, 'Date').mockImplementation(() => newMockDate);

    expect(result.current.shouldDeliverNotification('push')).toBe(true);

    await act(async () => {
      await result.current.togglePushNotifications();
    });

    expect(result.current.shouldDeliverNotification('push')).toBe(false);

    global.Date = Date;
  });

  it('should reset settings to defaults', async () => {
    const { result } = renderHook(() => useNotificationSettings());

    await act(async () => {
      await result.current.updateQuietHours({
        enabled: true,
        start: '21:00',
        end: '06:00'
      });
    });

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(result.current.settings.quietHours.enabled).toBe(false);
    expect(result.current.settings.pushEnabled).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@notification_settings');
  });

  it('should handle storage errors gracefully', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('Storage error')
    );

    const { result } = renderHook(() => useNotificationSettings());

    await expect(
      act(async () => {
        await result.current.updateQuietHours({
          enabled: true,
          start: '21:00',
          end: '06:00'
        });
      })
    ).rejects.toThrow('Storage error');
  });
});
