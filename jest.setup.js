// Mock React Native's Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

// Mock Supabase
jest.mock('./utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Add console mock to prevent noise in test output
global.console = {
  ...console,
  // Uncomment the following lines to suppress specific console methods during testing
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Set timezone for consistent date handling in tests
process.env.TZ = 'UTC';
