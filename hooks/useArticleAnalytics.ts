import { useRef, useEffect } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { analyticsService } from '../services/AnalyticsService';
import { Article } from '../types/supabase';

export const useArticleAnalytics = (article: Article | null) => {
  const viewStartTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const scrollDepthTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (article) {
      analyticsService.logArticleView({
        article_id: article.id,
        category: article.category?.name || 'Uncategorized',
        author: article.source_name || 'Unknown',
        source: article.source_name || 'Unknown',
      });
    }

    return () => {
      if (article) {
        const viewDuration = Math.round((Date.now() - viewStartTime.current) / 1000);
        analyticsService.logArticleReadTime({
          article_id: article.id,
          category: article.category?.name || 'Uncategorized',
          author: article.source_name || 'Unknown',
          reading_time: viewDuration,
          source: article.source_name || 'Unknown',
          scroll_depth: maxScrollDepth.current,
        });
      }

      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }
    };
  }, [article]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const scrollDepth = Math.min(
      100,
      Math.round(((contentOffset.y + layoutMeasurement.height) / contentSize.height) * 100)
    );

    if (scrollDepth > maxScrollDepth.current) {
      maxScrollDepth.current = scrollDepth;

      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }

      scrollDepthTimeout.current = setTimeout(() => {
        if (article) {
          analyticsService.logArticleScroll({
            article_id: article.id,
            category: article.category?.name || 'Uncategorized',
            scroll_depth: maxScrollDepth.current,
            source: article.source_name || 'Unknown',
            author: article.source_name || 'Unknown',
          });
        }
      }, 1500); // Debounce for 1.5s
    }
  };

  return { handleScroll };
}; 