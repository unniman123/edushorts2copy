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
import { useEffect, useRef } from 'react';
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
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Article>>(new Map());

  useEffect(() => {
    /**
     * Debounced batch handler for real-time updates - Performance optimized
     * Groups multiple rapid updates into batches to prevent excessive re-renders
     * @returns {void}
     */
    const flushPendingUpdates = () => {
      if (pendingUpdatesRef.current.size === 0) return;

      const updates = Array.from(pendingUpdatesRef.current.values());
      pendingUpdatesRef.current.clear();

      setNews(prev => {
        let newNews = [...prev];

        updates.forEach(article => {
          const existingIndex = newNews.findIndex(a => a.id === article.id);
          if (existingIndex >= 0) {
            newNews[existingIndex] = article;
          } else {
            // Insert new articles at the beginning, maintaining sort order
            newNews = [article, ...newNews];
          }
        });

        return newNews;
      });
    };

    /**
     * Handles real-time database events with debouncing for better performance
     * @param {RealtimePostgresChangesPayload<NewsRow>} payload - Real-time event payload
     * @returns {void}
     */
    const handleRealtimeEvent = (
      payload: RealtimePostgresChangesPayload<NewsRow>
    ) => {
      try {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newArticle = newsRowToArticle(payload.new);
          // Only process if no category filter or article matches current category
          if (!currentCategoryId || newArticle.category_id === currentCategoryId) {
            pendingUpdatesRef.current.set(newArticle.id, newArticle);
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const updatedArticle = newsRowToArticle(payload.new);
          pendingUpdatesRef.current.set(updatedArticle.id, updatedArticle);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = (payload.old as NewsRow).id;
          // Remove from pending updates if exists
          pendingUpdatesRef.current.delete(deletedId);
          // Immediately remove deleted articles
          setNews(prev => prev.filter(article => article.id !== deletedId));
          return; // Don't debounce deletes
        }

        // Debounce updates for better performance
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(flushPendingUpdates, 300);
      } catch (error) {
        console.error('Error handling realtime event:', error);
      }
    };

    const { channel, cleanup } = createChannel('news-changes');

    channel
      .on<NewsRow>('postgres_changes', { event: '*', schema: 'public', table: 'news' }, (payload) =>
        handleRealtimeEvent(payload)
      );

    return () => {
      // Cleanup timeouts and pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      pendingUpdatesRef.current.clear();
      cleanup();
    };
  }, [currentCategoryId, setNews]);
}; 