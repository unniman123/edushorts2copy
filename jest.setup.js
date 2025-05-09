import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';
import { NativeModules } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
  setNotificationChannelAsync: jest.fn(),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock expo-constants with a valid Supabase URL
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://mock-supabase-url-from-jest-setup',
      supabaseAnonKey: 'mock-supabase-anon-key',
    },
  },
}));

// Mock react-native PixelRatio
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  get: jest.fn(() => 2),
  roundToNearestPixel: jest.fn(dim => dim),
}));

// Mock Image for image loading tests
jest.mock('react-native/Libraries/Image/Image', () => {
  const React = require('react');
  const mockComponent = jest.requireActual('react-native/jest/mockComponent');
  return mockComponent()(React.Component);
});

// Mock URL polyfill
jest.mock('react-native-url-polyfill/auto', () => {
  global.URL = class URL {
    constructor(url) {
      this.url = url;
      this.protocol = url.startsWith('https') ? 'https:' : 'http:';
      this.hostname = url.replace(/^https?:\/\//, '').split('/')[0];
    }
  };
});

// Mock fetch
global.fetch = jest.fn();

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Performance metrics setup
global.__PERFORMANCE_METRICS__ = {
  tests: {},
  currentTest: null
};

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({
    width: 375,
    height: 667,
    scale: 1,
    fontScale: 1
  })
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn(obj => obj.android || obj.default)
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock console.error to ignore specific warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0].includes('Please update the following components:')) {
    return;
  }
  originalConsoleError(...args);
};

// Helper functions for performance metrics
global.ensureTestMetrics = (testName) => {
  if (!global.__PERFORMANCE_METRICS__.tests[testName]) {
    global.__PERFORMANCE_METRICS__.tests[testName] = {
      timing: {},
      memory: {},
      renders: 0
    };
  }
  global.__PERFORMANCE_METRICS__.currentTest = testName;
  return global.__PERFORMANCE_METRICS__.tests[testName];
};

global.recordMetric = (category, name, value) => {
  const testName = global.__CURRENT_TEST_NAME__;
  if (testName) {
    global.ensureTestMetrics(testName);
    global.__PERFORMANCE_METRICS__.tests[testName][category][name] = value;
  }
};
