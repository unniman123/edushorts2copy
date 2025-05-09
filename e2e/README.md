# E2E Testing for EduShorts

This directory contains end-to-end (E2E) tests for the EduShorts application. These tests verify that the app works correctly from a user's perspective by simulating real user interactions.

## Testing Frameworks

We use two complementary testing frameworks:

1. **Detox** - For comprehensive E2E testing with JavaScript
2. **Maestro** - For simpler YAML-based flows

## Prerequisites

- Node.js and npm
- iOS Simulator (for iOS tests)
- Android Emulator (for Android tests)
- Xcode (for iOS)
- Android Studio (for Android)

## Setup

### Detox Setup

1. Install Detox CLI globally:
   ```bash
   npm install -g detox-cli
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. For iOS, make sure you have:
   - Xcode installed
   - iOS simulator

4. For Android, make sure you have:
   - Android Studio installed
   - An Android emulator created (preferably Pixel 4 with API 30)
   - ANDROID_SDK_ROOT environment variable set

### Maestro Setup

**Note:** Maestro is not an npm package. It's a standalone tool that needs to be installed separately from this project's dependencies.

1. Install Maestro using its dedicated installer:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. Add Maestro to your PATH (may be done automatically by installer)
   ```bash
   # Check if Maestro is installed correctly
   maestro --version
   ```

## Running Tests

### Detox Tests

1. Build the app for E2E testing:

   For iOS:
   ```bash
   npm run test:e2e:build
   ```

   For Android:
   ```bash
   npm run test:e2e:build:android
   ```

2. Run the tests:

   For iOS:
   ```bash
   npm run test:e2e
   ```

   For Android:
   ```bash
   npm run test:e2e:android
   ```

3. To run specific test files:
   ```bash
   detox test -c ios.sim.debug e2e/tests/authentication.e2e.js
   ```

### Maestro Tests

1. Build and install the app on a connected device or emulator:
   ```bash
   npm run android  # For Android
   # OR
   npm run ios      # For iOS
   ```

2. Run a Maestro flow:
   ```bash
   maestro test e2e/maestro/login.yaml
   ```

3. To run all Maestro flows:
   ```bash
   maestro test e2e/maestro/
   ```

## Test Structure

### Detox Tests

- `e2e/tests/authentication.e2e.js` - Tests for login, registration, and authentication flows
- `e2e/tests/navigation.e2e.js` - Tests for navigation between screens
- `e2e/tests/edge-cases.e2e.js` - Tests for offline mode, error states, and recovery
- `e2e/tests/performance.e2e.js` - Tests measuring app performance

### Maestro Flows

- `e2e/maestro/login.yaml` - Basic login flow
- `e2e/maestro/navigation.yaml` - Navigation between app screens
- `e2e/maestro/article_interaction.yaml` - Article viewing and bookmarking

## Test Utilities

Common testing utilities are available in:
- `e2e/utils/testUtils.js`

These include helper functions for:
- Waiting for elements
- Logging in/out
- Navigation
- Network condition simulation

## Device Coverage

We test on:
1. iOS: iPhone 14 simulator (latest iOS)
2. Android: Pixel 4 emulator (API 30)

For production releases, we should test on a wider range of devices.

## CI Integration

The tests are integrated with our CI pipeline:

1. The E2E tests run automatically on every pull request
2. Full E2E test suite runs before each release
3. Results are reported to our CI dashboard

## Troubleshooting

1. **Tests failing due to timeouts**:
   - Increase timeout values in test files
   - Ensure emulators have sufficient resources

2. **Element not found errors**:
   - Check if element IDs have changed in the app
   - Verify that the test is waiting for animations to complete

3. **Android build issues**:
   - Ensure ANDROID_SDK_ROOT is set correctly
   - Check that the emulator is running

4. **iOS build issues**:
   - Ensure Xcode is set up correctly
   - Verify that the iOS simulator is available

5. **Maestro installation issues**:
   - Maestro is not included in npm dependencies
   - Follow the separate installation instructions at https://maestro.mobile.dev/
   - Check if Maestro is in your PATH by running `maestro --version`

## Best Practices

1. Keep tests independent - each test should work in isolation
2. Clean up after tests - logout, clear data when appropriate
3. Use test IDs for elements instead of text or other properties
4. Handle both success and error states
5. Test edge cases (offline, timeout, errors)
6. Keep test code clean and maintainable
7. Run tests on multiple devices when possible 