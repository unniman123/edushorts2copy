/**
 * useAsyncState - Centralized async state management hook
 * 
 * Eliminates duplicate loading/error state patterns found across components.
 * Provides consistent error handling and loading management.
 * 
 * Evidence-based implementation to resolve duplication in:
 * - LoadingScreen.tsx:7-8 (useState patterns)
 * - LoginScreen.tsx:37 (isLoading state)
 * - RegisterScreen.tsx:43 (isLoading state)
 * 
 * @template T The type of data being managed
 * @returns {object} State management utilities
 */
import { useState, useCallback } from 'react';

interface AsyncStateReturn<T> {
  /** Current data state */
  data: T | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Execute async operation */
  execute: (asyncFn: () => Promise<T>) => Promise<T>;
  /** Manually set data */
  setData: (data: T | null) => void;
  /** Clear error state */
  clearError: () => void;
  /** Reset all state */
  reset: () => void;
}

export const useAsyncState = <T>(): AsyncStateReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    setData,
    clearError,
    reset,
  };
};

export default useAsyncState;











