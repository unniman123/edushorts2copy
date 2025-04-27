import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface NotificationSettings {
  categories: string[];
  quietHours: QuietHours;
  lastSyncTime: Date;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  categories: [],
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  lastSyncTime: new Date(),
  pushEnabled: true,
  emailEnabled: true,
  inAppEnabled: true
};

const STORAGE_KEY = '@notification_settings';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        parsed.lastSyncTime = new Date(parsed.lastSyncTime);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
        lastSyncTime: new Date()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }, [settings]);

  const updateQuietHours = useCallback(async (quietHours: QuietHours) => {
    await saveSettings({ quietHours });
  }, [saveSettings]);

  const updateCategories = useCallback(async (categories: string[]) => {
    await saveSettings({ categories });
  }, [saveSettings]);

  const togglePushNotifications = useCallback(async () => {
    await saveSettings({ pushEnabled: !settings.pushEnabled });
  }, [settings.pushEnabled, saveSettings]);

  const toggleEmailNotifications = useCallback(async () => {
    await saveSettings({ emailEnabled: !settings.emailEnabled });
  }, [settings.emailEnabled, saveSettings]);

  const toggleInAppNotifications = useCallback(async () => {
    await saveSettings({ inAppEnabled: !settings.inAppEnabled });
  }, [settings.inAppEnabled, saveSettings]);

  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset notification settings:', error);
      throw error;
    }
  }, []);

  const isQuietTime = useCallback(() => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const start = settings.quietHours.start;
    const end = settings.quietHours.end;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Handle case where quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }, [settings.quietHours]);

  const shouldDeliverNotification = useCallback((type: 'push' | 'email' | 'inApp') => {
    if (isQuietTime()) return false;

    switch (type) {
      case 'push':
        return settings.pushEnabled;
      case 'email':
        return settings.emailEnabled;
      case 'inApp':
        return settings.inAppEnabled;
      default:
        return true;
    }
  }, [settings, isQuietTime]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    updateQuietHours,
    updateCategories,
    togglePushNotifications,
    toggleEmailNotifications,
    toggleInAppNotifications,
    resetSettings,
    isQuietTime,
    shouldDeliverNotification,
    saveSettings
  };
};

export type { NotificationSettings, QuietHours };
