import { toast } from 'sonner-native';

// Error code ranges
type NetworkErrorCode = 1000 | 1001 | 1002;
type AuthErrorCode = 2000 | 2001 | 2002 | 2003;
type DataErrorCode = 3000 | 3001 | 3002 | 3003;
type ApiErrorCode = 4000 | 4001 | 4002 | 4003;
type StorageErrorCode = 5000 | 5001 | 5002;

// Error codes
export const ErrorCodes = {
  // Network errors (1000-1999)
  NETWORK_TIMEOUT: 1000 as const,
  NETWORK_OFFLINE: 1001 as const,
  NETWORK_ERROR: 1002 as const,

  // Authentication errors (2000-2999)
  AUTH_INVALID_CREDENTIALS: 2000 as const,
  AUTH_TOKEN_EXPIRED: 2001 as const,
  AUTH_UNAUTHORIZED: 2002 as const,
  AUTH_INVALID_SESSION: 2003 as const,

  // Data errors (3000-3999)
  DATA_NOT_FOUND: 3000 as const,
  DATA_VALIDATION: 3001 as const,
  DATA_CONFLICT: 3002 as const,
  DATA_INTEGRITY: 3003 as const,

  // API errors (4000-4999)
  API_RATE_LIMIT: 4000 as const,
  API_SERVER_ERROR: 4001 as const,
  API_BAD_REQUEST: 4002 as const,
  API_MAINTENANCE: 4003 as const,

  // Storage errors (5000-5999)
  STORAGE_QUOTA_EXCEEDED: 5000 as const,
  STORAGE_PERMISSION_DENIED: 5001 as const,
  STORAGE_NOT_FOUND: 5002 as const,
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Custom error classes
export class AppError extends Error {
  code: ErrorCode;
  context?: Record<string, any>;

  constructor(code: ErrorCode, message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
  }
}

export class NetworkError extends AppError {
  constructor(code: NetworkErrorCode, message: string, context?: Record<string, any>) {
    super(code, message, context);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(code: AuthErrorCode, message: string, context?: Record<string, any>) {
    super(code, message, context);
    this.name = 'AuthError';
  }
}

export class DataError extends AppError {
  constructor(code: DataErrorCode, message: string, context?: Record<string, any>) {
    super(code, message, context);
    this.name = 'DataError';
  }
}

// Error messages mapping type
type ErrorMessagesType = {
  readonly [K in ErrorCode]: string;
};

// Error messages
export const ErrorMessages: ErrorMessagesType = {
  1000: 'Request timed out. Please try again.',
  1001: 'No internet connection. Please check your network.',
  1002: 'Network error occurred. Please try again.',
  2000: 'Invalid email or password.',
  2001: 'Session expired. Please login again.',
  2002: 'You are not authorized to perform this action.',
  2003: 'Invalid session. Please login again.',
  3000: 'Requested data not found.',
  3001: 'Invalid data provided.',
  3002: 'Data conflict occurred.',
  3003: 'Data integrity error.',
  4000: 'Too many requests. Please try again later.',
  4001: 'Server error occurred.',
  4002: 'Invalid request.',
  4003: 'Service is under maintenance.',
  5000: 'Storage quota exceeded.',
  5001: 'Permission denied.',
  5002: 'Storage item not found.',
};

// Error handlers
export const handleError = (error: Error | AppError | unknown, context?: Record<string, any>) => {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    // Log to error monitoring service
    logError(error);

    // Show user-friendly message
    toast.error(ErrorMessages[error.code] || error.message);

    // Return structured error for handling
    return {
      code: error.code,
      message: error.message,
      context: { ...error.context, ...context }
    };
  }

  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  toast.error(message);

  return {
    code: ErrorCodes.API_SERVER_ERROR,
    message,
    context
  };
};

// Error logging
const logError = (error: AppError) => {
  // TODO: Implement error logging service
  console.error({
    name: error.name,
    code: error.code,
    message: error.message,
    context: error.context,
    stack: error.stack
  });
};

// Error helpers
export const isNetworkError = (error: Error): boolean => {
  return error instanceof NetworkError ||
    error.name === 'NetworkError' ||
    error.message.toLowerCase().includes('network') ||
    !navigator.onLine;
};

export const isAuthError = (error: Error): boolean => {
  return error instanceof AuthError ||
    error.name === 'AuthError' ||
    ((error as AppError).code >= 2000 && (error as AppError).code < 3000);
};

export const isDataError = (error: Error): boolean => {
  return error instanceof DataError ||
    error.name === 'DataError' ||
    ((error as AppError).code >= 3000 && (error as AppError).code < 4000);
};

// Error creation helpers
export const createNetworkError = (
  code: NetworkErrorCode,
  message?: string,
  context?: Record<string, any>
) => {
  return new NetworkError(code, message || ErrorMessages[code], context);
};

export const createAuthError = (
  code: AuthErrorCode,
  message?: string,
  context?: Record<string, any>
) => {
  return new AuthError(code, message || ErrorMessages[code], context);
};

export const createDataError = (
  code: DataErrorCode,
  message?: string,
  context?: Record<string, any>
) => {
  return new DataError(code, message || ErrorMessages[code], context);
};

// Error recovery helpers
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) break;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // At this point lastError is guaranteed to be defined because
  // we only reach here after catching at least one error
  throw lastError!;
};
