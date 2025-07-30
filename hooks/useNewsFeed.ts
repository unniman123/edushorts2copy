/**
 * useNewsFeed - Custom hook for managing news feed data with pagination and filtering
 * 
 * Provides state management for news articles with support for category filtering,
 * pagination, and loading states. Handles initial fetch, category-based filtering,
 * and infinite scroll functionality with proper error handling and loading states.
 * 
 * @hook
 * @returns {UseNewsFeedReturn} Object containing news feed state and methods
 * 
 * @example
 * const { news, loading, error, hasMore, fetchNews, loadMoreNews } = useNewsFeed();
 * 
 * // Initial fetch with category filter
 * useEffect(() => {
 *   fetchNews('scholarship-category-id');
 * }, []);
 * 
 * // Load more articles for infinite scroll
 * const handleLoadMore = () => {
 *   loadMoreNews(currentCategoryId);
 * };
 */
import { useState, useCallback, useEffect } from 'react';
import { Article } from '../types/supabase';
import { newsService } from '../services/newsService';

/**
 * Return type for useNewsFeed hook
 * @interface UseNewsFeedReturn
 */
interface UseNewsFeedReturn {
  /** Array of news articles */
  news: Article[];
  /** Loading state indicator */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether more articles are available for pagination */
  hasMore: boolean;
  /** Function to set news articles directly */
  setNews: React.Dispatch<React.SetStateAction<Article[]>>;
  /** Function to fetch initial news articles with category filter */
  fetchNews: (categoryId: string | null) => Promise<void>;
  /** Function to load more articles for pagination */
  loadMoreNews: (categoryId: string | null) => Promise<void>;
}

export const useNewsFeed = (): UseNewsFeedReturn => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  /**
   * Fetches initial news articles with optional category filtering
   * Resets pagination state and loads first page of articles
   * @param {string | null} categoryId - Category ID to filter by, null for all categories
   * @returns {Promise<void>} Promise that resolves when fetch is complete
   */
  const fetchNews = useCallback(async (categoryId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedArticles = await newsService.getArticles({
        categoryId,
        page: 1,
        limit: 10,
      });
      setNews(fetchedArticles);
      setPage(2);
      setHasMore(fetchedArticles.length > 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Loads more articles for pagination (infinite scroll)
   * Appends new articles to existing ones and updates pagination state
   * @param {string | null} categoryId - Category ID to filter by, null for all categories
   * @returns {Promise<void>} Promise that resolves when load is complete
   */
  const loadMoreNews = useCallback(async (categoryId: string | null) => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const fetchedArticles = await newsService.getArticles({
        categoryId,
        page,
        limit: 10,
      });

      if (fetchedArticles.length > 0) {
        setNews(prevNews => [...prevNews, ...fetchedArticles]);
        setPage(prevPage => prevPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  return {
    news,
    loading,
    error,
    hasMore,
    setNews,
    fetchNews,
    loadMoreNews,
  };
}; 