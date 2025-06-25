import { useState, useCallback, useEffect } from 'react';
import { Article } from '../types/supabase';
import { newsService } from '../services/newsService';

export const useNewsFeed = () => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

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