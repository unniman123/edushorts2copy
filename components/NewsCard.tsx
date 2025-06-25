import React, { useState, memo, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  InteractionManager,
  Animated,
  Linking,
  Share,
} from 'react-native';
import ImageOptimizer from '../utils/ImageOptimizer';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';
import { Article } from '../types/supabase';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { showToast } from '../utils/toast';
import DeepLinkHandler from '../services/DeepLinkHandler';
import { COLORS, RESPONSIVE } from '../constants/theme';

import NewsCardImage from './news/NewsCardImage';
import NewsCardContent from './news/NewsCardContent';
import NewsCardActions from './news/NewsCardActions';

interface NewsCardProps {
  article: Article;
}

const NewsCard: React.FC<NewsCardProps> = memo(({ article }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isSmallDevice, setIsSmallDevice] = useState(windowWidth < RESPONSIVE.SMALL_DEVICE_WIDTH);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const imageOptimizer = useRef(ImageOptimizer.getInstance());
  const imageHeightAnim = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);

  const summaryLines = useMemo(() => {
    const titleLength = article.title.length;
    // Adjusted for smaller title font size - more characters per line
    const avgCharsPerLine = isSmallDevice ? RESPONSIVE.CHARS_PER_LINE.SMALL.TITLE : RESPONSIVE.CHARS_PER_LINE.LARGE.TITLE;
    const estimatedTitleLines = Math.ceil(titleLength / avgCharsPerLine);
    // Increased base lines due to title size reduction freeing up space
    const baseLines = isSmallDevice ? RESPONSIVE.BASE_LINES.SMALL : RESPONSIVE.BASE_LINES.LARGE;
    
    if (estimatedTitleLines > 2) {
      const reduction = Math.min(1, estimatedTitleLines - 2);
      return Math.max(12, baseLines - reduction);
    }
    
    return baseLines;
  }, [article.title, isSmallDevice]);

  const adaptiveMargins = useMemo(() => {
    const titleLength = article.title.length;
    const avgCharsPerLine = isSmallDevice ? RESPONSIVE.CHARS_PER_LINE.SMALL.SUMMARY : RESPONSIVE.CHARS_PER_LINE.LARGE.SUMMARY;
    const estimatedTitleLines = Math.ceil(titleLength / avgCharsPerLine);
    
    // Since read more button is now positioned absolutely, we need less bottom margin
    if (estimatedTitleLines > 3) {
      return {
        summaryMarginBottom: isSmallDevice ? 4 : 6,
        readMoreMarginTop: 0, // Not used anymore
        readMoreMarginBottom: isSmallDevice ? 4 : 6,
      };
    }
    
    return {
      summaryMarginBottom: isSmallDevice ? 6 : 8,
      readMoreMarginTop: 0, // Not used anymore  
      readMoreMarginBottom: isSmallDevice ? 6 : 8,
    };
  }, [article.title, isSmallDevice]);

  const styles = useMemo(() => createStyleSheet(windowWidth, windowHeight), [windowWidth, windowHeight]);

  useEffect(() => {
    setIsSmallDevice(windowWidth < RESPONSIVE.SMALL_DEVICE_WIDTH);
  }, [windowWidth]);

  useEffect(() => {
    if (article.image_path && typeof article.image_path === 'string') {
      const loadImage = async () => {
        try {
          await imageOptimizer.current.preloadImage(article.image_path!);
          InteractionManager.runAfterInteractions(() => {
            setImageLoaded(true);
          });
        } catch (error) {
          console.error('Failed to preload image:', error);
          setImageLoaded(true);
        }
      };
      loadImage();
    }
    return () => {
      setImageLoaded(false);
    };
  }, [article.image_path]);

  const [showIcons, setShowIcons] = useState(false);
  const { savedArticles, addBookmark, removeBookmark } = useSavedArticles();
  const isSaved = savedArticles.some(saved => saved.id === article.id);

  const handleSourceLinkPress = useCallback(() => {
    if (article.source_url) {
      Linking.openURL(article.source_url).catch(err => {
        console.error("Couldn't load page", err);
      });
    }
  }, [article.source_url]);

  const handleShare = useCallback(async () => {
    try {
      const deepLinkHandler = DeepLinkHandler.getInstance();
      const branchUrl = await deepLinkHandler.createBranchLink(
        article.id,
        article.title,
        article.summary,
        article.image_path || undefined
      );
      const message = `Check out this article in Edushorts: ${article.title}\n\n${branchUrl}`;
      await Share.share({
        message: message,
        url: branchUrl,
        title: article.title,
      });
      deepLinkHandler.trackArticleShare(article.id, 'news_card');
    } catch (error: any) {
      console.error('Error sharing article:', error.message);
      showToast('error', 'Error sharing article');
    }
  }, [article.id, article.title, article.summary, article.image_path]);

  const handleSaveToggle = useCallback(() => {
    try {
      if (isSaved) {
        removeBookmark(article.id);
        showToast('success', 'Article removed from bookmarks');
      } else {
        addBookmark(article.id);
        showToast('success', 'Article saved to bookmarks');
      }
    } catch (error: any) {
      console.error('Error saving/unsaving article:', error.message);
      showToast('error', 'Error updating bookmarks');
    }
  }, [article.id, isSaved, removeBookmark, addBookmark]);

  const handleImageDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      const toValue = isImageExpanded ? 1 : 1.4;
      if (!isImageExpanded) setIsImageExpanded(true);

      Animated.timing(imageHeightAnim, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        if (toValue === 1) setIsImageExpanded(false);
      });

      if (toValue === 1.4) {
        setTimeout(() => {
          if (lastTapRef.current === now) {
            Animated.timing(imageHeightAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }).start(() => setIsImageExpanded(false));
          }
        }, 3000);
      }
    }
    lastTapRef.current = now;
  }, [isImageExpanded, imageHeightAnim]);

  return (
    <TouchableOpacity
      style={styles.fullScreenCard}
      onPress={() => setShowIcons(prev => !prev)}
      activeOpacity={0.98}
    >
      <NewsCardImage
        article={article}
        isSmallDevice={isSmallDevice}
        imageHeightAnim={imageHeightAnim}
        onImageDoubleTap={handleImageDoubleTap}
        imageLoaded={imageLoaded}
        onImageLoad={() => setImageLoaded(true)}
      />
      
      <NewsCardContent
        article={article}
        isSmallDevice={isSmallDevice}
        summaryLines={summaryLines}
        adaptiveMargins={adaptiveMargins}
        onSourceLinkPress={handleSourceLinkPress}
      />

      {showIcons && (
        <NewsCardActions
          isSaved={isSaved}
          onSaveToggle={handleSaveToggle}
          onShare={handleShare}
        />
      )}
    </TouchableOpacity>
  );
});

const createStyleSheet = (width: number, height: number) => StyleSheet.create({
  fullScreenCard: {
    flex: 1, 
    backgroundColor: COLORS.WHITE,
    height: height, 
    width: width,   
  },
});

export default NewsCard;
