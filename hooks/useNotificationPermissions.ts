import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import * as Device from 'expo-device';

export interface PermissionState {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
  lastChecked: Date;
}

const PERMISSION_STORAGE_KEY = '@notification_permissions';

export const useNotificationPermissions = () => {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistPermissionState = useCallback(async (state: PermissionState) => {
    try {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist permission state:', error);
    }
  }, []);

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

  const handlePermissionChange = useCallback(async () => {
    const currentState = await checkPermissions();
    setPermissionState(currentState);
    await persistPermissionState(currentState);
  }, [checkPermissions, persistPermissionState]);

  useEffect(() => {
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
