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
  articlesReadCount: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const [savedArticlesCount, setSavedArticlesCount] = useState(0);
  const [articlesReadCount, setArticlesReadCount] = useState(0);
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

      // Create abort controllers for timeouts
      const savedController = new AbortController();
      const readController = new AbortController();

      // Set timeouts
      const savedTimeout = setTimeout(() => savedController.abort(), 5000);
      const readTimeout = setTimeout(() => readController.abort(), 5000);

      try {
        // Execute queries with abort signals
        const [savedResult, readResult] = await Promise.all([
          // Fetch saved articles count
          supabase
            .from('saved_articles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .abortSignal(savedController.signal)
            .throwOnError(),

          // Fetch read articles count
          supabase
            .from('article_analytics')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action', 'read')
            .abortSignal(readController.signal)
            .throwOnError()
        ]);

        // Clear timeouts
        clearTimeout(savedTimeout);
        clearTimeout(readTimeout);

        // Handle the counts with type assertion
        const savedCount = (savedResult as CountQueryResponse).count ?? 0;
        const readCount = (readResult as CountQueryResponse).count ?? 0;
        
        setSavedArticlesCount(savedCount);
        setArticlesReadCount(readCount);
      } finally {
        // Clean up controllers
        savedController.abort();
        readController.abort();
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
    articlesReadCount,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

// Types for analytics tracking
export type AnalyticsAction = 'read' | 'save' | 'share';

export async function trackAnalytics(
  userId: string,
  articleId: string,
  action: AnalyticsAction
): Promise<void> {
  try {
    const { error } = await supabase
      .from('article_analytics')
      .insert([
        {
          user_id: userId,
          article_id: articleId,
          action,
          timestamp: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
  } catch (error) {
    console.error(`Error tracking ${action} analytics:`, error);
    throw error;
  }
}

// Hook to track article views
export function useArticleAnalytics(articleId: string) {
  const { user } = useAuth();

  const trackView = async () => {
    if (!user || !articleId) return;

    try {
      await trackAnalytics(user.id, articleId, 'read');
    } catch (error) {
      console.error('Error tracking article view:', error);
    }
  };

  // Track view on mount
  useEffect(() => {
    trackView();
  }, [articleId, user?.id]);

  return {
    trackView,
  };
}
