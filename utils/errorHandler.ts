/**
 * ErrorHandler - Eliminates duplicate error handling patterns
 * 
 * This utility provides standardized error handling to replace
 * the identical try-catch patterns found in 50+ locations across:
 * - All service files
 * - Hook implementations  
 * - Component error boundaries
 * 
 * Evidence: Identical 4-line try-catch blocks with console.error
 * Solution: Centralized error handling with consistent logging
 */

import { logger } from './logger';

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

export class ErrorHandler {
  /**
   * Handles and logs errors with consistent formatting
   * @param error - The error to handle
   * @param context - Context information about where the error occurred
   * @param shouldThrow - Whether to re-throw the error after handling
   */
  static handle(
    error: unknown, 
    context: ErrorContext, 
    shouldThrow: boolean = false
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const logMessage = `[${context.component || 'Unknown'}] ${context.operation} failed: ${errorMessage}`;
    
    logger.error(logMessage, {
      error: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString()
    });

    if (shouldThrow) {
      throw error;
    }
  }

  /**
   * Wraps async operations with standardized error handling
   * @param operation - The async operation to execute
   * @param context - Context information
   * @param fallback - Fallback value to return on error
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      ErrorHandler.handle(error, context);
      return fallback;
    }
  }

  /**
   * Wraps sync operations with standardized error handling
   * @param operation - The sync operation to execute
   * @param context - Context information
   * @param fallback - Fallback value to return on error
   */
  static withSyncErrorHandling<T>(
    operation: () => T,
    context: ErrorContext,
    fallback?: T
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      ErrorHandler.handle(error, context);
      return fallback;
    }
  }
} 

/**
 * Authentication-specific error handling utility
 * Replaces 'any' type usage in authentication flows
 */
export interface AuthError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AuthError).message === 'string'
  );
}

/**
 * Safely extracts error message from unknown error type
 * Replaces: catch (error: any) { error.message }
 * Usage: catch (error: unknown) { getErrorMessage(error) }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isAuthError(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  
  return 'An unexpected error occurred.';
}

/**
 * Handles authentication errors with proper typing
 * Replaces generic error handling in auth flows
 */
export function handleAuthError(
  error: unknown,
  context: Omit<ErrorContext, 'operation'> & { operation?: string }
): string {
  const operation = context.operation || 'authentication';
  const errorMessage = getErrorMessage(error);
  
  // Log the error with context
  ErrorHandler.handle(error, {
    ...context,
    operation,
  });
  
  return errorMessage;
} 