import { monitoringService } from '../../services/monitoring';
import { supabase } from '../../utils/supabase';

jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(),
    })),
  },
}));

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    monitoringService.cleanup();
  });

  describe('Performance Tracking', () => {
    it('should batch performance metrics', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Track multiple metrics
      for (let i = 0; i < 5; i++) {
        await monitoringService.trackNetworkRequest(`request-${i}`, 100);
      }

      // Metrics should not be sent yet (batch size is 10)
      expect(mockInsert).not.toHaveBeenCalled();

      // Add more metrics to trigger batch send
      for (let i = 5; i < 10; i++) {
        await monitoringService.trackNetworkRequest(`request-${i}`, 100);
      }

      // Metrics should be sent now
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'network',
            name: expect.stringMatching(/request-\d/),
            duration: 100,
          }),
        ])
      );
    });

    it('should flush metrics on interval', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Track a few metrics
      await monitoringService.trackNetworkRequest('test-request', 100);
      await monitoringService.trackRenderTime('test-render', 50);

      // Fast-forward time to trigger flush
      jest.advanceTimersByTime(60000); // 1 minute

      // Metrics should be sent
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'network',
            name: 'test-request',
            duration: 100,
          }),
          expect.objectContaining({
            type: 'render',
            name: 'test-render',
            duration: 50,
          }),
        ])
      );
    });
  });

  describe('Error Tracking', () => {
    it('should send runtime errors immediately', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const error = {
        type: 'runtime' as const,
        message: 'Critical error',
        stack: 'Error stack',
      };

      await monitoringService.trackError(error);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'runtime',
            message: 'Critical error',
            stack: 'Error stack',
          }),
        ])
      );
    });

    it('should batch non-runtime errors', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Track multiple non-runtime errors
      for (let i = 0; i < 5; i++) {
        await monitoringService.trackError({
          type: 'api',
          message: `API Error ${i}`,
        });
      }

      // Errors should not be sent yet
      expect(mockInsert).not.toHaveBeenCalled();

      // Add more errors to trigger batch send
      for (let i = 5; i < 10; i++) {
        await monitoringService.trackError({
          type: 'api',
          message: `API Error ${i}`,
        });
      }

      // Errors should be sent now
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'api',
            message: expect.stringMatching(/API Error \d/),
          }),
        ])
      );
    });
  });

  describe('Queue Management', () => {
    it('should clear queues when limit is exceeded', async () => {
      const mockInsert = jest.fn().mockRejectedValue(new Error('Network error'));
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Generate more than 1000 metrics
      for (let i = 0; i < 1100; i++) {
        await monitoringService.trackNetworkRequest(`request-${i}`, 100);
      }

      // Queue should be cleared due to limit
      expect(mockInsert).toHaveBeenCalled();
      // Further tracking should still work
      await monitoringService.trackNetworkRequest('new-request', 100);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'new-request',
          }),
        ])
      );
    });
  });
});
