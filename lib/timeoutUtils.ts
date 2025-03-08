export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export const createTimeoutPromise = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new TimeoutError(errorMessage)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
};

export const DEFAULT_TIMEOUT = {
  AUTH: 5000,       // 5 seconds for auth operations
  DATA: 10000,      // 10 seconds for data fetching
  UPLOAD: 30000,    // 30 seconds for file uploads
  NETWORK: 15000    // 15 seconds for general network operations
};

export const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT.NETWORK,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  return createTimeoutPromise(operation(), timeoutMs, errorMessage);
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  {
    maxAttempts = 3,
    backoffMs = 2000,
    timeoutMs = DEFAULT_TIMEOUT.NETWORK,
    retryableError = (error: any) => error instanceof TimeoutError
  }: {
    maxAttempts?: number;
    backoffMs?: number;
    timeoutMs?: number;
    retryableError?: (error: any) => boolean;
  } = {}
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withTimeout(
        operation,
        timeoutMs,
        `Operation timed out (attempt ${attempt}/${maxAttempts})`
      );
    } catch (error) {
      lastError = error;
      
      if (!retryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      // Wait with exponential backoff before retrying
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
