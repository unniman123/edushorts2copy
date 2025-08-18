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
  /** Available content height for ScrollView constraints */
  availableContentHeight?: number;
  /** Maximum summary lines to display before showing read more */
  maxSummaryLines?: number;
}

const NewsCardContent: React.FC<NewsCardContentProps> = memo(({
  article,
  isSmallDevice,
  onSourceLinkPress,
  // availableContentHeight and maxSummaryLines kept in interface for future use
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
      {/* Main content area with scrollable summary - no white extension needed */}
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
            
            {/* Actions positioned immediately below summary */}
            {article.source_url && (
              <View style={styles.belowSummaryActions}>
                <TouchableOpacity
                  style={styles.readMoreButton}
                  onPress={handleSourceLinkPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.readMoreText}>Read full article</Text>
                </TouchableOpacity>
                <Text style={styles.timestamp}>{memoizedTimestamp}</Text>
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
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    position: 'relative',
    marginTop: -BORDER_RADIUS.LARGE, // Perfect overlap matching border radius for seamless transition
    // Add subtle shadow for depth and clean edge definition
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: SPACING.LG, // Adequate top padding for clean content start
    paddingBottom: SPACING.XS, // Minimal bottom padding to maximize content space
    paddingLeft: smallDevice ? SPACING.XXL : SPACING.XXXL, // Responsive left padding for consistent edges
    paddingRight: smallDevice ? SPACING.XXL : SPACING.XXXL, // Responsive right padding for consistent edges
    minHeight: 200, // Ensure minimum content area height
  },
  titleContainer: {
    paddingBottom: SPACING.XS, // Restored proper spacing for readability
  },
  summaryContainer: {
    flex: 1,
    position: 'relative',
  },
  summaryScrollView: {
    flex: 1,
    minHeight: 120, // Ensure minimum space for content and read more button
  },
  summaryScrollContent: {
    paddingBottom: SPACING.XLARGE, // Generous padding to ensure read more button is always visible
    minHeight: 100, // Minimum content height to guarantee scroll space for read more
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
    marginBottom: 0, // No bottom margin to ensure actions appear immediately below
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    textAlign: 'left',
    letterSpacing: 0.2, // Reduced letter spacing for more content per line
  },

  // Actions positioned below summary with minimal spacing
  belowSummaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4, // Minimal spacing - immediately below summary
    paddingHorizontal: 0, // No horizontal padding to align with content edges
  },
  readMoreButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0, // No padding for clean text appearance
    paddingVertical: 0,
    marginRight: SPACING.SM, // Space between button and timestamp
  },
  readMoreText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY, // Same size as timestamp
    color: COLORS.PRIMARY, // Use primary color to indicate interactivity
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD, // Slightly bolder to distinguish from timestamp
    letterSpacing: 0.1, // Consistent with timestamp
    textDecorationLine: 'underline', // Add underline to indicate link
  },
  timestamp: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    color: COLORS.GRAY_500,
    textAlign: 'left',
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    letterSpacing: 0.1,
  },
});

export default NewsCardContent; 