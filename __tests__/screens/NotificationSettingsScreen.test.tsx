import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert, Platform, View } from 'react-native';
import NotificationSettingsScreen from '../../screens/NotificationSettingsScreen';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { useNotificationPermissions } from '../../hooks/useNotificationPermissions';

// Mock the hooks
jest.mock('../../hooks/useNotificationSettings');
jest.mock('../../hooks/useNotificationPermissions');

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const MockTimePicker = ({ testID, onChange }: any) => {
    const handleChange = () => {
      const now = new Date();
      onChange({ type: 'set', nativeEvent: { timestamp: now.getTime() } }, now);
    };
    return <View testID={testID} onTouchEnd={handleChange} />;
  };
  return MockTimePicker;
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('NotificationSettingsScreen', () => {
  const mockSettings = {
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    pushEnabled: true,
    emailEnabled: true,
    inAppEnabled: true,
  };

  const mockPermissionState = {
    status: 'granted',
    canAskAgain: true,
  };

  const mockFunctions = {
    updateQuietHours: jest.fn(),
    togglePushNotifications: jest.fn(),
    toggleEmailNotifications: jest.fn(),
    toggleInAppNotifications: jest.fn(),
    resetSettings: jest.fn(),
    requestPermissions: jest.fn(),
    openSettings: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotificationSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      isLoading: false,
      ...mockFunctions,
    });
    (useNotificationPermissions as jest.Mock).mockReturnValue({
      permissionState: mockPermissionState,
      requestPermissions: mockFunctions.requestPermissions,
      openSettings: mockFunctions.openSettings,
    });
  });

  it('renders all notification type settings', () => {
    const { getByText } = render(<NotificationSettingsScreen />);

    expect(getByText('Push Notifications')).toBeTruthy();
    expect(getByText('Email Notifications')).toBeTruthy();
    expect(getByText('In-App Notifications')).toBeTruthy();
  });

  it('handles toggling notification settings', () => {
    const { getByText } = render(<NotificationSettingsScreen />);

    const pushSwitch = getByText('Push Notifications').parent;
    if (pushSwitch) {
      fireEvent(pushSwitch, 'onValueChange', false);
    }
    expect(mockFunctions.togglePushNotifications).toHaveBeenCalled();

    const emailSwitch = getByText('Email Notifications').parent;
    if (emailSwitch) {
      fireEvent(emailSwitch, 'onValueChange', false);
    }
    expect(mockFunctions.toggleEmailNotifications).toHaveBeenCalled();

    const inAppSwitch = getByText('In-App Notifications').parent;
    if (inAppSwitch) {
      fireEvent(inAppSwitch, 'onValueChange', false);
    }
    expect(mockFunctions.toggleInAppNotifications).toHaveBeenCalled();
  });

  it('handles enabling quiet hours', () => {
    const { getByText } = render(<NotificationSettingsScreen />);

    const quietHoursSwitch = getByText('Enable Quiet Hours').parent;
    if (quietHoursSwitch) {
      fireEvent(quietHoursSwitch, 'onValueChange', true);
    }
    expect(mockFunctions.updateQuietHours).toHaveBeenCalledWith({
      enabled: true,
      start: mockSettings.quietHours.start,
      end: mockSettings.quietHours.end,
    });
  });

  it('shows time picker when quiet hours are enabled', () => {
    (useNotificationSettings as jest.Mock).mockReturnValue({
      settings: {
        ...mockSettings,
        quietHours: { ...mockSettings.quietHours, enabled: true },
      },
      isLoading: false,
      ...mockFunctions,
    });

    const { getByText } = render(<NotificationSettingsScreen />);

    expect(getByText('Start Time')).toBeTruthy();
    expect(getByText('End Time')).toBeTruthy();
  });

  it('handles resetting settings', () => {
    const mockAlert = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<NotificationSettingsScreen />);

    fireEvent.press(getByText('Reset to Defaults'));

    expect(mockAlert).toHaveBeenCalledWith(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to default?',
      expect.any(Array)
    );

    // Simulate confirming reset
    const resetButton = mockAlert.mock.calls[0][2];
    if (resetButton && resetButton[1] && resetButton[1].onPress) {
      resetButton[1].onPress();
    }
    expect(mockFunctions.resetSettings).toHaveBeenCalled();
  });

  it('shows permission request button when permissions are not granted', () => {
    (useNotificationPermissions as jest.Mock).mockReturnValue({
      permissionState: { status: 'denied', canAskAgain: true },
      requestPermissions: mockFunctions.requestPermissions,
      openSettings: mockFunctions.openSettings,
    });

    const { getByText } = render(<NotificationSettingsScreen />);
    const button = getByText('Enable Push Notifications');
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(mockFunctions.requestPermissions).toHaveBeenCalled();
  });

  it('opens settings when permissions cannot be requested again', async () => {
    (useNotificationPermissions as jest.Mock).mockReturnValue({
      permissionState: { status: 'denied', canAskAgain: false },
      requestPermissions: mockFunctions.requestPermissions,
      openSettings: mockFunctions.openSettings,
    });

    const { getByText } = render(<NotificationSettingsScreen />);
    const button = getByText('Enable Push Notifications');
    
    await act(async () => {
      fireEvent.press(button);
    });

    expect(mockFunctions.openSettings).toHaveBeenCalled();
  });

  describe('Platform specific behavior', () => {
    const originalPlatform = Platform.OS;

    afterAll(() => {
      Platform.OS = originalPlatform;
    });

    it('renders iOS time pickers correctly', () => {
      Platform.OS = 'ios';
      (useNotificationSettings as jest.Mock).mockReturnValue({
        settings: {
          ...mockSettings,
          quietHours: { ...mockSettings.quietHours, enabled: true },
        },
        isLoading: false,
        ...mockFunctions,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);
      
      // Test start time picker
      fireEvent.press(getByTestId('start-time-button'));
      expect(getByTestId('timePicker')).toBeTruthy();
      
      // Test end time picker
      fireEvent.press(getByTestId('end-time-button'));
      expect(getByTestId('timePicker')).toBeTruthy();
    });

    it('renders Android time pickers correctly', () => {
      Platform.OS = 'android';
      (useNotificationSettings as jest.Mock).mockReturnValue({
        settings: {
          ...mockSettings,
          quietHours: { ...mockSettings.quietHours, enabled: true },
        },
        isLoading: false,
        ...mockFunctions,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);
      
      // Test start time picker
      fireEvent.press(getByTestId('start-time-button'));
      expect(getByTestId('timePicker')).toBeTruthy();
      
      // Test end time picker
      fireEvent.press(getByTestId('end-time-button'));
      expect(getByTestId('timePicker')).toBeTruthy();
    });

    it('handles time selection and done button correctly', () => {
      Platform.OS = 'ios';
      (useNotificationSettings as jest.Mock).mockReturnValue({
        settings: {
          ...mockSettings,
          quietHours: { ...mockSettings.quietHours, enabled: true },
        },
        isLoading: false,
        ...mockFunctions,
      });

      const { getByTestId } = render(<NotificationSettingsScreen />);

      // Test start time selection
      fireEvent.press(getByTestId('start-time-button'));
      const timePicker = getByTestId('timePicker');
      fireEvent(timePicker, 'onTouchEnd');
      expect(mockFunctions.updateQuietHours).toHaveBeenCalled();

      // Test end time selection
      fireEvent.press(getByTestId('end-time-button'));
      const endTimePicker = getByTestId('timePicker');
      fireEvent(endTimePicker, 'onTouchEnd');
      expect(mockFunctions.updateQuietHours).toHaveBeenCalledTimes(2);

      // Test done button closes the picker
      const doneButton = getByTestId('done-button');
      fireEvent.press(doneButton);

      // Verify that the time picker is closed by checking that it's not in the document
      expect(() => getByTestId('timePicker')).toThrow();
    });
  });
});
