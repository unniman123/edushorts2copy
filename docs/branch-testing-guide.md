# Branch.io Deep Linking Testing Guide

## Setup

1. Make sure you have the required dependencies installed:
   ```bash
   npm install
   ```

2. Ensure you have either:
   - Android Studio and an emulator/device for Android testing
   - Xcode and a simulator for iOS testing

3. Set up your Branch.io dashboard:
   - Configure Branch keys in `.env` file
   - Set up test links in Branch dashboard
   - Configure domains in app.config.js

## Running Tests

### Android Testing
```bash
# Run all Android deep link tests
npm run test:deeplinks:android

# Or run script directly
./scripts/test-branch-links.sh android
```

### iOS Testing
```bash
# Run all iOS deep link tests
npm run test:deeplinks:ios

# Or run script directly
./scripts/test-branch-links.sh ios
```

## Manual Testing Steps

1. Cold Start Test:
   - Close the app completely
   - Click a Branch link
   - Verify app opens and navigates to correct screen

2. Warm Start Test:
   - Put app in background
   - Click a Branch link
   - Verify app opens and navigates correctly

3. Deferred Deep Linking:
   - Uninstall the app
   - Click a Branch link
   - Install the app
   - Verify correct navigation on first launch

4. Content Testing:
   - Test sharing from app
   - Verify shared links open correctly
   - Check all content attributes are passed

## Debugging Tips

1. Enable debug mode in Branch dashboard

2. Check console logs for:
   ```
   BranchSDK: Branch SDK starting
   BranchSDK: deep link data
   ```

3. Verify domain association files:
   - Android: `/.well-known/assetlinks.json`
   - iOS: `/.well-known/apple-app-site-association`

4. Common Issues:
   - Missing or incorrect Branch key
   - Incorrect domain configuration
   - Missing intent filters
   - Improper deep link handling

## Test Data

Sample test articles:
```json
{
  "articleId": "test-article-123",
  "title": "Test Article",
  "category": "Technology"
}
```

Test deep links:
```
https://lh1wg.app.link/article/test-article-123
edushort://article/test-article-123
```

## Continuous Integration

The deep link tests can be integrated into your CI/CD pipeline:

```yaml
- name: Test Deep Links
  run: |
    npm run test:deeplinks:android
    npm run test:deeplinks:ios
```

## Related Documentation

- [Branch.io Setup Guide](./branch.io.documentation.md)
- [Deep Linking Implementation](./deep-linking.md)
- [Testing Script Details](./test-branch-links.sh)
