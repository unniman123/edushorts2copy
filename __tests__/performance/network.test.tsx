import { render, waitFor } from '@testing-library/react-native';
import fetchMock from 'jest-fetch-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Network Performance Tests', () => {
  let startTime: number;
  let currentTest: string;

  beforeEach(() => {
    startTime = Date.now();
    jest.useFakeTimers();
    currentTest = expect.getState().currentTestName || '';
    global.__CURRENT_TEST_NAME__ = currentTest;
    
    // Initialize metrics for this test
    global.ensureTestMetrics(currentTest);

    fetchMock.resetMocks();
    AsyncStorage.clear();
  });

  afterEach(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (currentTest) {
      global.__PERFORMANCE_METRICS__.tests[currentTest].timing['total'] = duration;
    }
  });

  it('measures API response handling time', async () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Mock API response
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));

    // Make API request
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['api_response'] = endTime - startTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;

    // Assert performance targets
    expect(endTime - startTime).toBeLessThan(3000); // API response should be under 3 seconds
    expect(endMemory - startMemory).toBeLessThan(5 * 1024 * 1024); // Memory increase should be under 5MB
  });

  it('measures caching effectiveness', async () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Mock API response
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));

    // First request (uncached)
    const uncachedStartTime = Date.now();
    await fetch('https://api.example.com/data');
    const uncachedTime = Date.now() - uncachedStartTime;

    // Store in cache
    await AsyncStorage.setItem('cached_data', JSON.stringify({ data: 'test' }));

    // Second request (cached)
    const cachedStartTime = Date.now();
    const cachedData = await AsyncStorage.getItem('cached_data');
    const cachedTime = Date.now() - cachedStartTime;

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['uncached_request'] = uncachedTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['cached_request'] = cachedTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;

    // Assert performance targets
    expect(cachedTime).toBeLessThan(uncachedTime); // Cached request should be faster
    expect(endMemory - startMemory).toBeLessThan(10 * 1024 * 1024); // Memory increase should be under 10MB
  });

  it('measures data transfer size optimization', async () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Mock large API response
    const largeData = Array(1000).fill({ id: 1, name: 'test', description: 'test description' });
    fetchMock.mockResponseOnce(JSON.stringify(largeData));

    // Make API request
    const response = await fetch('https://api.example.com/large-data');
    const data = await response.json();

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Calculate response size
    const responseSize = new Blob([JSON.stringify(data)]).size;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['large_request'] = endTime - startTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['response_size'] = responseSize;

    // Assert performance targets
    expect(responseSize).toBeLessThan(1024 * 1024); // Response size should be under 1MB
    expect(endMemory - startMemory).toBeLessThan(20 * 1024 * 1024); // Memory increase should be under 20MB
  });
}); 