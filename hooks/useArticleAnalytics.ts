/**
 * useArticleAnalytics - Custom hook for tracking article reading analytics and user engagement
 * 
 * Provides comprehensive article analytics tracking including view time, scroll depth,
 * and reading behavior. Automatically tracks article views on mount, measures reading
 * time, and provides scroll event handlers for engagement tracking. Includes debounced
 * scroll tracking and cleanup on unmount with proper analytics service integration.
 * 
 * @hook
 * @param {Article | null} article - The article to track analytics for
 * @returns {UseArticleAnalyticsReturn} Object containing analytics tracking methods
 * 
 * @example
 * const { handleScroll } = useArticleAnalytics(article);
 * 
 * // Use in ScrollView
 * <ScrollView
 *   onScroll={handleScroll}
 *   scrollEventThrottle={16}
 * >
 *   Article content
 * </ScrollView>
 * 
 * // Analytics will automatically track:
 * // - Article view on mount
 * // - Reading time on unmount
 * // - Scroll depth with debouncing
 */
import { useRef, useEffect } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { analyticsService } from '../services/AnalyticsService';
import { Article } from '../types/supabase';

/**
 * Return type for useArticleAnalytics hook
 * @interface UseArticleAnalyticsReturn
 */
interface UseArticleAnalyticsReturn {
  /** Scroll event handler for tracking scroll depth and engagement */
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const useArticleAnalytics = (article: Article | null): UseArticleAnalyticsReturn => {
  /**
   * Timestamp when article viewing started
   */
  const viewStartTime = useRef(Date.now());
  
  /**
   * Maximum scroll depth reached during article reading
   */
  const maxScrollDepth = useRef(0);
  
  /**
   * Timeout reference for debounced scroll tracking
   */
  const scrollDepthTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (article) {
      // Track article view when component mounts
      analyticsService.logArticleView({
        article_id: article.id,
        category: article.category?.name || 'Uncategorized',
        author: article.source_name || 'Unknown',
        source: article.source_name || 'Unknown',
      });
    }

    return () => {
      if (article) {
        // Track reading time when component unmounts
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

      // Clean up scroll timeout
      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }
    };
  }, [article]);

  /**
   * Handles scroll events for tracking user engagement and scroll depth
   * Calculates scroll percentage and tracks maximum depth reached with debouncing
   * @param {NativeSyntheticEvent<NativeScrollEvent>} event - Scroll event from React Native
   * @returns {void}
   */
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Calculate scroll depth as percentage (0-100)
    const scrollDepth = Math.min(
      100,
      Math.round(((contentOffset.y + layoutMeasurement.height) / contentSize.height) * 100)
    );

    // Update maximum scroll depth if current depth is greater
    if (scrollDepth > maxScrollDepth.current) {
      maxScrollDepth.current = scrollDepth;

      // Clear existing timeout to debounce scroll tracking
      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }

      // Debounce scroll tracking to avoid excessive analytics calls
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