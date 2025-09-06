/**
 * useNotificationPermissions - Custom hook for managing notification permissions and system settings
 * 
 * Provides comprehensive notification permission management including permission checking,
 * requesting, and persistent state tracking. Handles platform-specific permission logic,
 * app foreground/background state changes, and provides utilities for opening system settings.
 * Integrates with Expo Notifications and handles device-specific permission requirements.
 * 
 * @hook
 * @returns {UseNotificationPermissionsReturn} Object containing permission state and management methods
 * 
 * @example
 * const { 
 *   permissionState, 
 *   isLoading, 
 *   requestPermissions, 
 *   openSettings 
 * } = useNotificationPermissions();
 * 
 * // Request permissions
 * const handleRequestPermissions = async () => {
 *   const granted = await requestPermissions();
 *   if (granted) {
 *     console.log('Permissions granted');
 *   } else {
 *     // Show settings prompt
 *     await openSettings();
 *   }
 * };
 */
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import * as Device from 'expo-device';

/**
 * Notification permission state structure
 * @interface PermissionState
 */
export interface PermissionState {
  /** Current permission status */
  status: 'granted' | 'denied' | 'undetermined';
  /** Whether the system allows asking for permissions again */
  canAskAgain: boolean;
  /** Timestamp of when permissions were last checked */
  lastChecked: Date;
}

/**
 * Return type for useNotificationPermissions hook
 * @interface UseNotificationPermissionsReturn
 */
interface UseNotificationPermissionsReturn {
  /** Current permission state or null if not loaded */
  permissionState: PermissionState | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Function to request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Function to check current permission status */
  checkPermissions: () => Promise<PermissionState>;
  /** Function to open system settings */
  openSettings: () => Promise<void>;
  /** Function to handle permission changes */
  handlePermissionChange: () => Promise<void>;
}

/**
 * AsyncStorage key for persisting permission state
 * @constant {string}
 */
const PERMISSION_STORAGE_KEY = '@notification_permissions';

export const useNotificationPermissions = (): UseNotificationPermissionsReturn => {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Persists permission state to AsyncStorage
   * @param {PermissionState} state - Permission state to persist
   * @returns {Promise<void>} Promise that resolves when state is persisted
   */
  const persistPermissionState = useCallback(async (state: PermissionState) => {
    try {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist permission state:', error);
    }
  }, []);

  /**
   * Loads persisted permission state from AsyncStorage
   * @returns {Promise<void>} Promise that resolves when state is loaded
   */
  const loadPersistedState = useCallback(async () => {
    try {
      const storedState = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        parsed.lastChecked = new Date(parsed.lastChecked);
        setPermissionState(parsed);
      }
    } catch (error) {
      console.error('Failed to load permission state:', error);
    }
  }, []);

  /**
   * Checks current notification permissions from system
   * Handles device-specific permission checking and returns normalized state
   * @returns {Promise<PermissionState>} Promise that resolves to current permission state
   */
  const checkPermissions = useCallback(async (): Promise<PermissionState> => {
    if (!Device.isDevice) {
      return {
        status: 'denied',
        canAskAgain: false,
        lastChecked: new Date()
      };
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      return {
        status: existingStatus,
        canAskAgain: existingStatus !== 'denied',
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return {
        status: 'undetermined',
        canAskAgain: true,
        lastChecked: new Date()
      };
    }
  }, []);

  /**
   * Requests notification permissions from the system
   * Handles permission flow and updates state accordingly
   * @returns {Promise<boolean>} Promise that resolves to true if permissions were granted
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      return false;
    }

    try {
      const currentState = await checkPermissions();
      
      if (currentState.status === 'granted') {
        return true;
      }

      if (!currentState.canAskAgain) {
        return false;
      }

      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();

      const newState: PermissionState = {
        status,
        canAskAgain: status !== 'denied',
        lastChecked: new Date()
      };

      setPermissionState(newState);
      await persistPermissionState(newState);

      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }, [checkPermissions, persistPermissionState]);

  /**
   * Handles permission changes by checking current state and updating
   * Useful for handling app foreground/background state changes
   * @returns {Promise<void>} Promise that resolves when permission check is complete
   */
  const handlePermissionChange = useCallback(async () => {
    const currentState = await checkPermissions();
    setPermissionState(currentState);
    await persistPermissionState(currentState);
  }, [checkPermissions, persistPermissionState]);

  useEffect(() => {
    /**
     * Initializes permission state on component mount
     * Loads persisted state and checks current permissions
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     */
    const initializePermissions = async () => {
      try {
        await loadPersistedState();
        const currentState = await checkPermissions();
        setPermissionState(currentState);
        await persistPermissionState(currentState);
      } finally {
        setIsLoading(false);
      }
    };

    initializePermissions();

    // Set up app foreground permission check
    const subscription = Platform.OS === 'ios'
      ? Notifications.addNotificationReceivedListener(() => {
          handlePermissionChange();
        })
      : null;

    return () => {
      if (subscription) {
        Notifications.removeNotificationSubscription(subscription);
      }
    };
  }, [loadPersistedState, checkPermissions, persistPermissionState, handlePermissionChange]);

  /**
   * Opens system settings for the app
   * Platform-specific implementation for iOS and Android
   * @returns {Promise<void>} Promise that resolves when settings are opened
   */
  const openSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  }, []);

  return {
    permissionState,
    isLoading,
    requestPermissions,
    checkPermissions,
    openSettings,
    handlePermissionChange
  };
};

export default useNotificationPermissions;
