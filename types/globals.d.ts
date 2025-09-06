// Lightweight global declarations for test performance metrics used in jest.setup.js
declare const __PERFORMANCE_METRICS__: any;
declare var __CURRENT_TEST_NAME__: any;
declare function ensureTestMetrics(testName: string): any;
declare function recordMetric(category: string, name: string, value: number): void;

export {};


