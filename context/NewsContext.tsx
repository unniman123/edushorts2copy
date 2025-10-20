import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, createChannel, getActiveChannels } from '../utils/supabase';
import { Article, NewsRow, CategoryRow } from '../types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNewsFeed } from '../hooks/useNewsFeed';
import { useNewsRealtime } from '../hooks/useNewsRealtime';

interface NewsContextType {
  news: Article[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentCategoryId: string | null;
  filterByCategory: (categoryId: string | null) => void;
  loadMoreNews: () => Promise<void>;
  refreshNews: () => Promise<void>;
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
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const { news, loading, error, hasMore, setNews, fetchNews, loadMoreNews: fetchMore } = useNewsFeed();
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  // Set up real-time listener
  useNewsRealtime(setNews, currentCategoryId);

  useEffect(() => {
    // Skip fetch if we already have news data and haven't changed category
    // This prevents unnecessary refetch during auth transitions when component remounts
    if (news.length > 0 && !currentCategoryId && hasInitiallyFetched) {
      console.log('NewsContext: Skipping refetch - data already loaded');
      return;
    }

    // Fetch news if:
    // 1. No news data exists yet (initial load)
    // 2. Category has changed (user filter)
    // 3. First mount and no data
    fetchNews(currentCategoryId).then(() => {
      setHasInitiallyFetched(true);
    });
  }, [currentCategoryId, fetchNews]);

  const filterByCategory = useCallback((categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
  }, []);

  const loadMoreNews = useCallback(() => {
    return fetchMore(currentCategoryId);
  }, [fetchMore, currentCategoryId]);

  const refreshNews = useCallback(() => {
    return fetchNews(currentCategoryId);
  }, [fetchNews, currentCategoryId]);

  const value = {
    news,
    loading,
    error,
    hasMore,
    currentCategoryId,
    filterByCategory,
    loadMoreNews,
    refreshNews,
  };

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
};

export default NewsContext;
