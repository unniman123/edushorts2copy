import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { useNews } from '../../context/NewsContext';
import { useAdvertisements } from '../../context/AdvertisementContext';
import PerformanceMonitoringService from '../../services/PerformanceMonitoringService';
import ImageOptimizer from '../../utils/ImageOptimizer';

// Mock the contexts
jest.mock('../../context/NewsContext');
jest.mock('../../context/AdvertisementContext');

// Performance thresholds
const THRESHOLDS = {
  INITIAL_RENDER: 300, // 300ms
  IMAGE_LOAD: 500, // 500ms
  SCROLL_RESPONSE: 16, // 16ms (60fps)
  MEMORY_INCREASE: 50 * 1024 * 1024, // 50MB
};

describe('HomeScreen Performance Tests', () => {
  // Setup performance monitoring
  let performanceMonitor: PerformanceMonitoringService;
  let imageOptimizer: ImageOptimizer;
  
  beforeEach(() => {
    global.__CURRENT_TEST_NAME__ = expect.getState().currentTestName || ''; // Set the global for render counting
    // Initialize metrics for this test
    global.ensureTestMetrics(global.__CURRENT_TEST_NAME__);
    
    performanceMonitor = PerformanceMonitoringService.getInstance();
    imageOptimizer = ImageOptimizer.getInstance();
    
    // Mock news context
    (useNews as jest.Mock).mockReturnValue({
      news: Array(20).fill(null).map((_, i) => ({
        id: `news-${i}`,
        title: `News ${i}`,
        summary: `Summary ${i}`,
        image_path: `https://example.com/image-${i}.jpg`,
        created_at: new Date().toISOString(),
      })),
      loading: false,
      error: null,
      loadMoreNews: jest.fn(),
    });

    // Mock advertisements context
    (useAdvertisements as jest.Mock).mockReturnValue({
      advertisements: Array(5).fill(null).map((_, i) => ({
        id: `ad-${i}`,
        title: `Ad ${i}`,
        image_url: `https://example.com/ad-${i}.jpg`,
        display_frequency: 5,
      })),
    });

    // Reset performance metrics
    performanceMonitor.reset();
  });

  it('should render initial content within performance threshold', async () => {
    const startTime = Date.now();

    await act(async () => {
      render(<HomeScreen />);
    });

    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(THRESHOLDS.INITIAL_RENDER);
  });

  it('should optimize and cache images effectively', async () => {
    const imagePath = 'https://example.com/test-image.jpg';
    const startTime = Date.now();

    await act(async () => {
      await imageOptimizer.preloadImage(imagePath);
    });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(THRESHOLDS.IMAGE_LOAD);
    expect(imageOptimizer.isImageCached(imagePath)).toBe(true);
  });

  it('should maintain smooth scrolling performance', async () => {
    const { getByTestId } = render(<HomeScreen />);
    const pagerView = getByTestId('pager-view');
    
    const startTime = Date.now();
    
    await act(async () => {
      fireEvent.scroll(pagerView, {
        nativeEvent: {
          contentOffset: { y: 500 },
          contentSize: { height: 2000, width: 400 },
          layoutMeasurement: { height: 800, width: 400 },
        },
      });
    });

    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(THRESHOLDS.SCROLL_RESPONSE);
  });

  it('should manage memory usage within acceptable limits', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    await act(async () => {
      const { unmount } = render(<HomeScreen />);
      // Simulate scrolling and loading more content
      await Promise.all([
        imageOptimizer.preloadImage('https://example.com/test1.jpg'),
        imageOptimizer.preloadImage('https://example.com/test2.jpg'),
        imageOptimizer.preloadImage('https://example.com/test3.jpg'),
      ]);
      unmount();
    });

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(THRESHOLDS.MEMORY_INCREASE);
  });

  it('should efficiently handle content updates', async () => {
    const { rerender } = render(<HomeScreen />);
    
    const startTime = Date.now();
    
    await act(async () => {
      // Update news content
      (useNews as jest.Mock).mockReturnValue({
        news: Array(40).fill(null).map((_, i) => ({
          id: `news-${i}`,
          title: `Updated News ${i}`,
          summary: `Updated Summary ${i}`,
          image_path: `https://example.com/updated-image-${i}.jpg`,
          created_at: new Date().toISOString(),
        })),
        loading: false,
        error: null,
        loadMoreNews: jest.fn(),
      });
      rerender(<HomeScreen />);
    });

    const updateTime = Date.now() - startTime;
    expect(updateTime).toBeLessThan(THRESHOLDS.INITIAL_RENDER);
  });
});
