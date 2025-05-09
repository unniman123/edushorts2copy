declare global {
  var __PERFORMANCE_METRICS__: {
    tests: {
      [testName: string]: {
        timing: {
          [key: string]: number;
        };
        memory: {
          [key: string]: number;
        };
        renders: number;
      };
    };
    currentTest: string | null;
  };
  var __CURRENT_TEST_NAME__: string | undefined;
  
  // Helper function to ensure metrics are initialized for a test
  var ensureTestMetrics: (testName: string) => {
    timing: { [key: string]: number };
    memory: { [key: string]: number };
    renders: number;
  };
  
  // Helper function to record metrics
  var recordMetric: (category: 'timing' | 'memory', name: string, value: number) => void;
}

export {}; 