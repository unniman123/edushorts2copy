import { NavigationContainer } from '@react-navigation/native';
import { render, act, fireEvent } from '@testing-library/react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { InteractionManager } from 'react-native';

// Mock screens
const Screen1 = () => null;
const Screen2 = () => null;

const Stack = createStackNavigator();

const TestNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Screen1" component={Screen1} />
      <Stack.Screen name="Screen2" component={Screen2} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('Navigation Performance Tests', () => {
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

  it('measures screen transition performance', () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Render the navigation stack
    const { getByText } = render(<TestNavigator />);

    // Wait for initial render
    jest.runAllTimers();

    // Navigate to Screen2
    fireEvent.press(getByText('Screen2'));

    // Wait for navigation animation
    jest.runAllTimers();

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['navigation'] = endTime - startTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;

    // Assert performance targets
    expect(endTime - startTime).toBeLessThan(300); // Navigation should be under 300ms
    expect(endMemory - startMemory).toBeLessThan(10 * 1024 * 1024); // Memory increase should be under 10MB
  });

  it('measures navigation stack memory impact', () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    // Render the navigation stack
    const { getByText } = render(<TestNavigator />);

    // Navigate back and forth multiple times
    for (let i = 0; i < 5; i++) {
      fireEvent.press(getByText('Screen2'));
      jest.runAllTimers();
      fireEvent.press(getByText('Screen1'));
      jest.runAllTimers();
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Record metrics
    global.__PERFORMANCE_METRICS__.tests[currentTest].timing['multiple_navigations'] = endTime - startTime;
    global.__PERFORMANCE_METRICS__.tests[currentTest].memory['heap_used'] = endMemory - startMemory;

    // Assert performance targets
    expect(endMemory - startMemory).toBeLessThan(20 * 1024 * 1024); // Memory increase should be under 20MB after multiple navigations
  });
}); 