/**
 * useNewsRealtime - Custom hook for managing real-time news updates via Supabase
 * 
 * Provides real-time synchronization of news articles using Supabase's real-time
 * subscriptions. Automatically handles INSERT, UPDATE, and DELETE operations
 * with category filtering support. Maintains local state synchronization with
 * database changes and proper cleanup on unmount.
 * 
 * @hook
 * @param {React.Dispatch<React.SetStateAction<Article[]>>} setNews - State setter for news articles
 * @param {string | null} currentCategoryId - Current category filter ID, null for all categories
 * @returns {void} This hook manages side effects only
 * 
 * @example
 * const [news, setNews] = useState<Article[]>([]);
 * const [categoryId, setCategoryId] = useState<string | null>(null);
 * 
 * // Enable real-time updates
 * useNewsRealtime(setNews, categoryId);
 * 
 * // Real-time updates will automatically sync with the news state
 */
import { useEffect } from 'react';
import { supabase, createChannel } from '../utils/supabase';
import { Article, NewsRow } from '../types/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Converts a raw news row from Supabase to an Article object
 * Handles the category relationship mapping for proper typing
 * @param {any} newsRow - Raw news row from Supabase
 * @returns {Article} Formatted article object
 */
const newsRowToArticle = (newsRow: any): Article => ({
  ...newsRow,
  category: newsRow.categories,
});

export const useNewsRealtime = (
  setNews: React.Dispatch<React.SetStateAction<Article[]>>,
  currentCategoryId: string | null
): void => {
  useEffect(() => {
    /**
     * Handles real-time database events for news articles
     * Processes INSERT, UPDATE, and DELETE operations with category filtering
     * @param {RealtimePostgresChangesPayload<NewsRow>} payload - Real-time event payload
     * @returns {void}
     */
    const handleRealtimeEvent = (
      payload: RealtimePostgresChangesPayload<NewsRow>
    ) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newArticle = newsRowToArticle(payload.new);
        // Only add to state if no category filter or article matches current category
        if (!currentCategoryId || newArticle.category_id === currentCategoryId) {
          setNews(prev => [newArticle, ...prev.filter(a => a.id !== newArticle.id)]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updatedArticle = newsRowToArticle(payload.new);
        setNews(prev =>
          prev.map(article =>
            article.id === updatedArticle.id ? updatedArticle : article
          )
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setNews(prev => prev.filter(article => article.id !== (payload.old as NewsRow).id));
      }
    };

    const { channel, cleanup } = createChannel('news-changes');

    channel
      .on<NewsRow>('postgres_changes', { event: '*', schema: 'public', table: 'news' }, (payload) =>
        handleRealtimeEvent(payload)
      );

    return () => {
      cleanup();
    };
  }, [currentCategoryId, setNews]);
}; 