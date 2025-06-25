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

interface NewsCardImageProps {
  article: Article;
  isSmallDevice: boolean;
  imageHeightAnim: Animated.Value;
  onImageDoubleTap: () => void;
  imageLoaded: boolean;
  onImageLoad: () => void;
}

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

  const handleImageDoubleTap = useCallback(() => {
    onImageDoubleTap();
  }, [onImageDoubleTap]);

  const handleImageLoadStart = useCallback(() => {
    imageLoadStartTime.current = Date.now();
  }, []);

  const handleImageLoad = useCallback(() => {
    const loadTime = Date.now() - imageLoadStartTime.current;
    performanceMonitor.current.recordImageLoad(article.image_path!, loadTime, 0);
    onImageLoad();
  }, [article.image_path, onImageLoad]);

  const handleImageError = useCallback(() => {
    onImageLoad();
  }, [onImageLoad]);

  return (
    <Animated.View style={[
      styles.imageContainer,
      {
        height: imageHeightAnim.interpolate({
          inputRange: [1, 1.4],
          outputRange: [height * (isSmallDevice ? 0.33 : 0.38), height * (isSmallDevice ? 0.46 : 0.53)]
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
                  outputRange: [height * (isSmallDevice ? 0.33 : 0.38), height * (isSmallDevice ? 0.46 : 0.53)]
                })
              }
            ]}
            resizeMethod="resize"
            progressiveRenderingEnabled={true}
            onLoadStart={handleImageLoadStart}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Text style={styles.noImageText}>No Image Available</Text>
        </View>
      )}
      <View style={styles.logoOverlay}>
        <Text style={styles.logoText}>Edushorts</Text>
      </View>
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
  logoOverlay: {
    position: 'absolute',
    top: SPACING.LG,
    left: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND_OVERLAY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SMALL,
  },
  logoText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
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
});

export default NewsCardImage; 