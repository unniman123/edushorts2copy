import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import MockApp from '../mocks/App';

// Common device configurations to test
const deviceConfigs = {
  lowEndPhone: {
    width: 320,
    height: 480,
    memory: 1024 * 1024 * 512, // 512MB
    name: 'Low-end Device'
  },
  midRangePhone: {
    width: 375,
    height: 667,
    memory: 1024 * 1024 * 1024, // 1GB
    name: 'Mid-range Device'
  },
  highEndPhone: {
    width: 414,
    height: 896,
    memory: 1024 * 1024 * 2048, // 2GB
    name: 'High-end Device'
  },
  tablet: {
    width: 768,
    height: 1024,
    memory: 1024 * 1024 * 3072, // 3GB
    name: 'Tablet'
  }
};

describe('Device Fragmentation Performance Tests', () => {
  beforeAll(() => {
    // Initialize global metrics object if not exists
    if (!global.__PERFORMANCE_METRICS__) {
      global.__PERFORMANCE_METRICS__ = {
        tests: {},
        currentTest: null
      };
    }
  });

  beforeEach(() => {
    const testName = expect.getState().currentTestName || '';
    global.__CURRENT_TEST_NAME__ = testName;
    global.ensureTestMetrics(testName);
  });

  afterEach(() => {
    // Log metrics for debugging
    const testName = global.__CURRENT_TEST_NAME__;
    if (testName && global.__PERFORMANCE_METRICS__.tests[testName]) {
      console.log(`Metrics for ${testName}:`, global.__PERFORMANCE_METRICS__.tests[testName]);
    }
  });

  Object.entries(deviceConfigs).forEach(([deviceType, config]) => {
    it(`should render efficiently on ${config.name}`, async () => {
      // Mock device dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: config.width,
        height: config.height,
        scale: 1,
        fontScale: 1
      });

      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();

      // Render app
      const { unmount } = render(<MockApp />);

      const renderTime = performance.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      // Record metrics
      global.recordMetric('timing', `${deviceType}_render`, renderTime);
      global.recordMetric('memory', `${deviceType}_memory`, memoryUsed);

      // Performance assertions based on device type
      const maxRenderTime = deviceType === 'lowEndPhone' ? 3000 : 2000;
      const maxMemory = config.memory * 0.3; // Should not use more than 30% of device memory

      expect(renderTime).toBeLessThan(maxRenderTime);
      expect(memoryUsed).toBeLessThan(maxMemory);

      // Clean up
      unmount();
    });

    it(`should handle layout changes efficiently on ${config.name}`, async () => {
      // Mock device dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: config.width,
        height: config.height,
        scale: 1,
        fontScale: 1
      });

      const startTime = performance.now();
      const { rerender } = render(<MockApp />);

      // Simulate orientation change
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: config.height, // Swapped for landscape
        height: config.width,
        scale: 1,
        fontScale: 1
      });

      rerender(<MockApp />);

      const layoutChangeTime = performance.now() - startTime;
      global.recordMetric('timing', `${deviceType}_layout_change`, layoutChangeTime);

      // Layout change should be quick even on low-end devices
      expect(layoutChangeTime).toBeLessThan(500);
    });
  });
}); 