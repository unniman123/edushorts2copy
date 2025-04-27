import { renderHook } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { useNotificationPermissions } from '../../hooks/useNotificationPermissions';

jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-device');

describe('useNotificationPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Device as any).isDevice = true;
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useNotificationPermissions());
    expect(result.current.isLoading).toBe(true);
  });

  it('should load persisted permissions on mount', async () => {
    const mockPersistedState = {
      status: 'granted',
      canAskAgain: true,
      lastChecked: new Date().toISOString()
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockPersistedState)
    );

    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted'
    });

    const { result } = renderHook(() => useNotificationPermissions());
    
    await act(async () => {
      // Wait for state updates
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(result.current.permissionState?.status).toBe('granted');
    expect(result.current.isLoading).toBe(false);
  });

  it('should request permissions successfully', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined'
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted'
    });

    const { result } = renderHook(() => useNotificationPermissions());

    // Wait for initial state update
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    let requestResult;
    await act(async () => {
      requestResult = await result.current.requestPermissions();
      // Wait for state updates
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(requestResult).toBe(true);
    expect(result.current.permissionState?.status).toBe('granted');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should handle permission denial', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined'
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied'
    });

    const { result } = renderHook(() => useNotificationPermissions());

    // Wait for initial state update
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    let requestResult;
    await act(async () => {
      requestResult = await result.current.requestPermissions();
      // Wait for state updates
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(requestResult).toBe(false);
    expect(result.current.permissionState?.status).toBe('denied');
    expect(result.current.permissionState?.canAskAgain).toBe(false);
  });

  it('should handle simulator/emulator environment', async () => {
    (Device as any).isDevice = false;

    const { result } = renderHook(() => useNotificationPermissions());

    // Wait for initial state update
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    let requestResult;
    await act(async () => {
      requestResult = await result.current.requestPermissions();
      // Wait for state updates
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(requestResult).toBe(false);
    expect(result.current.permissionState?.status).toBe('denied');
    expect(result.current.permissionState?.canAskAgain).toBe(false);
  });

  it('should handle permission check errors', async () => {
    const error = new Error('Permission check failed');
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useNotificationPermissions());

    // Wait for initial state update
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(result.current.permissionState?.status).toBe('undetermined');
    expect(result.current.permissionState?.canAskAgain).toBe(true);
  });

  it('should handle permission request errors', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined'
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Permission request failed')
    );

    const { result } = renderHook(() => useNotificationPermissions());

    // Wait for initial state update
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    let requestResult;
    await act(async () => {
      requestResult = await result.current.requestPermissions();
      // Wait for state updates
      await new Promise(resolve => setImmediate(resolve));
    });

    expect(requestResult).toBe(false);
  });

  describe('iOS specific behavior', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('should set up permission change listener on iOS', async () => {
      const mockAddListener = Notifications.addNotificationReceivedListener as jest.Mock;
      
      renderHook(() => useNotificationPermissions());

      expect(mockAddListener).toHaveBeenCalled();
    });

    it('should clean up listener on unmount', () => {
      const mockRemoveSubscription = Notifications.removeNotificationSubscription as jest.Mock;
      const mockSubscription = {};
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValueOnce(
        mockSubscription
      );

      const { unmount } = renderHook(() => useNotificationPermissions());
      
      unmount();

      expect(mockRemoveSubscription).toHaveBeenCalledWith(mockSubscription);
    });
  });
});
