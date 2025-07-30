/**
 * NewsCardContent - Content area component for news cards with adaptive text layout
 * 
 * Renders the main content area of news cards including title, summary, category tag,
 * and source link. Features adaptive text sizing based on content length and device size,
 * white extension area that overlaps the image for visual continuity, and optimized
 * scrolling performance. Uses memoization for timestamp calculations and responsive
 * styling for different screen sizes.
 * 
 * @component
 * @param {NewsCardContentProps} props - Component properties
 * @returns {React.ReactElement} The rendered news card content component
 * 
 * @example
 * <NewsCardContent
 *   article={articleData}
 *   isSmallDevice={isSmallDevice}
 *   summaryLines={calculatedLines}
 *   adaptiveMargins={marginConfig}
 *   onSourceLinkPress={() => openSourceLink()}
 * />
 */
import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Article } from '../../types/supabase';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  getResponsiveFontSize,
  getResponsiveSpacing
} from '../../constants/theme';

/**
 * Props interface for NewsCardContent component
 * @interface NewsCardContentProps
 */
interface NewsCardContentProps {
  /** Article data containing title, summary, category, and source information */
  article: Article;
  /** Whether the device is considered small for responsive sizing */
  isSmallDevice: boolean;
  /** Number of lines to display in the summary text */
  summaryLines: number;
  /** Adaptive margin configuration for responsive spacing */
  adaptiveMargins: {
    /** Bottom margin for summary text */
    summaryMarginBottom: number;
    /** Top margin for read more section */
    readMoreMarginTop: number;
    /** Bottom margin for read more section */
    readMoreMarginBottom: number;
  };
  /** Callback function for source link press */
  onSourceLinkPress: () => void;
}

const NewsCardContent: React.FC<NewsCardContentProps> = memo(({
  article,
  isSmallDevice,
  summaryLines,
  adaptiveMargins,
  onSourceLinkPress,
}) => {
  /**
   * Handles source link press with callback optimization
   * @returns {void}
   */
  const handleSourceLinkPress = useCallback(() => {
    onSourceLinkPress();
  }, [onSourceLinkPress]);

  /**
   * Memoized timestamp calculation for performance optimization
   * Prevents unnecessary recalculations on every render
   * @returns {string} Formatted timestamp string
   */
  const memoizedTimestamp = useMemo(() => {
    return article.formattedDate;
  }, [article.formattedDate]);

  const styles = createStyleSheet(isSmallDevice);

  return (
    <View style={styles.cardContentContainer}>
      {/* White extension area that overlaps the image - similar to Inshorts pattern */}
      <View style={styles.whiteExtensionArea}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {article.category?.name || 'General'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        overScrollMode="never"
      >
        <Text style={styles.title}>{article.title}</Text>
        <Text
          style={[
            styles.summary,
            { marginBottom: adaptiveMargins.summaryMarginBottom }
          ]}
          numberOfLines={summaryLines}
        >
          {article.summary}
        </Text>
        {article.source_url && (
          <View style={[
            styles.readMoreContainer,
            {
              marginTop: adaptiveMargins.readMoreMarginTop,
              marginBottom: adaptiveMargins.readMoreMarginBottom,
            }
          ]}>
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={handleSourceLinkPress}
            >
              <Text style={styles.readMoreText}>Read more at {article.source_name || 'Source'}</Text>
              <Feather name="external-link" size={14} color={COLORS.PRIMARY} style={styles.linkIcon} />
            </TouchableOpacity>
            <Text style={styles.timestampText}>| {memoizedTimestamp}</Text>
          </View>
        )}
        <View style={[
          styles.scrollViewBottomPadding,
          { height: adaptiveMargins.readMoreMarginBottom > 16 ? 15 : 20 }
        ]} />
      </ScrollView>
    </View>
  );
});

NewsCardContent.displayName = 'NewsCardContent';

const createStyleSheet = (smallDevice: boolean) => StyleSheet.create({
  cardContentContainer: {
    flex: 1.48,
    marginTop: -22, // Further increased negative margin to pull content up more
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    paddingBottom: SPACING.XXXXL,
    position: 'relative',
  },
  whiteExtensionArea: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 40, // Reduced height to minimize white space
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    zIndex: 5,
  },
  categoryContainer: {
    position: 'absolute',
    bottom: SPACING.LG, // Further reduced to move closer to image border
    left: smallDevice ? SPACING.XXL : SPACING.XXXL,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 2, // Reduced from SPACING.XS to 2px for minimal whitespace
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.MEDIUM,
    maxWidth: '60%',
  },
  categoryText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  scrollView: {
    paddingHorizontal: smallDevice ? SPACING.XXL : SPACING.XXXL,
    paddingTop: 4, // Further reduced to bring content closer to category
    paddingBottom: SPACING.XL,
  },
  scrollViewBottomPadding: {
    height: SPACING.XXXL,
  },
  title: {
    fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.MEDIUM : TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    marginTop: 0,
    marginBottom: 0, // Removed spacing to tighten layout
    color: COLORS.GRAY_900,
    lineHeight: smallDevice ? TYPOGRAPHY.LINE_HEIGHT.TIGHT : TYPOGRAPHY.LINE_HEIGHT.NORMAL,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  summary: {
    fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.MEDIUM : TYPOGRAPHY.FONT_SIZE.LARGE,
    color: COLORS.GRAY_700,
    lineHeight: smallDevice ? TYPOGRAPHY.LINE_HEIGHT.RELAXED : TYPOGRAPHY.LINE_HEIGHT.LOOSE,
    marginTop: SPACING.XS, // Added small top margin for visual separation from title
    marginBottom: smallDevice ? 2 : 4, // Further reduced margins while maintaining hierarchy
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    textAlign: 'left',
    letterSpacing: 0.4,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    flexWrap: 'wrap',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  readMoreText: {
    fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.TINY : TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    letterSpacing: 0.1,
  },
  linkIcon: {
    marginLeft: SPACING.MD,
    marginRight: SPACING.MD,
  },
  timestampText: {
    fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.TINY : TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.GRAY_700,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    marginLeft: SPACING.XS,
    flexShrink: 0,
  },
});

export default NewsCardContent; 