import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, createChannel, getActiveChannels } from '../utils/supabase';
import { Article, NewsRow, CategoryRow } from '../types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NewsContextType {
  news: Article[];
  loading: boolean;
  error: string | null;
  refreshNews: () => Promise<void>;
  loadMoreNews: () => Promise<void>;
  filterByCategory: (categoryId: string | null) => void;
}

interface NewsRealtimePayload {
  new?: Record<string, any>;
  old?: Record<string, any>;
  [key: string]: any;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);

  // Helper function to convert NewsRow to Article
  const newsRowToArticle = async (newsRow: NewsRow): Promise<Article> => {
    let category: CategoryRow | undefined;
    if (newsRow.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', newsRow.category_id)
        .single();
      category = categoryData;
    }

    const timeAgo = getTimeAgo(new Date(newsRow.created_at));

    return {
      ...newsRow,
      category,
      timeAgo,
    };
  };

  // Fetch initial news data with timeout and retry
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      let query = supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (currentCategoryId) {
        query = query.eq('category_id', currentCategoryId);
      }

      // Race between fetch and timeout
      const { data, error: fetchError } = await Promise.race([
        query.limit(10),
        timeoutPromise
      ]) as { data: NewsRow[] | null; error: Error | null };

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const articlesPromises = data.map(newsRowToArticle);
        const articles = await Promise.allSettled(articlesPromises);

        // Filter out rejected promises and extract values from fulfilled ones
        const successfulArticles = articles
          .filter((result): result is PromiseFulfilledResult<Article> =>
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        if (successfulArticles.length > 0) {
          setNews(successfulArticles);
          setError(null);
        }
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      // Don't clear existing news on error
    } finally {
      setLoading(false);
    }
  };

  // Load more news (pagination) with timeout and error handling
  const loadMoreNews = async () => {
    if (loading || !news.length) return;

    try {
      setLoading(true);
      const lastArticle = news[news.length - 1];

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      let query = supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .lt('created_at', lastArticle.created_at)
        .order('created_at', { ascending: false });

      if (currentCategoryId) {
        query = query.eq('category_id', currentCategoryId);
      }

      // Race between fetch and timeout
      const { data, error: fetchError } = await Promise.race([
        query.limit(10),
        timeoutPromise
      ]) as { data: NewsRow[] | null; error: Error | null };

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const articlesPromises = data.map(newsRowToArticle);
        const articles = await Promise.allSettled(articlesPromises);

        // Filter out rejected promises and extract values from fulfilled ones
        const successfulArticles = articles
          .filter((result): result is PromiseFulfilledResult<Article> =>
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        if (successfulArticles.length > 0) {
          setNews(prev => [...prev, ...successfulArticles]);
          setError(null);
        }
      }
    } catch (err) {
      console.error('Error loading more news:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      // Only show error briefly and don't disrupt existing content
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Filter news by category
  const filterByCategory = (categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
  };

  // Handle realtime events
  const handleRealtimeEvent = async (rawPayload: NewsRealtimePayload, eventType: string) => {
    if (!news.length) return; // Don't update if no initial data

    try {
      switch (eventType) {
        case 'INSERT': {
          if (!rawPayload.new || typeof rawPayload.new !== 'object') return;
          const newsRow = rawPayload.new as NewsRow;
          const newArticle = await newsRowToArticle(newsRow);
          if (!currentCategoryId || newArticle.category_id === currentCategoryId) {
            setNews(prev => [newArticle, ...prev]);
          }
          break;
        }
        case 'UPDATE': {
          if (!rawPayload.new || typeof rawPayload.new !== 'object') return;
          const newsRow = rawPayload.new as NewsRow;
          const updatedArticle = await newsRowToArticle(newsRow);
          setNews(prev => prev.map(article =>
            article.id === updatedArticle.id ? updatedArticle : article
          ));
          break;
        }
        case 'DELETE': {
          const oldRecord = rawPayload.old as Partial<NewsRow>;
          if (!oldRecord?.id) return;
          setNews(prev => prev.filter(article => article.id !== oldRecord.id));
          break;
        }
      }
    } catch (error) {
      console.error(`Error processing ${eventType} event:`, error);
    }
  };

  // Initialize news data and handle retries
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeNews = async () => {
      console.log('NewsContext: Initializing news feed...');
      try {
        await fetchNews();
        console.log('NewsContext: Initial fetch completed');
      } catch (err) {
        console.error('Error fetching news:', err);
        if (retryCount < MAX_RETRIES && isMounted) {
          retryCount++;
          console.log(`Retrying news fetch (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(initializeNews, 1000 * retryCount);
          return;
        }
      } finally {
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    if (isInitialLoad) {
      initializeNews();
    }

    return () => {
      isMounted = false;
    };
  }, [currentCategoryId]);

  // Set up real-time subscription with error handling
  useEffect(() => {
    const STABLE_CHANNEL_ID = 'news-changes';
    let isSubscribed = true;

    // Check if channel already exists
    const activeChannels = getActiveChannels();
    const existingChannel = Object.values(activeChannels).find(
      ch => ch.topic === STABLE_CHANNEL_ID
    );

    if (existingChannel) {
      console.log('NewsContext: Reusing existing news channel');
      return () => {
        console.log('NewsContext: Cleaning up subscription (existing channel)');
        isSubscribed = false;
      };
    }

    console.log('NewsContext: Setting up real-time subscription...');
    let channelInstance;
    try {
      channelInstance = createChannel(STABLE_CHANNEL_ID);
    } catch (error) {
      console.error('Error creating channel:', error);
      return () => {
        isSubscribed = false;
      };
    }

    const { channel } = channelInstance;

    // Set up event handlers
    channel
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news',
          filter: 'status=eq.published',
        },
        async (payload: { [key: string]: any }) => {
          console.log('NewsContext: Received INSERT event');
          if (isSubscribed) {
            handleRealtimeEvent(payload as NewsRealtimePayload, 'INSERT');
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'news',
        },
        async (payload: { [key: string]: any }) => {
          console.log('NewsContext: Received UPDATE event');
          if (isSubscribed) {
            handleRealtimeEvent(payload as NewsRealtimePayload, 'UPDATE');
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'news',
        },
        async (payload: { [key: string]: any }) => {
          console.log('NewsContext: Received DELETE event');
          if (isSubscribed) {
            handleRealtimeEvent(payload as NewsRealtimePayload, 'DELETE');
          }
        }
      );

    return () => {
      isSubscribed = false;
      // Don't cleanup the channel here - let the global channel management handle it
    };
  }, []);

  return (
    <NewsContext.Provider
      value={{
        news,
        loading,
        error,
        refreshNews: fetchNews,
        loadMoreNews,
        filterByCategory,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

// Helper function to format time ago
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};
