import { useEffect } from 'react';
import { supabase, createChannel } from '../utils/supabase';
import { Article, NewsRow } from '../types/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const newsRowToArticle = (newsRow: any): Article => ({
  ...newsRow,
  category: newsRow.categories,
});

export const useNewsRealtime = (
  setNews: React.Dispatch<React.SetStateAction<Article[]>>,
  currentCategoryId: string | null
) => {
  useEffect(() => {
    const handleRealtimeEvent = (
      payload: RealtimePostgresChangesPayload<NewsRow>
    ) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newArticle = newsRowToArticle(payload.new);
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