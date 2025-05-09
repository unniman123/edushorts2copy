/**
 * Setup file for mock-based E2E tests
 */

// Import built-in matchers from testing-library
require('@testing-library/jest-native/extend-expect');

// Mock basic React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.StatusBarManager = { getHeight: jest.fn() };
  return RN;
});

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
      signUp: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'new-user-id' } }, 
        error: null 
      })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  }
}));

// Global mocks
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Suppress specific warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes && 
    (args[0].includes('Warning:') &&
    (args[0].includes('React.createElement') ||
     args[0].includes('Invalid prop') ||
     args[0].includes('Failed prop type')))
  ) {
    return;
  }
  originalConsoleError(...args);
}; 