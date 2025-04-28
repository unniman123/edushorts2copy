# React Native App Setup and Testing Plan

## 1. Build and Run App
```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

## 2. Verify Basic Configuration
- [x] expo-notifications plugin configured in app.json
- [x] Proper project ID set in constants/config.ts
- [x] Required dependencies installed in package.json

## 3. Test Notification Permission Flow

### A. Initial Launch
1. Install app on physical device (required for push notifications)
2. Complete user registration/login
3. Notification permission prompt should appear automatically via NotificationContext

### B. Expected Database Updates
```sql
-- Check profiles table after permission granted
SELECT notification_preferences->>'expo_push_token' as token 
FROM profiles 
WHERE id = 'your_user_id';

-- Verify token stored in notifications table
SELECT expo_push_token 
FROM notifications 
WHERE created_by = 'your_user_id' 
ORDER BY created_at DESC LIMIT 1;
```

## 4. Integration Testing Steps

### A. Permission Grant Flow
1. Launch app for first time
2. Login with test user
3. Verify permission prompt appears
4. Accept notification permissions
5. Check Supabase for token storage

### B. Token Storage Verification
1. Open app and login
2. Check NotificationService logs for token registration
3. Verify token in Supabase profiles table
4. Confirm token in notifications table

### C. Admin Panel Testing
1. Get user's expo_push_token from database
2. Send test notification from admin panel
3. Verify notification appears on device
4. Check notification record in database

## 5. Common Issues & Solutions

### A. Token Not Storing
- Check NotificationService error logs
- Verify Supabase connection
- Ensure user is properly authenticated

### B. Permission Prompt Not Showing
- Check NotificationContext useEffect triggers
- Verify physical device is being used
- Check expo-notifications setup

### C. Database Updates Failing
- Verify profile record exists
- Check notification_preferences schema
- Validate token format

## 6. Testing Checklist
- [ ] App builds and runs successfully
- [ ] Permission prompt appears
- [ ] Token stored in profiles table
- [ ] Token stored in notifications table
- [ ] Test notification received
- [ ] Deep links working
- [ ] Background notifications working

## Next Steps
1. Build and run app on physical device
2. Complete registration/login
3. Accept notification permissions
4. Verify token storage in database
5. Test notification from admin panel