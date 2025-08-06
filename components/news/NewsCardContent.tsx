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
import { LinearGradient } from 'expo-linear-gradient';
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
  /** Callback function for source link press */
  onSourceLinkPress: () => void;
}

const NewsCardContent: React.FC<NewsCardContentProps> = memo(({
  article,
  isSmallDevice,
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

      {/* Main content area with scrollable summary */}
      <View style={styles.contentWrapper}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{article.title}</Text>
        </View>

        {/* Natural content flow with inline read more */}
        <View style={styles.summaryContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.summaryScrollView}
            contentContainerStyle={styles.summaryScrollContent}
            removeClippedSubviews={false}
            scrollEventThrottle={16}
            overScrollMode="never"
            nestedScrollEnabled={true}
          >
            <Text style={styles.summary}>
              {article.summary}
            </Text>

            {/* Natural inline read more button - appears after content */}
            {article.source_url && (
              <View style={styles.inlineActionContainer}>
                <TouchableOpacity
                  style={styles.inlineReadMoreButton}
                  onPress={handleSourceLinkPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineReadMoreText}>Read full article</Text>
                  <Feather name="external-link" size={10} color={COLORS.WHITE} style={styles.inlineLinkIcon} />
                </TouchableOpacity>
                <Text style={styles.inlineTimestamp}>{memoizedTimestamp}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
  contentWrapper: {
    flex: 1,
    paddingHorizontal: smallDevice ? SPACING.XXL : SPACING.XXXL,
    paddingTop: 4,
  },
  titleContainer: {
    paddingBottom: SPACING.XS,
  },
  summaryContainer: {
    flex: 1,
    position: 'relative',
  },
  summaryScrollView: {
    flex: 1,
  },
  summaryScrollContent: {
    paddingBottom: SPACING.LG, // Natural spacing for inline content
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE, // Updated to 16sp for both small and large devices as per industrial best practice
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    marginTop: 0,
    marginBottom: 2, // Minimal spacing for visual separation
    color: COLORS.GRAY_900,
    lineHeight: smallDevice ? TYPOGRAPHY.LINE_HEIGHT.TIGHT : TYPOGRAPHY.LINE_HEIGHT.TIGHT, // Consistent tight line height
    textAlign: 'left',
    letterSpacing: 0.1, // Reduced letter spacing for more content per line
  },
  summary: {
    fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.MEDIUM : TYPOGRAPHY.FONT_SIZE.MEDIUM, // Consistent sizing for better space utilization
    color: COLORS.GRAY_700,
    lineHeight: smallDevice ? TYPOGRAPHY.LINE_HEIGHT.NORMAL : TYPOGRAPHY.LINE_HEIGHT.RELAXED, // Tighter line height like Inshorts
    marginTop: SPACING.XS, // Added small top margin for visual separation from title
    marginBottom: 2, // Minimal margin for maximum content space
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    textAlign: 'left',
    letterSpacing: 0.2, // Reduced letter spacing for more content per line
  },
  // Natural inline action container - appears after content naturally
  inlineActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: SPACING.MD, // Natural spacing after content
    paddingTop: SPACING.SM, // Small padding for visual separation
  },
  inlineReadMoreButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XS, // Compact padding
    paddingVertical: 2, // Minimal vertical padding
    borderRadius: 12, // Compact rounded corners
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM, // Space between button and timestamp
    // Subtle shadow for depth
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inlineReadMoreText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY, // Compact text size
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    letterSpacing: 0.1, // Tight letter spacing
  },
  inlineLinkIcon: {
    marginLeft: SPACING.XS, // Compact icon spacing
  },
  inlineTimestamp: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    color: COLORS.GRAY_500,
    textAlign: 'left',
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    flex: 1, // Take remaining space
  },
});

export default NewsCardContent; 