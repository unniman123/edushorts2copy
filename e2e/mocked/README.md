# Mocked E2E Testing

This directory contains a simplified approach to E2E testing that doesn't require Android SDK or physical devices/emulators, making it ideal for quick testing and CI/CD environments.

## Overview

Instead of running tests on actual devices or emulators (which can be resource-intensive and require specific setup), these tests use `@testing-library/react-native` to:

1. Mock key components and screens
2. Simulate user interactions
3. Verify navigation flows and state changes
4. Test important user journeys

## Benefits

- **No Android SDK required**: Run tests without setting up the Android development environment
- **Fast execution**: Tests run quickly without emulator startup time
- **Simple setup**: Uses existing Jest and Testing Library dependencies
- **CI/CD friendly**: Easy to run in continuous integration environments
- **Reliable**: Less prone to flakiness than actual device tests

## Test Structure

- `app.test.js`: Basic authentication and article interaction flow tests
- `navigation.test.js`: Tests for navigation between screens and tabs
- `setup.js`: Mocks for React Native modules and services
- `jest.config.js`: Jest configuration for the mocked tests

## Running Tests

Run all mocked E2E tests:

```bash
npm run test:e2e:mocked
```

Run a specific test file:

```bash
npx jest e2e/mocked/app.test.js --config e2e/mocked/jest.config.js
```

## Test Coverage

These tests cover:

- **Authentication**: Login, registration and password reset flows
- **Navigation**: Tab navigation and screen transitions
- **Content Viewing**: Article listing, detail views, and interactions
- **User Settings**: Profile and settings screens

## Limitations

While these tests are convenient, they do have limitations:

- They don't test actual rendering on device
- They don't test native module integrations fully
- They use mocked services rather than actual API calls
- They don't test device-specific features (camera, notifications, etc.)

For complete test coverage, these tests should be used alongside actual device testing when possible.

## Writing New Tests

To add new tests:

1. Create a new test file in this directory
2. Import required components from React Native and Testing Library
3. Mock the relevant components/screens
4. Write test cases that simulate user interactions
5. Run the tests to verify

Example test structure:

```javascript
const { render, fireEvent } = require('@testing-library/react-native');
const React = require('react');
const { View, Text } = require('react-native');

describe('My Feature Test', () => {
  // Mock component
  const MyComponent = ({ onPress }) => (
    <View testID="my-component">
      <Text>Press Me</Text>
    </View>
  );

  it('should respond to user interaction', () => {
    const mockFunction = jest.fn();
    const { getByTestId } = render(<MyComponent onPress={mockFunction} />);
    
    fireEvent.press(getByTestId('my-component'));
    
    expect(mockFunction).toHaveBeenCalled();
  });
}); 