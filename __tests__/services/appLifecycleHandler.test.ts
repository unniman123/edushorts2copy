import { AppState } from 'react-native';
import AppLifecycleHandler from '../../services/AppLifecycleHandler';
import NotificationBridge from '../../services/NotificationBridge';
import MonitoringService from '../../services/MonitoringService';

jest.mock('../../services/NotificationBridge');
jest.mock('../../services/MonitoringService');
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
  },
}));

describe('AppLifecycleHandler', () => {
  let appLifecycleHandler: AppLifecycleHandler;
  let mockNotificationBridge: jest.Mocked<NotificationBridge>;
  let mockMonitoringService: jest.Mocked<MonitoringService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockNotificationBridge = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn(),
      getExpoToken: jest.fn().mockResolvedValue('test-token'),
      cleanup: jest.fn(),
    } as unknown as jest.Mocked<NotificationBridge>;

    mockMonitoringService = {
      getInstance: jest.fn().mockReturnThis(),
      updateMetrics: jest.fn(),
      metrics: {
        tokenHealth: {
          validTokens: 0,
          expiredTokens: 0,
          refreshAttempts: 0,
          refreshSuccess: 0
        },
        syncStatus: {
          failedSync: 0,
          lastSyncTime: new Date(),
          pendingUpdates: 0,
          retryCount: 0
        }
      }
    } as unknown as jest.Mocked<MonitoringService>;

    (NotificationBridge.getInstance as jest.Mock).mockReturnValue(mockNotificationBridge);
    (MonitoringService.getInstance as jest.Mock).mockReturnValue(mockMonitoringService);

    appLifecycleHandler = AppLifecycleHandler.getInstance();
  });

  afterEach(() => {
    appLifecycleHandler.cleanup();
  });

  it('should be a singleton', () => {
    const instance1 = AppLifecycleHandler.getInstance();
    const instance2 = AppLifecycleHandler.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('initialization', () => {
    it('should add app state change listener on initialize', () => {
      appLifecycleHandler.initialize();
      expect(AppState.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('app state changes', () => {
    let stateChangeCallback: (nextState: string) => void;

    beforeEach(() => {
      (AppState.addEventListener as jest.Mock).mockImplementation((event, callback) => {
        stateChangeCallback = callback;
        return { remove: jest.fn() };
      });
      appLifecycleHandler.initialize();
    });

    it('should handle transition to foreground', async () => {
      await stateChangeCallback('active');
      expect(mockNotificationBridge.getExpoToken).toHaveBeenCalled();
      expect(mockMonitoringService.updateMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHealth: expect.any(Object)
        })
      );
    });

    it('should handle transition to background', async () => {
      await stateChangeCallback('background');
      expect(mockMonitoringService.updateMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: expect.any(Object)
        })
      );
    });

    it('should handle token refresh errors', async () => {
      mockNotificationBridge.getExpoToken.mockRejectedValueOnce(new Error('Token refresh failed'));
      
      await stateChangeCallback('active');
      
      expect(mockMonitoringService.updateMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenHealth: expect.objectContaining({
            expiredTokens: 1,
            refreshAttempts: 1
          })
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should remove app state listener on cleanup', () => {
      const mockRemove = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({
        remove: mockRemove
      });

      appLifecycleHandler.initialize();
      appLifecycleHandler.cleanup();

      expect(mockRemove).toHaveBeenCalled();
    });

    it('should handle multiple cleanup calls safely', () => {
      const mockRemove = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({
        remove: mockRemove
      });

      appLifecycleHandler.initialize();
      appLifecycleHandler.cleanup();
      appLifecycleHandler.cleanup(); // Second call should not throw

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });
});
