# FCM Implementation Notes

## Changes Made

### 1. Dependencies Added
- @react-native-firebase/app
- @react-native-firebase/messaging

### 2. Configuration Files Modified

#### app.config.js
- Added @react-native-firebase/messaging plugin
- Added iOS background mode for notifications
- Added FirebaseAppDelegateProxyEnabled: false
- Added iOS push notification entitlements

### 3. Files Modified

#### src/types/notification.ts
```typescript
// Updated NotificationPreferences interface
export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  expo_push_token?: string;  // Made optional
  fcm_token?: string;        // Made optional
  push_enabled: boolean;
  subscriptions: string[];
}
```

#### services/NotificationService.ts
- Added FCM token registration
- Added token refresh handling
- Updated token storage to handle both FCM and Expo tokens
- Integrated with existing Supabase storage

#### App.tsx
- Added FCM import
- Added background message handler
- Integrated with existing NotificationBridge

### 4. Integration Points

1. **Token Management**
   - FCM token generated and stored alongside Expo token
   - Both tokens stored in Supabase profiles table
   - Token refresh handled automatically

2. **Notification Handling**
   - Background messages handled by FCM handler
   - Foreground messages handled by existing NotificationBridge
   - All notifications stored in Supabase for history

3. **Deep Linking**
   - Existing deep link handling maintained
   - FCM deep links processed through same system

## Testing Steps

1. **Token Registration**
   ```bash
   # Check FCM token in device logs
   adb logcat | grep -i "FCM"
   
   # Query Supabase for stored tokens
   select notification_preferences->>'fcm_token' from profiles;
   ```

2. **Send Test Notification**
   - Use Firebase Console > Cloud Messaging
   - Select target device using FCM token
   - Include deep link in data payload if needed

3. **Verify Storage**
   ```sql
   -- Check notifications table
   select * from notifications 
   where created_at > now() - interval '1 hour'
   order by created_at desc;
   ```

## Troubleshooting

1. **iOS Issues**
   - Verify APNs setup in Firebase Console
   - Check entitlements in Xcode
   - Test on physical device (simulator doesn't support FCM)

2. **Android Issues**
   - Verify google-services.json is up to date
   - Check Android notification channel setup
   - Monitor logcat for FCM-related errors

## Firebase Console Setup

1. Project Settings
   - Verify Android package name
   - Verify iOS bundle ID
   - Upload APNs key (for iOS)

2. Cloud Messaging
   - Configure default notification channel (Android)
   - Test notification sending through console
   - Monitor delivery reports

## Notes

1. **Dual Token Strategy**
   - Keep both FCM and Expo tokens
   - Allows for fallback if needed
   - Ensures backward compatibility

2. **Database Structure**
   - No schema changes needed
   - Using existing notification_preferences JSONB field
   - Using existing notifications table

3. **Testing Guidelines**
   - Test in all app states (foreground/background/killed)
   - Test deep linking through notifications
   - Verify notification storage and history
   - Test token refresh scenarios

## Future Considerations

1. **Monitoring**
   - Add FCM-specific metrics to monitoring
   - Track delivery success rates
   - Monitor token refresh rates

2. **Performance**
   - Monitor notification delivery times
   - Track background handler execution
   - Watch for any impact on app startup

3. **Cleanup**
   - Consider phasing out Expo notifications
   - Clean up unused Expo tokens
   - Consolidate notification code
