// Initialize performance metrics
global.__PERFORMANCE_METRICS__ = {
  tests: {},
  currentTest: null
};

// Mock React Native components
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn(obj => obj.android || obj.default)
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({
      width: 375,
      height: 667,
      scale: 1,
      fontScale: 1
    })
  },
  View: 'View'
}));

// Helper functions
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
