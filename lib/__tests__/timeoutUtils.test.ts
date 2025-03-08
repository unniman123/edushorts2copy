import { withTimeout, withRetry, TimeoutError, DEFAULT_TIMEOUT } from '../timeoutUtils';

describe('timeoutUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('withTimeout', () => {
    it('should resolve when operation completes before timeout', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const promise = withTimeout(operation, 1000);
      
      await expect(promise).resolves.toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should reject with TimeoutError when operation exceeds timeout', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      const promise = withTimeout(operation, 1000, 'Custom timeout message');
      
      jest.advanceTimersByTime(1001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
      await expect(promise).rejects.toThrow('Custom timeout message');
    });

    it('should use default timeout message if none provided', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );
      
      const promise = withTimeout(operation, 1000);
      
      jest.advanceTimersByTime(1001);
      
      await expect(promise).rejects.toThrow('Operation timed out');
    });
  });

  describe('withRetry', () => {
    it('should resolve on first successful attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure up to maxAttempts', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, {
        maxAttempts: 3,
        backoffMs: 1000
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect maxAttempts limit', async () => {
      const operation = jest.fn().mockRejectedValue(new TimeoutError('Timeout'));
      
      await expect(withRetry(operation, { maxAttempts: 2 }))
        .rejects
        .toThrow(TimeoutError);
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff between retries', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockResolvedValue('success');
      
      const promise = withRetry(operation, {
        maxAttempts: 3,
        backoffMs: 1000
      });
      
      // First attempt fails immediately
      expect(operation).toHaveBeenCalledTimes(1);
      
      // Second attempt should happen after 1000ms
      jest.advanceTimersByTime(1000);
      expect(operation).toHaveBeenCalledTimes(2);
      
      // Third attempt should happen after 2000ms (exponential)
      jest.advanceTimersByTime(2000);
      expect(operation).toHaveBeenCalledTimes(3);
      
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should only retry on specified errors', async () => {
      const nonRetryableError = new Error('Database error');
      const operation = jest.fn()
        .mockRejectedValueOnce(nonRetryableError);
      
      await expect(withRetry(operation, {
        retryableError: (error) => error instanceof TimeoutError
      }))
        .rejects
        .toBe(nonRetryableError);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
