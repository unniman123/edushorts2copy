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
  loadMoreNews: () => void;
  refreshNews: () => void;
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

  // Set up real-time listener
  useNewsRealtime(setNews, currentCategoryId);

  useEffect(() => {
    fetchNews(currentCategoryId);
  }, [currentCategoryId, fetchNews]);

  const filterByCategory = useCallback((categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
  }, []);

  const loadMoreNews = useCallback(() => {
    fetchMore(currentCategoryId);
  }, [fetchMore, currentCategoryId]);

  const refreshNews = useCallback(() => {
    fetchNews(currentCategoryId);
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

export default NewsContext;
