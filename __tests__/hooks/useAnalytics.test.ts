import { renderHook } from '@testing-library/react-native';
import { useScreenTracking } from '../../hooks/useAnalytics';
import { analyticsService } from '../../services/AnalyticsService';

jest.mock('../../services/AnalyticsService', () => ({
  analyticsService: {
    logScreenView: jest.fn()
  }
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigationContainerRef: () => ({
    current: {
      getCurrentRoute: () => ({
        name: 'TestScreen'
      })
    },
    addListener: jest.fn((event, callback) => {
      if (event === 'state') {
        // Simulate navigation event
        callback({
          data: {
            state: {
              routes: [{ name: 'TestScreen' }]
            }
          }
        });
      }
      return () => {}; // cleanup function
    })
  })
}));

describe('useScreenTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track initial screen view', () => {
    renderHook(() => useScreenTracking());

    // Fast-forward past the initial delay
    jest.advanceTimersByTime(500);

    expect(analyticsService.logScreenView).toHaveBeenCalledWith({
      screen_name: 'TestScreen',
      screen_class: 'TestScreen'
    });
  });

  it('should track screen changes', () => {
    renderHook(() => useScreenTracking());

    // Fast-forward past the initial delay
    jest.advanceTimersByTime(500);

    expect(analyticsService.logScreenView).toHaveBeenCalledWith({
      screen_name: 'TestScreen',
      screen_class: 'TestScreen'
    });

    // Simulate a screen change
    jest.advanceTimersByTime(1000);

    expect(analyticsService.logScreenView).toHaveBeenCalledTimes(1);
  });

  it('should cleanup listeners on unmount', () => {
    const { unmount } = renderHook(() => useScreenTracking());

    // Fast-forward past the initial delay
    jest.advanceTimersByTime(500);

    unmount();

    // Simulate a screen change after unmount
    jest.advanceTimersByTime(1000);

    // Should still only have been called once (from the initial screen)
    expect(analyticsService.logScreenView).toHaveBeenCalledTimes(1);
  });
});
