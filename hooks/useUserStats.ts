/**
 * useUserStats - Custom hook for fetching and managing user statistics
 * 
 * Provides user statistics including saved articles count with automatic refresh,
 * error handling, and retry logic. Handles authentication state changes and
 * implements exponential backoff for failed requests. Includes periodic refresh
 * functionality and proper cleanup on unmount.
 * 
 * @hook
 * @returns {UserStats} Object containing user statistics and management methods
 * 
 * @example
 * const { savedArticlesCount, isLoading, error, refresh } = useUserStats();
 * 
 * // Display stats
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * // Manual refresh
 * const handleRefresh = async () => {
 *   await refresh();
 * };
 * 
 * // Stats will automatically refresh every 2 minutes
 */
import { useState, useEffect } from 'react';
import { PostgrestResponse, PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Supabase count result type with extended properties
 * @type {SupabaseCountResult}
 */
type SupabaseCountResult = {
  /** Query result data */
  data: any[];
  /** Error object if query failed */
  error: null | {
    message: string;
    details: string;
    code: string;
  };
  /** Total count of matching records */
  count: number | null;
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
};

/**
 * Combined count query response type
 * @type {CountQueryResponse}
 */
type CountQueryResponse = PostgrestResponse<any[]> & Partial<SupabaseCountResult>;

/**
 * User statistics interface
 * @interface UserStats
 */
interface UserStats {
  /** Number of saved articles for the user */
  savedArticlesCount: number;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state if any */
  error: Error | null;
  /** Function to manually refresh statistics */
  refresh: () => Promise<void>;
}

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const [savedArticlesCount, setSavedArticlesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches user statistics from Supabase with retry logic
   * Implements exponential backoff for failed requests and timeout handling
   * @param {number} [retryCount=0] - Current retry attempt count
   * @param {number} [maxRetries=2] - Maximum number of retry attempts
   * @returns {Promise<void>} Promise that resolves when fetch is complete
   */
  const fetchStats = async (retryCount = 0, maxRetries = 2) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create abort controller for timeout
      const savedController = new AbortController();

      // Set timeout
      const savedTimeout = setTimeout(() => savedController.abort(), 5000);

      try {
        // Execute query with abort signal
        const savedResult = await supabase
          .from('saved_articles')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .abortSignal(savedController.signal)
          .throwOnError();

        // Clear timeout
        clearTimeout(savedTimeout);

        // Handle the count with type assertion
        const savedCount = (savedResult as CountQueryResponse).count ?? 0;
        
        setSavedArticlesCount(savedCount);
      } finally {
        // Clean up controller
        savedController.abort();
      }

    } catch (err) {
      console.error('Error fetching user stats:', err);
      
      // Retry with exponential backoff if not maximum retries
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`Retrying user stats fetch in ${delay}ms...`);
        
        setTimeout(() => {
          fetchStats(retryCount + 1, maxRetries);
        }, delay);
        
        return;
      }

      setError(err instanceof Error ? err : new Error('Failed to fetch user stats'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats on mount, when user changes, and set up refresh interval
  useEffect(() => {
    let isSubscribed = true;
    
    /**
     * Loads statistics if component is still subscribed
     * @returns {Promise<void>} Promise that resolves when stats are loaded
     */
    const loadStats = async () => {
      if (isSubscribed) {
        await fetchStats();
      }
    };

    loadStats();

    // Refresh stats every 2 minutes if the user is active
    const interval = setInterval(loadStats, 120000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  return {
    savedArticlesCount,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
