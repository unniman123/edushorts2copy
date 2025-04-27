import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { useNotificationPermissions } from '../hooks/useNotificationPermissions';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parse } from 'date-fns';

const NotificationSettingsScreen = () => {
  const {
    settings,
    isLoading,
    updateQuietHours,
    togglePushNotifications,
    toggleEmailNotifications,
    toggleInAppNotifications,
    resetSettings
  } = useNotificationSettings();

  const { permissionState, requestPermissions, openSettings } = useNotificationPermissions();

  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetSettings
        }
      ]
    );
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
    isStart: boolean
  ) => {
    if (Platform.OS === 'android') {
      setShowStartTime(false);
      setShowEndTime(false);
    }

    if (selectedDate) {
      const timeString = format(selectedDate, 'HH:mm');
      updateQuietHours({
        ...settings.quietHours,
        [isStart ? 'start' : 'end']: timeString
      });
    }
  };

  const handlePermissionRequest = async () => {
    if (permissionState?.canAskAgain) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Push notifications are required for this feature. Would you like to open settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
        );
      }
    } else {
      openSettings();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  const parseTimeString = (timeString: string) => {
    return parse(timeString, 'HH:mm', new Date());
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <View style={styles.setting}>
          <Text>Push Notifications</Text>
          <Switch
            value={settings.pushEnabled}
            onValueChange={togglePushNotifications}
            disabled={permissionState?.status !== 'granted'}
          />
        </View>
        {permissionState?.status !== 'granted' && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handlePermissionRequest}
          >
            <Text style={styles.permissionButtonText}>Enable Push Notifications</Text>
          </TouchableOpacity>
        )}
        <View style={styles.setting}>
          <Text>Email Notifications</Text>
          <Switch
            value={settings.emailEnabled}
            onValueChange={toggleEmailNotifications}
          />
        </View>
        <View style={styles.setting}>
          <Text>In-App Notifications</Text>
          <Switch
            value={settings.inAppEnabled}
            onValueChange={toggleInAppNotifications}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <View style={styles.setting}>
          <Text>Enable Quiet Hours</Text>
          <Switch
            value={settings.quietHours.enabled}
            onValueChange={(enabled) =>
              updateQuietHours({ ...settings.quietHours, enabled })
            }
          />
        </View>
        {settings.quietHours.enabled && (
          <>
            <TouchableOpacity
              style={styles.timeSetting}
              testID="start-time-button"
              onPress={() => setShowStartTime(true)}
            >
              <Text>Start Time</Text>
              <View style={styles.timeDisplay}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.timeText}>{settings.quietHours.start}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeSetting}
              testID="end-time-button"
              onPress={() => setShowEndTime(true)}
            >
              <Text>End Time</Text>
              <View style={styles.timeDisplay}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.timeText}>{settings.quietHours.end}</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {(showStartTime || showEndTime) && Platform.OS === 'ios' && (
        <View style={styles.timePickerContainer}>
          <DateTimePicker
            testID="timePicker"
            value={parseTimeString(
              showStartTime ? settings.quietHours.start : settings.quietHours.end
            )}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(event, date) =>
              handleTimeChange(event, date, showStartTime)
            }
          />
          <TouchableOpacity
            testID="done-button"
            style={styles.doneButton}
            onPress={() => {
              setShowStartTime(false);
              setShowEndTime(false);
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {(showStartTime || showEndTime) && Platform.OS === 'android' && (
        <DateTimePicker
          testID="timePicker"
          value={parseTimeString(
            showStartTime ? settings.quietHours.start : settings.quietHours.end
          )}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, date) => handleTimeChange(event, date, showStartTime)}
        />
      )}

      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetSettings}
      >
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  timeSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 8,
    color: '#666',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    paddingBottom: 16,
  },
  doneButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  resetButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  resetButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '500',
  },
  permissionButton: {
    margin: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationSettingsScreen;
