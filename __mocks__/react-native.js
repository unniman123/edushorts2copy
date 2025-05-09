const React = require('react');

const mockNativeModules = {
  SettingsManager: {
    settings: {
      AppleLocale: 'en_US',
    },
    getConstants: () => ({
      settings: {
        AppleLocale: 'en_US',
      },
    }),
  },
  BatteryManager: {
    getTemperature: jest.fn().mockResolvedValue(25),
  },
  DeviceInfo: {
    getConstants: () => ({
      Dimensions: {
        window: {
          width: 375,
          height: 812,
          scale: 2,
          fontScale: 1,
        },
      },
    }),
  },
};

const mockEventEmitter = {
  addListener: jest.fn(),
  removeAllListeners: jest.fn(),
  removeSubscription: jest.fn(),
  listeners: jest.fn(() => []),
  removeListener: jest.fn(),
};

const RN = {
  Platform: {
    OS: 'ios',
    select: jest.fn(options => options.ios),
  },
  StyleSheet: {
    create: jest.fn(styles => styles),
    hairlineWidth: 1,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Animated: {
    View: 'Animated.View',
    timing: jest.fn().mockReturnValue({
      start: jest.fn(callback => callback && callback()),
    }),
    Value: jest.fn(() => ({
      interpolate: jest.fn(),
      setValue: jest.fn(),
    })),
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  },
  NativeModules: mockNativeModules,
  NativeEventEmitter: jest.fn(() => mockEventEmitter),
  InteractionManager: {
    runAfterInteractions: jest.fn(callback => callback()),
  },
  Settings: {
    get: jest.fn(),
    set: jest.fn(),
  },
  TurboModuleRegistry: {
    getEnforcing: jest.fn((moduleName) => {
      if (moduleName === 'SettingsManager') {
        return mockNativeModules.SettingsManager;
      }
      return {};
    }),
  },
  ProgressBarAndroid: 'ProgressBarAndroid',
  Clipboard: {
    getString: jest.fn(),
    setString: jest.fn(),
  },
  PushNotificationIOS: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    requestPermissions: jest.fn(),
  },
  DevSettings: {
    addMenuItem: jest.fn(),
    reload: jest.fn(),
  },
  VirtualizedList: 'VirtualizedList',
};

module.exports = RN; 