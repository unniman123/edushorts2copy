/**
 * NewsCard - Full-screen interactive news article card with advanced features
 * 
 * A comprehensive news article display component featuring full-screen layout,
 * responsive design, image optimization, double-tap zoom, bookmark functionality,
 * sharing capabilities, and deep linking. Uses React.memo for performance optimization
 * and includes adaptive text sizing, progressive image loading, and smooth animations.
 * 
 * @component
 * @param {NewsCardProps} props - Component properties
 * @returns {React.ReactElement} The rendered news card component
 * 
 * @example
 * <NewsCard
 *   article={articleData}
 * />
 */
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
import { useGuestAuth } from '../hooks/useGuestAuth';
import AuthPromptModal from './AuthPromptModal';
import { COLORS, RESPONSIVE } from '../constants/theme';

import NewsCardImage from './news/NewsCardImage';
import NewsCardContent from './news/NewsCardContent';
import NewsCardActions from './news/NewsCardActions';

/**
 * Props interface for NewsCard component
 * @interface NewsCardProps
 */
interface NewsCardProps {
  /** Article data containing title, content, image, and metadata */
  article: Article;
}

const NewsCard: React.FC<NewsCardProps> = memo(({ article }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isSmallDevice, setIsSmallDevice] = useState(windowWidth < RESPONSIVE.SMALL_DEVICE_WIDTH);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const imageOptimizer = useRef(ImageOptimizer.getInstance());
  const imageHeightAnim = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);

  /**
   * Calculates adaptive summary lines based on title length, device size, and available screen height
   * Optimizes text display by adjusting summary line count based on title space usage and screen real estate
   * @returns {number} Number of summary lines to display
   */
  const summaryLines = useMemo(() => {
    const titleLength = article.title.length;
    // Adjusted for smaller title font size - more characters per line
    const avgCharsPerLine = isSmallDevice ? RESPONSIVE.CHARS_PER_LINE.SMALL.TITLE : RESPONSIVE.CHARS_PER_LINE.LARGE.TITLE;
    const estimatedTitleLines = Math.ceil(titleLength / avgCharsPerLine);

    // Enhanced calculation with screen height consideration
    const availableHeight = windowHeight - 400; // Subtract fixed elements height (image, category, buttons)
    const lineHeight = isSmallDevice ? 25 : 27;
    const maxPossibleLines = Math.floor(availableHeight / lineHeight);

    // Base lines with screen height adaptation
    const baseLines = isSmallDevice ? RESPONSIVE.BASE_LINES.SMALL : RESPONSIVE.BASE_LINES.LARGE;
    const adaptiveBaseLines = Math.max(baseLines, Math.min(20, maxPossibleLines));

    if (estimatedTitleLines > 2) {
      const reduction = Math.min(1, estimatedTitleLines - 2);
      return Math.max(12, adaptiveBaseLines - reduction);
    }

    return adaptiveBaseLines;
  }, [article.title, isSmallDevice, windowHeight]);

  /**
   * Simplified adaptive margins for responsive text layout
   * Since read more button is now fixed position, we only need summary margin
   * @returns {Object} Margin configuration object
   */
  const adaptiveMargins = useMemo(() => {
    return {
      summaryMarginBottom: isSmallDevice ? 8 : 12,
      readMoreMarginTop: 0, // Not used with fixed positioning
      readMoreMarginBottom: 0, // Not used with fixed positioning
    };
  }, [isSmallDevice]);

  /**
   * Simplified space calculation for fixed button layout
   * Calculates optimal summary lines based on available space above fixed button
   * @returns {Object} Smart spacing configuration with enhanced summary lines
   */
  const smartSpaceCalculation = useMemo(() => {
    const screenHeight = windowHeight;
    const fixedButtonHeight = 40; // Reduced button area height
    const fixedElementsHeight = 280; // Optimized fixed elements (image, category, minimal margins)

    // Calculate available space for content with aggressive space utilization
    const availableContentHeight = screenHeight - fixedElementsHeight - fixedButtonHeight;
    const lineHeight = isSmallDevice ? 22 : 24; // Tighter line height like Inshorts
    const titleLines = Math.ceil(article.title.length / (isSmallDevice ? 35 : 40)); // More characters per line
    const titleHeight = titleLines * (isSmallDevice ? 20 : 22); // Reduced title line height

    // Calculate maximum summary lines with minimal margins
    const availableSummaryHeight = availableContentHeight - titleHeight - 20; // Reduced margins
    const maxSummaryLines = Math.floor(availableSummaryHeight / lineHeight);

    // More aggressive line calculation - prioritize content over whitespace
    const enhancedSummaryLines = Math.max(12, Math.min(maxSummaryLines, summaryLines + 4));

    return {
      adaptiveBottomPadding: 0, // Not needed with fixed positioning
      bonusSummaryLines: 0, // Calculated differently now
      enhancedSummaryLines
    };
  }, [windowHeight, article.title.length, summaryLines, isSmallDevice]);

  const styles = useMemo(() => createStyleSheet(windowWidth, windowHeight), [windowWidth, windowHeight]);

  useEffect(() => {
    setIsSmallDevice(windowWidth < RESPONSIVE.SMALL_DEVICE_WIDTH);
  }, [windowWidth]);

  useEffect(() => {
    if (article.image_path && typeof article.image_path === 'string') {
      // Start preloading in background without blocking UI render.
      imageOptimizer.current.preloadImage(article.image_path!).catch(error => {
        console.error('Failed to preload image (background):', error);
      });
    }
  }, [article.image_path]);

  const [showIcons, setShowIcons] = useState(false);
  const { savedArticles, addBookmark, removeBookmark } = useSavedArticles();
  const { 
    isGuest, 
    promptForAuth, 
    modalVisible, 
    modalContent, 
    closeModal, 
    handleModalSignIn, 
    handleModalCreateAccount 
  } = useGuestAuth();
  const isSaved = savedArticles.some(saved => saved.id === article.id);

  /**
   * Handles source link press to open article in external browser
   * @returns {void}
   */
  const handleSourceLinkPress = useCallback(() => {
    if (article.source_url) {
      Linking.openURL(article.source_url).catch(err => {
        console.error("Couldn't load page", err);
      });
    }
  }, [article.source_url]);

  /**
   * Handles article sharing with deep link generation and tracking
   * Creates Branch.io deep link and shares via native share API
   * @returns {Promise<void>} Promise that resolves when sharing is complete
   * @throws {Error} When sharing fails
   */
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

  /**
   * Handles bookmark toggle with user feedback
   * Shows auth prompt for guests, adds/removes article from saved articles for authenticated users
   * @returns {void}
   */
  const handleSaveToggle = useCallback(() => {
    if (isGuest) {
      // Show contextual auth prompt for guest users
      promptForAuth('bookmarks', `Sign in to save "${article.title}" and access it anywhere.`);
      return;
    }

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
  }, [article.id, article.title, isSaved, removeBookmark, addBookmark, isGuest, promptForAuth]);

  /**
   * Handles image double-tap for zoom functionality
   * Implements double-tap detection and smooth zoom animation with auto-reset
   * @returns {void}
   */
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
      />

      <NewsCardContent
        article={article}
        isSmallDevice={isSmallDevice}
        onSourceLinkPress={handleSourceLinkPress}
      />

      {showIcons && (
        <NewsCardActions
          isSaved={isSaved}
          onSaveToggle={handleSaveToggle}
          onShare={handleShare}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={modalVisible}
        onClose={closeModal}
        onSignIn={handleModalSignIn}
        onCreateAccount={handleModalCreateAccount}
        context={modalContent.context}
        title={modalContent.title}
        message={modalContent.message}
        loginText={modalContent.loginText}
      />
    </TouchableOpacity>
  );
});

const createStyleSheet = (width: number, height: number) => StyleSheet.create({
  fullScreenCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    height: height,
    width: width,
    overflow: 'hidden', // Ensure clean edges and prevent content overflow
    borderRadius: 0, // No border radius on main container to avoid edge conflicts
    margin: 0, // Ensure no margins prevent edge-to-edge display
    padding: 0, // Ensure no padding prevents edge-to-edge display
  },
});

export default NewsCard;
