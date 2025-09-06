/**
 * useArticle - Custom hook for managing individual article data and bookmark functionality
 * 
 * Provides state management for a single article with loading states, error handling,
 * and bookmark functionality. Automatically fetches article data based on article ID
 * and integrates with the saved articles context for bookmark management. Includes
 * analytics tracking for bookmark actions.
 * 
 * @hook
 * @param {string | null} articleId - The ID of the article to fetch
 * @returns {UseArticleReturn} Object containing article state and bookmark methods
 * 
 * @example
 * const { 
 *   article, 
 *   loading, 
 *   error, 
 *   isBookmarked, 
 *   toggleBookmark 
 * } = useArticle('article-id-123');
 * 
 * // Handle bookmark toggle
 * const handleBookmark = async () => {
 *   await toggleBookmark();
 * };
 */
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { analyticsService } from '../services/AnalyticsService';

/**
 * Return type for useArticle hook
 * @interface UseArticleReturn
 */
interface UseArticleReturn {
  /** Article data or null if not loaded */
  article: Article | null;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the article is currently bookmarked */
  isBookmarked: boolean;
  /** Loading state for bookmark operations */
  isBookmarkLoading: boolean;
  /** Function to toggle bookmark status */
  toggleBookmark: () => Promise<void>;
}

export const useArticle = (articleId: string | null): UseArticleReturn => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    savedArticles,
    addBookmark,
    removeBookmark,
    isLoading: isBookmarkLoading,
  } = useSavedArticles();

  const isBookmarked = savedArticles.some(a => a.id === articleId);

  useEffect(() => {
    /**
     * Fetches article data from Supabase with category information
     * @returns {Promise<void>} Promise that resolves when fetch is complete
     */
    const fetchArticle = async () => {
      if (!articleId) {
        setLoading(false);
        setError('Article ID is missing.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('news')
          .select('*, category:category_id(*)')
          .eq('id', articleId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setArticle(data as Article);
        } else {
          setError('Article not found.');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch article.');
        console.error('Error fetching article:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  /**
   * Toggles bookmark status for the current article
   * Handles both adding and removing bookmarks with analytics tracking
   * @returns {Promise<void>} Promise that resolves when bookmark operation is complete
   */
  const toggleBookmark = async () => {
    if (!article) return;

    try {
      if (isBookmarked) {
        await removeBookmark(article.id);
      } else {
        await addBookmark(article.id);
        analyticsService.logArticleBookmark({
          article_id: article.id,
          category: article.category?.name || 'Uncategorized',
          author: article.source_name || 'Unknown',
          source: article.source_name || 'Unknown',
          interaction_type: 'bookmark',
        });
      }
    } catch (e) {
      // Error is handled in the context, but we can log it here if needed
      console.error('Error toggling bookmark from hook:', e);
    }
  };

  return {
    article,
    loading,
    error,
    isBookmarked,
    isBookmarkLoading,
    toggleBookmark,
  };
}; 