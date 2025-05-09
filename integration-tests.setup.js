import { NativeModules } from 'react-native';
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules first
NativeModules.StatusBarManager = {
  HEIGHT: 20,
  getHeight: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null),
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

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: jest.fn().mockReturnValue(true),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: true }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[MOCK_TOKEN]' }),
  addNotificationReceivedListener: jest.fn().mockReturnValue('listener-id-1'),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue('listener-id-2'),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockImplementation(() => ({
        data: [],
        error: null,
      })),
      in: jest.fn().mockImplementation(() => ({
        data: [],
        error: null,
      })),
      single: jest.fn().mockImplementation(() => ({
        data: null,
        error: null,
      })),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}), { virtual: true });

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 