// Minimal setup - just enough to track render counts and performance metrics
// Initialize global performance metrics
global.__PERFORMANCE_METRICS__ = {
  tests: {},
  currentTest: null
};

// Helper function to ensure test metrics are initialized
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

// Helper to record metrics
global.recordMetric = (category, name, value) => {
  const testName = global.__CURRENT_TEST_NAME__ || global.__PERFORMANCE_METRICS__.currentTest;
  if (testName) {
    global.ensureTestMetrics(testName);
    global.__PERFORMANCE_METRICS__.tests[testName][category][name] = value;
  }
};

// Basic mocks
jest.mock('react-native-pager-view', () => 'PagerView');
jest.mock('expo-battery', () => ({ getBatteryLevelAsync: jest.fn().mockResolvedValue(1.0) }));
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockImplementation(() => ({
    size: 1024 * 1024,
    isDirectory: jest.fn().mockReturnValue(false)
  })),
  readdirSync: jest.fn().mockReturnValue(['chunk1.bundle', 'chunk2.bundle']),
}));

// Mock fetch
require('jest-fetch-mock').enableMocks();

// Simple render counter
const mockRenderCount = new Map();
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    createElement: function(type, props, ...children) {
      // Get test name from global set by test files
      const testName = global.__CURRENT_TEST_NAME__;
      if (testName) {
        const count = mockRenderCount.get(testName) || 0;
        mockRenderCount.set(testName, count + 1);
      }
      return originalReact.createElement.apply(null, [type, props, ...children]);
    }
  };
});

// Add cleanup hooks using globals
if (global.afterEach) {
  global.afterEach(() => {
    try {
      const testName = global.expect?.getState()?.currentTestName;
      if (testName) {
        const renderCount = mockRenderCount.get(testName) || 0;
        global.ensureTestMetrics(testName);
        global.__PERFORMANCE_METRICS__.tests[testName].renders = renderCount;
        mockRenderCount.delete(testName);
        delete global.__CURRENT_TEST_NAME__;
        
        // Debug log to help diagnose issues
        console.log(`Recorded metrics for test "${testName}":`, 
          JSON.stringify(global.__PERFORMANCE_METRICS__.tests[testName], null, 2));
      }
    } catch (error) {
      console.error('Error in afterEach cleanup:', error);
    }
  });
} 