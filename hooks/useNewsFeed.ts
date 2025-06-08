import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Article, NewsRow } from '../types/supabase';

const PAGE_SIZE = 10;

const newsRowToArticle = (newsRow: any): Article => ({
  ...newsRow,
  category: newsRow.categories,
});

export const useNewsFeed = () => {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const getBaseQuery = (categoryId: string | null) => {
    let query = supabase
      .from('news')
      .select('*, categories(*)')
      .eq('status', 'published');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    return query.order('created_at', { ascending: false });
  };

  const fetchNews = useCallback(async (categoryId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const query = getBaseQuery(categoryId).limit(PAGE_SIZE);
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (data) {
        const articles = data.map(newsRowToArticle);
        setNews(articles);
        setHasMore(articles.length === PAGE_SIZE);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoreNews = useCallback(async (categoryId: string | null) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const lastArticle = news[news.length - 1];
      if (!lastArticle) {
        setLoading(false);
        return;
      }
      const query = getBaseQuery(categoryId)
        .lt('created_at', lastArticle.created_at)
        .limit(PAGE_SIZE);
      
      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (data) {
        const newArticles = data.map(newsRowToArticle);
        setNews(prev => [...prev, ...newArticles]);
        setHasMore(newArticles.length === PAGE_SIZE);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load more news');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, news]);

  return {
    news,
    loading,
    error,
    hasMore,
    setNews, // Expose setNews for real-time updates
    fetchNews,
    loadMoreNews,
  };
}; 