/**
 * useNotificationSettings - Custom hook for managing notification preferences and settings
 * 
 * Provides comprehensive notification settings management including category filters,
 * quiet hours, push/email/in-app preferences, and time-based delivery logic.
 * Handles persistent storage via AsyncStorage and provides utility functions for
 * determining notification delivery based on current settings and quiet hours.
 * 
 * @hook
 * @returns {UseNotificationSettingsReturn} Object containing settings state and management methods
 * 
 * @example
 * const { 
 *   settings, 
 *   isLoading, 
 *   togglePushNotifications, 
 *   updateQuietHours,
 *   shouldDeliverNotification 
 * } = useNotificationSettings();
 * 
 * // Check if notification should be delivered
 * if (shouldDeliverNotification('push')) {
 *   // Send push notification
 * }
 * 
 * // Update quiet hours
 * await updateQuietHours({
 *   enabled: true,
 *   start: '22:00',
 *   end: '07:00'
 * });
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Quiet hours configuration for notification scheduling
 * @interface QuietHours
 */
interface QuietHours {
  /** Whether quiet hours are enabled */
  enabled: boolean;
  /** Start time in HH:MM format (24-hour) */
  start: string;
  /** End time in HH:MM format (24-hour) */
  end: string;
}

/**
 * Complete notification settings configuration
 * @interface NotificationSettings
 */
interface NotificationSettings {
  /** Array of category IDs to receive notifications for */
  categories: string[];
  /** Quiet hours configuration */
  quietHours: QuietHours;
  /** Last synchronization timestamp */
  lastSyncTime: Date;
  /** Whether push notifications are enabled */
  pushEnabled: boolean;
  /** Whether email notifications are enabled */
  emailEnabled: boolean;
  /** Whether in-app notifications are enabled */
  inAppEnabled: boolean;
}

/**
 * Return type for useNotificationSettings hook
 * @interface UseNotificationSettingsReturn
 */
interface UseNotificationSettingsReturn {
  /** Current notification settings */
  settings: NotificationSettings;
  /** Loading state indicator */
  isLoading: boolean;
  /** Function to update quiet hours configuration */
  updateQuietHours: (quietHours: QuietHours) => Promise<void>;
  /** Function to update notification categories */
  updateCategories: (categories: string[]) => Promise<void>;
  /** Function to toggle push notifications */
  togglePushNotifications: () => Promise<void>;
  /** Function to toggle email notifications */
  toggleEmailNotifications: () => Promise<void>;
  /** Function to toggle in-app notifications */
  toggleInAppNotifications: () => Promise<void>;
  /** Function to reset all settings to defaults */
  resetSettings: () => Promise<void>;
  /** Function to check if current time is within quiet hours */
  isQuietTime: () => boolean;
  /** Function to determine if notification should be delivered */
  shouldDeliverNotification: (type: 'push' | 'email' | 'inApp') => boolean;
  /** Function to save custom settings */
  saveSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
}

/**
 * Default notification settings configuration
 * @constant {NotificationSettings}
 */
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

/**
 * AsyncStorage key for persisting notification settings
 * @constant {string}
 */
const STORAGE_KEY = '@notification_settings';

export const useNotificationSettings = (): UseNotificationSettingsReturn => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Loads notification settings from AsyncStorage
   * Restores persisted settings or uses defaults if none exist
   * @returns {Promise<void>} Promise that resolves when settings are loaded
   */
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

  /**
   * Saves notification settings to AsyncStorage
   * Merges new settings with existing ones and updates sync time
   * @param {Partial<NotificationSettings>} newSettings - Settings to update
   * @returns {Promise<void>} Promise that resolves when settings are saved
   * @throws {Error} When saving fails
   */
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

  /**
   * Updates quiet hours configuration
   * @param {QuietHours} quietHours - New quiet hours configuration
   * @returns {Promise<void>} Promise that resolves when update is complete
   */
  const updateQuietHours = useCallback(async (quietHours: QuietHours) => {
    await saveSettings({ quietHours });
  }, [saveSettings]);

  /**
   * Updates notification categories
   * @param {string[]} categories - Array of category IDs to receive notifications for
   * @returns {Promise<void>} Promise that resolves when update is complete
   */
  const updateCategories = useCallback(async (categories: string[]) => {
    await saveSettings({ categories });
  }, [saveSettings]);

  /**
   * Toggles push notification preference
   * @returns {Promise<void>} Promise that resolves when toggle is complete
   */
  const togglePushNotifications = useCallback(async () => {
    await saveSettings({ pushEnabled: !settings.pushEnabled });
  }, [settings.pushEnabled, saveSettings]);

  /**
   * Toggles email notification preference
   * @returns {Promise<void>} Promise that resolves when toggle is complete
   */
  const toggleEmailNotifications = useCallback(async () => {
    await saveSettings({ emailEnabled: !settings.emailEnabled });
  }, [settings.emailEnabled, saveSettings]);

  /**
   * Toggles in-app notification preference
   * @returns {Promise<void>} Promise that resolves when toggle is complete
   */
  const toggleInAppNotifications = useCallback(async () => {
    await saveSettings({ inAppEnabled: !settings.inAppEnabled });
  }, [settings.inAppEnabled, saveSettings]);

  /**
   * Resets all settings to default values
   * Clears AsyncStorage and restores default configuration
   * @returns {Promise<void>} Promise that resolves when reset is complete
   * @throws {Error} When reset fails
   */
  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset notification settings:', error);
      throw error;
    }
  }, []);

  /**
   * Checks if current time is within configured quiet hours
   * Handles quiet hours that span midnight (e.g., 22:00 to 07:00)
   * @returns {boolean} True if currently within quiet hours
   */
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

  /**
   * Determines if a notification should be delivered based on type and current settings
   * Considers quiet hours and individual notification type preferences
   * @param {'push' | 'email' | 'inApp'} type - Type of notification to check
   * @returns {boolean} True if notification should be delivered
   */
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
  }, []);

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
