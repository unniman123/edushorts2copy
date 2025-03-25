# Deep Linking Implementation Guide

## Overview
This document describes how deep linking works in the Edushorts app for authentication flows.

## URL Schemes
The app responds to the following URL schemes:
- `edushorts://` (Production)
- `exp://localhost:19000` (Development)
- `https://edushorts.app.link` (Web)

## Authentication Deep Links

### 1. Email Confirmation
When a user signs up, they receive an email with a confirmation link:
```
edushorts://auth/confirm?token=<token>
```

Development URL:
```
exp://localhost:19000/--/auth/confirm?token=<token>
```

### 2. Password Reset
When a user requests a password reset:
```
edushorts://auth/reset-password?token=<token>
```

Development URL:
```
exp://localhost:19000/--/auth/reset-password?token=<token>
```

## Testing Deep Links

### Development Testing

1. **Email Confirmation:**
```bash
# iOS Simulator
xcrun simctl openurl booted "exp://localhost:19000/--/auth/confirm?token=test-token"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "exp://localhost:19000/--/auth/confirm?token=test-token"
```

2. **Password Reset:**
```bash
# iOS Simulator
xcrun simctl openurl booted "exp://localhost:19000/--/auth/reset-password?token=test-token"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "exp://localhost:19000/--/auth/reset-password?token=test-token"
```

### Expo Testing
You can also test using the Expo CLI:
```bash
expo url edushorts://auth/confirm?token=test-token
expo url edushorts://auth/reset-password?token=test-token
```

## Production Configuration

When publishing the app:
1. Update `app.config.js` scheme to match your production URL
2. Configure associated domains in Xcode for iOS universal links
3. Update Android App Links in your `AndroidManifest.xml`
4. Update Supabase configuration with production URLs

## Rollback Process
If issues occur with deep linking:

1. Use the rollback script:
```bash
./scripts/rollback/rollback.sh
```

2. Reset Supabase configuration using MCP server:
```typescript
send_management_api_request({
  method: 'PATCH',
  path: '/v1/projects/{ref}/config/auth',
  request_body: {
    // Original settings from backup
  }
});
```

## Debugging Tips

1. **Log Deep Link Handling:**
```typescript
Linking.addEventListener('url', ({ url }) => {
  console.log('Deep link received:', url);
});
```

2. **Check URL Parsing:**
```typescript
const url = Linking.parse(linkingUrl);
console.log('Parsed URL:', url);
```

3. **Verify Supabase Settings:**
```typescript
const { data } = await supabase.auth.getSettings();
console.log('Auth settings:', data);
```

## Development Mode Testing Workflow

1. **Start the Development Server:**
```bash
expo start
```

2. **Test Email Confirmation:**
   - Create a new account
   - Copy the email confirmation URL from the console
   - Use one of these methods:
     - Click the link on your mobile device
     - Use `expo url` command
     - Use platform-specific commands (adb/xcrun)

3. **Test Password Reset:**
   - Request password reset
   - Copy the reset URL from the console
   - Test using the same methods as above

4. **Common Issues:**
   - Make sure Expo development server is running
   - Check if the correct development URL is being used
   - Verify URL scheme in app.config.js is correct
   - Ensure all required packages are installed:
     ```bash
     expo install expo-linking
     expo install expo-web-browser
     ```

5. **Live Reload:**
The development server will automatically reload when you:
   - Change deep linking configuration
   - Update navigation settings
   - Modify auth-related screens

Remember to test both success and failure scenarios for each authentication flow.
