import { AppRegistry } from 'react-native';
import { render } from '@testing-library/react-native';
import App from '../../App';

// Initialize performance metrics collector
global.__PERFORMANCE_METRICS__ = {
  tests: {},
  currentTest: null
};

describe('App Launch Performance Tests', () => {
  let startTime: number;
  let currentTest: string;

  beforeEach(() => {
    startTime = Date.now();
    jest.useFakeTimers();
    currentTest = expect.getState().currentTestName || '';
    global.__CURRENT_TEST_NAME__ = currentTest; // Set the global for render counting
    
    // Initialize metrics for this test
    global.ensureTestMetrics(currentTest);
  });

  afterEach(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (currentTest) {
      global.__PERFORMANCE_METRICS__.tests[currentTest].timing['total'] = duration;
    }
  });

  it('measures cold start performance', async () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Simulate cold start by clearing the component cache
    AppRegistry.registerComponent('App', () => App);
    
    // Render the app
    render(<App />);

    // Wait for initial render
    jest.runAllTimers();

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['cold_start'] = endTime - startTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;

    // Assert performance targets
    expect(endTime - startTime).toBeLessThan(2000); // Cold start should be under 2 seconds
    expect(endMemory - startMemory).toBeLessThan(50 * 1024 * 1024); // Memory increase should be under 50MB
  });

  it('measures warm start performance', async () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Render the app (it's already registered from cold start test)
    render(<App />);

    // Wait for initial render
    jest.runAllTimers();

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['warm_start'] = endTime - startTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;

    // Assert performance targets
    expect(endTime - startTime).toBeLessThan(500); // Warm start should be under 500ms
    expect(endMemory - startMemory).toBeLessThan(20 * 1024 * 1024); // Memory increase should be under 20MB
  });
}); 