import { useState, useEffect } from 'react';
import { PostgrestResponse, PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

type SupabaseCountResult = {
  data: any[];
  error: null | {
    message: string;
    details: string;
    code: string;
  };
  count: number | null;
  status: number;
  statusText: string;
};

type CountQueryResponse = PostgrestResponse<any[]> & Partial<SupabaseCountResult>;

interface UserStats {
  savedArticlesCount: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const [savedArticlesCount, setSavedArticlesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
