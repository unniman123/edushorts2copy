# FCM Integration Documentation

## Overview
This document tracks the implementation of Firebase Cloud Messaging (FCM) in our Expo app, while maintaining our existing Supabase notification infrastructure.

## Architecture
- **Token Management**: FCM tokens stored alongside Expo tokens in Supabase profiles
- **Notification Delivery**: Firebase Console for sending notifications
- **Storage**: Maintaining Supabase for notification history and tracking
- **Deep Linking**: Using existing deep link handling infrastructure

## Implementation Steps

### 1. Configuration & Dependencies
```bash
# Install required packages
npx expo install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. App Configuration Updates
In app.config.js:
```js
{
  plugins: [
    ...existing,
    '@react-native-firebase/messaging',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: "static",
          infoPlist: {
            UIBackgroundModes: ["remote-notification"]
          }
        }
      }
    ]
  ],
  ios: {
    entitlements: {
      "aps-environment": "development" // Change to "production" for release
    }
  }
}
```

### 3. Firebase Console Setup
1. Navigate to Firebase Console > Project Settings
2. Verify Android configuration:
   - Package name matches app.json
   - SHA-1 certificate added if needed
3. iOS configuration:
   - Bundle ID matches app.json
   - Upload APNs key
4. Cloud Messaging setup:
   - Enable Cloud Messaging API
   - Configure notification channels if needed

### 4. Code Changes

#### NotificationService.ts
- FCM token registration
- Token refresh handling
- Message handling (foreground/background)
- Integration with existing Supabase storage

#### App.tsx / index.js
- FCM initialization
- Background message handler setup
- Deep link handling for FCM notifications

### 5. Testing Procedure

#### Token Generation
1. Install app on physical device
2. Check FCM token generation
3. Verify token storage in Supabase
4. Test token refresh scenarios

#### Notification Reception
1. Send test notification from Firebase Console
2. Check reception in:
   - Foreground state
   - Background state
   - App terminated state
3. Verify notification storage in Supabase
4. Test deep link functionality

### 6. Troubleshooting Guide

#### iOS Issues
- APNs setup required
- Physical device needed for testing
- Check entitlements configuration

#### Android Issues
- Verify google-services.json
- Check notification channels
- Test on both emulator and physical device

### 7. Usage Guide

#### Sending Notifications via Firebase Console
1. Navigate to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Configure notification:
   - Title and body
   - Target users (by FCM token or topic)
   - Add data payload if needed
   - Schedule or send immediately

#### Best Practices
1. Always include notification title and body
2. Use data payload for deep linking
3. Test on both platforms before production
4. Monitor delivery rates in Firebase Console

### 8. Maintenance Notes
- Keep FCM tokens updated in Supabase
- Monitor token refresh events
- Track notification delivery status
- Regular testing of all notification paths

## Success Criteria
- [ ] FCM token generation working
- [ ] Token storage in Supabase successful
- [ ] Foreground notifications received
- [ ] Background notifications received
- [ ] Deep links functional
- [ ] Notification history maintained
- [ ] No conflicts with existing Expo notifications
