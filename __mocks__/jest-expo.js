// Mock for jest-expo

// Ensure NativeModules is properly mocked before other parts that depend on it
const mockNativeModules = {
  ExponentConstants: {
    manifest: {},
    deviceId: 'test-device-id',
    deviceName: 'test-device-name',
    linkingUri: 'exp://test',
  },
  ExponentDevice: {
    isDevice: true,
  },
  ExponentNotifications: {},
  ExponentPlatformInfo: {
    platform: {
      ios: {
        model: 'iPhone',
      },
      android: {
        model: 'Android',
      },
    },
  },
  StatusBarManager: {
    HEIGHT: 20,
  },
  UIManager: {
    configureNext: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    manageChildren: jest.fn(),
    getViewManagerConfig: jest.fn((name) => {
      return {
        Commands: {
          flashScrollIndicators: 1,
        },
      };
    }),
  },
};

// Provide a minimal mock implementation of React Native's NativeModules
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => mockNativeModules);

// Create a valid object for Platform to prevent the Object.defineProperty error
const mockPlatform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
  isPad: false,
  isTV: false,
};

// Mock Platform before it gets used in the setup
jest.mock('react-native/Libraries/Utilities/Platform', () => mockPlatform);

// Mock PixelRatio
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  get: jest.fn(() => 2),
  getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
  roundToNearestPixel: jest.fn((size) => size),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
  set: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Image
jest.mock('react-native/Libraries/Image/Image', () => 'Image');

// Mock for the preset export
module.exports = {
  preset: 'react-native',
  setupFiles: [],
}; 