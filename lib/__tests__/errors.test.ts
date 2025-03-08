import { 
  ErrorCodes,
  ErrorMessages,
  AppError,
  NetworkError,
  AuthError,
  DataError,
  createNetworkError,
  createAuthError,
  createDataError,
  handleError,
  isNetworkError,
  isAuthError,
  isDataError,
  retryWithBackoff
} from '../errors';
import { toast } from 'sonner-native';

jest.mock('sonner-native', () => ({
  toast: {
    error: jest.fn()
  }
}));

describe('Error Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Classes', () => {
    it('should create AppError with context', () => {
      const error = new AppError(ErrorCodes.NETWORK_TIMEOUT, 'Test error', { foo: 'bar' });
      expect(error.code).toBe(ErrorCodes.NETWORK_TIMEOUT);
      expect(error.message).toBe('Test error');
      expect(error.context).toEqual({ foo: 'bar' });
    });

    it('should create NetworkError', () => {
      const error = new NetworkError(ErrorCodes.NETWORK_OFFLINE, 'Offline error');
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe(ErrorCodes.NETWORK_OFFLINE);
    });

    it('should create AuthError', () => {
      const error = new AuthError(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Token expired');
      expect(error.name).toBe('AuthError');
      expect(error.code).toBe(ErrorCodes.AUTH_TOKEN_EXPIRED);
    });

    it('should create DataError', () => {
      const error = new DataError(ErrorCodes.DATA_NOT_FOUND, 'Not found');
      expect(error.name).toBe('DataError');
      expect(error.code).toBe(ErrorCodes.DATA_NOT_FOUND);
    });
  });

  describe('Error Creation Helpers', () => {
    it('should create NetworkError with default message', () => {
      const error = createNetworkError(ErrorCodes.NETWORK_TIMEOUT);
      expect(error.message).toBe(ErrorMessages[ErrorCodes.NETWORK_TIMEOUT]);
    });

    it('should create AuthError with custom message', () => {
      const error = createAuthError(ErrorCodes.AUTH_UNAUTHORIZED, 'Custom message');
      expect(error.message).toBe('Custom message');
    });

    it('should create DataError with context', () => {
      const error = createDataError(ErrorCodes.DATA_VALIDATION, undefined, { field: 'email' });
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('Error Type Checking', () => {
    it('should identify NetworkError', () => {
      const error = new NetworkError(ErrorCodes.NETWORK_TIMEOUT, 'Test');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify AuthError', () => {
      const error = new AuthError(ErrorCodes.AUTH_UNAUTHORIZED, 'Test');
      expect(isAuthError(error)).toBe(true);
    });

    it('should identify DataError', () => {
      const error = new DataError(ErrorCodes.DATA_NOT_FOUND, 'Test');
      expect(isDataError(error)).toBe(true);
    });

    it('should handle regular Error objects', () => {
      const error = new Error('network error occurred');
      expect(isNetworkError(error)).toBe(true);
    });
  });

  describe('Error Handler', () => {
    it('should handle AppError', () => {
      const error = new AppError(ErrorCodes.NETWORK_TIMEOUT, 'Test error');
      const result = handleError(error);

      expect(result.code).toBe(ErrorCodes.NETWORK_TIMEOUT);
      expect(toast.error).toHaveBeenCalledWith(ErrorMessages[ErrorCodes.NETWORK_TIMEOUT]);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleError(error);

      expect(result.code).toBe(ErrorCodes.API_SERVER_ERROR);
      expect(toast.error).toHaveBeenCalledWith('Unknown error');
    });

    it('should merge additional context', () => {
      const error = new AppError(ErrorCodes.DATA_VALIDATION, 'Test', { original: true });
      const result = handleError(error, { additional: true });

      expect(result.context).toEqual({
        original: true,
        additional: true
      });
    });
  });

  describe('Retry With Backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should succeed on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(operation, 3);

      // First attempt fails
      await jest.advanceTimersByTime(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Second attempt after 1000ms
      await jest.advanceTimersByTime(1000);
      expect(operation).toHaveBeenCalledTimes(2);

      // Third attempt after 2000ms more
      await jest.advanceTimersByTime(2000);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should throw after max attempts', async () => {
      const error = new Error('Persistent failure');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(retryWithBackoff(operation, 2)).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Fail'));
      const promise = retryWithBackoff(operation, 3, 1000);

      // First attempt
      await jest.advanceTimersByTime(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Second attempt (after 1000ms)
      await jest.advanceTimersByTime(1000);
      expect(operation).toHaveBeenCalledTimes(2);

      // Third attempt (after 2000ms more)
      await jest.advanceTimersByTime(2000);
      expect(operation).toHaveBeenCalledTimes(3);

      await expect(promise).rejects.toThrow();
    });
  });
});
