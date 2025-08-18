/**
 * NewsCardImage - Animated image component for news cards with performance monitoring
 * 
 * Renders article images with double-tap zoom functionality, progressive loading,
 * performance monitoring, and fallback handling. Features smooth animations using
 * Animated.Value for height transitions and includes branded logo overlay.
 * Optimized for performance with load time tracking and error handling.
 * 
 * @component
 * @param {NewsCardImageProps} props - Component properties
 * @returns {React.ReactElement} The rendered news card image component
 * 
 * @example
 * <NewsCardImage
 *   article={articleData}
 *   isSmallDevice={isSmallDevice}
 *   imageHeightAnim={animatedValue}
 *   onImageDoubleTap={() => handleZoom()}
 *   imageLoaded={isLoaded}
 *   onImageLoad={() => setImageLoaded(true)}
 * />
 */
import React, { useRef, useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Article } from '../../types/supabase';
import PerformanceMonitoringService from '../../services/PerformanceMonitoringService';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';

/**
 * Props interface for NewsCardImage component
 * @interface NewsCardImageProps
 */
interface NewsCardImageProps {
  /** Article data containing image path and metadata */
  article: Article;
  /** Whether the device is considered small for responsive sizing */
  isSmallDevice: boolean;
  /** Animated value for controlling image height transitions */
  imageHeightAnim: Animated.Value;
  /** Callback function for double-tap zoom gesture */
  onImageDoubleTap: () => void;
  /** Whether the image has finished loading */
  imageLoaded: boolean;
  /** Callback function called when image finishes loading */
  onImageLoad: () => void;
}

/**
 * Screen height constant for responsive image sizing
 * @constant {number}
 */
const { height } = Dimensions.get('window');

const NewsCardImage: React.FC<NewsCardImageProps> = memo(({
  article,
  isSmallDevice,
  imageHeightAnim,
  onImageDoubleTap,
  imageLoaded,
  onImageLoad,
}) => {
  const performanceMonitor = useRef(PerformanceMonitoringService.getInstance());
  const imageLoadStartTime = useRef(0);

  /**
   * Handles double-tap gesture for zoom functionality
   * @returns {void}
   */
  const handleImageDoubleTap = useCallback(() => {
    onImageDoubleTap();
  }, [onImageDoubleTap]);

  /**
   * Handles image load start for performance monitoring
   * Records timestamp for load time calculation
   * @returns {void}
   */
  const handleImageLoadStart = useCallback(() => {
    imageLoadStartTime.current = Date.now();
  }, []);

  /**
   * Handles successful image load with performance tracking
   * Records load time metrics and triggers callback
   * @returns {void}
   */
  const handleImageLoad = useCallback(() => {
    const loadTime = Date.now() - imageLoadStartTime.current;
    performanceMonitor.current.recordImageLoad(article.image_path!, loadTime, 0);
    onImageLoad();
  }, [article.image_path, onImageLoad]);

  /**
   * Handles image load error with graceful fallback
   * @returns {void}
   */
  const handleImageError = useCallback(() => {
    onImageLoad();
  }, [onImageLoad]);

  return (
    <Animated.View style={[
      styles.imageContainer,
      {
        height: imageHeightAnim.interpolate({
          inputRange: [1, 1.4],
          outputRange: [height * 0.39, height * 0.546]
        })
      }
    ]}>
      {article.image_path ? (
        <TouchableOpacity
          onPress={handleImageDoubleTap}
          activeOpacity={0.95}
          style={styles.imageWrapper}
        >
          <Animated.Image
            source={{ uri: article.image_path }}
            style={[
              styles.cardImage,
              !imageLoaded && styles.imageLoading,
              {
                height: imageHeightAnim.interpolate({
                  inputRange: [1, 1.4],
                  outputRange: [height * 0.38, height * 0.536]
                })
              }
            ]}
            resizeMethod="resize"
            progressiveRenderingEnabled={true}
            onLoadStart={handleImageLoadStart}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Category overlay positioned on image */}
          <View style={[styles.categoryOverlay, isSmallDevice && styles.categoryOverlaySmall]}>
            <Text style={styles.categoryOverlayText} numberOfLines={1}>
              {article.category?.name || 'General'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Text style={styles.noImageText}>No Image Available</Text>
          
          {/* Category overlay for no-image state */}
          <View style={[styles.categoryOverlay, isSmallDevice && styles.categoryOverlaySmall, styles.categoryOverlayNoImage]}>
            <Text style={styles.categoryOverlayText} numberOfLines={1}>
              {article.category?.name || 'General'}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
});

NewsCardImage.displayName = 'NewsCardImage';

const styles = StyleSheet.create({
  cardImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: COLORS.GRAY_100,
  },
  imageLoading: {
    opacity: 0.7,
  },
  noImage: {
    backgroundColor: COLORS.GRAY_50,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  noImageText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.GRAY_500,
    textAlign: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  // Category overlay styles - positioned on image for space optimization
  categoryOverlay: {
    position: 'absolute',
    top: SPACING.XXL,
    left: SPACING.XXXL,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MEDIUM,
    maxWidth: '60%',
    // Enhanced visibility with shadow
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  categoryOverlaySmall: {
    top: SPACING.XXL,
    left: SPACING.XXL,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
  },
  categoryOverlayText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    textAlign: 'center',
  },
  categoryOverlayNoImage: {
    // Darker background for better contrast on gray background
    backgroundColor: COLORS.PRIMARY_DARK,
  },
});

export default NewsCardImage; 