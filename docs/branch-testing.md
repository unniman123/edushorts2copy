# Testing Branch.io Deep Links

This guide explains how to test Branch.io deep linking functionality in the EduShorts app.

## Prerequisites

1. Make sure you have the app installed on your device
2. Have access to the Branch.io dashboard
3. Have adb (Android Debug Bridge) installed for Android testing

## Testing Methods

### 1. Test via Branch.io Dashboard

1. Go to the Branch.io dashboard
2. Navigate to Test > Quick Links
3. Create a new link with the following parameters:
   - Link data:
     ```json
     {
       "$canonical_identifier": "news_[ARTICLE_ID]",
       "news_id": "[ARTICLE_ID]",
       "category": "[CATEGORY_NAME]"
     }
     ```
4. Click "Create Link" and use the generated link

### 2. Test via ADB (Android)

```bash
# Test with Branch.io link
adb shell am start -a android.intent.action.VIEW -d "https://lh1wg.app.link/news/[ARTICLE_ID]"

# Test with custom scheme
adb shell am start -a android.intent.action.VIEW -d "edushort://article/[ARTICLE_ID]"
```

### 3. Test via Simulator/Emulator

1. Open the app in simulator/emulator
2. Use the following commands in terminal:

```bash
# iOS Simulator
xcrun simctl openurl booted "https://lh1wg.app.link/news/[ARTICLE_ID]"

# Android Emulator
adb shell am start -a android.intent.action.VIEW -d "https://lh1wg.app.link/news/[ARTICLE_ID]"
```

## Expected Behavior

1. When clicking a Branch link:
   - If app is installed: Opens app and navigates to article
   - If app is not installed: Opens Play Store/App Store

2. When using custom scheme:
   - Opens app and navigates to article
   - Works only if app is installed

## Debugging

1. Enable debug logging in Branch dashboard
2. Check console logs for "BranchError" or "BranchSuccess" tags
3. Verify intent filters in AndroidManifest.xml
4. Check Branch dashboard's Live View for link clicks

## Common Issues

1. Links not opening app:
   - Verify domain association files
   - Check app's package name/bundle ID
   - Ensure Branch keys are correct

2. Deep linking not working:
   - Check navigation setup
   - Verify Branch initialization
   - Ensure proper handling in App.tsx

3. App not receiving link data:
   - Check Branch link configuration
   - Verify handleBranchDeepLink implementation
   - Enable debug mode in Branch SDK

## Testing Checklist

- [ ] Cold start (app not running)
- [ ] Warm start (app in background)
- [ ] Hot start (app in foreground)
- [ ] Branch.io links
- [ ] Custom scheme links
- [ ] Link with article ID
- [ ] Link with category
- [ ] Deferred deep linking (app not installed)
