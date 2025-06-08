import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { analyticsService } from '../services/AnalyticsService';

export const useArticle = (articleId: string | null) => {
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