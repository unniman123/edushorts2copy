import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase'; // Assuming supabase client is exported from here
import { useEffect, useRef, useState } from 'react';
import { Subscription } from 'expo-notifications'; // Corrected import

// Basic structure for the push notification hook

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (!Device.isDevice) {
      alert('Must use physical device for Push Notifications');
      return;
    }

    // --- Permission Request Logic (Step 3) ---
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      // Ask the user for permission
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      // Handle permission denied case (e.g., show an alert, disable features)
      // You might want to store this preference locally or in the user's profile
      console.log('Push notification permission denied!');
      alert('Failed to get push token for push notification! Permission not granted.');
      return; // Exit if permission is not granted
    }
    console.log('Push notification permission granted.');
    // --- End Permission Request Logic ---

    // --- Token Retrieval & Storage Logic (Step 4) will go here ---

    // --- Android Specific Channel Setup (Optional but recommended) ---
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token; // Will return the actual token later
  }

  useEffect(() => {
    // --- Call registration function ---
    // registerForPushNotificationsAsync().then(token => setExpoPushToken(token)); // We'll enable this later

    // --- Setup Notification Handlers (Step 6) ---
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification Received (Foreground):', notification);
      // Add any foreground handling logic here
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response Received:', response);
      const data = response.notification.request.content.data;
      // Add navigation or other logic based on notification data
      if (data?.url) {
        // Example: Navigate to a specific screen or URL
        // Linking.openURL(data.url);
      }
    });

    // --- Cleanup listeners on unmount ---
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  // --- Return values/functions needed by components ---
  return {
    expoPushToken,
    notification,
    // Potentially expose register function if needed manually
    // registerForPushNotificationsAsync
  };
}

// --- Foreground Notification Handler Setup (Step 6) ---
// Determines how foreground notifications are handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show alert even if app is foreground
    shouldPlaySound: true, // Play sound
    shouldSetBadge: false, // Control badge count
  }),
});
