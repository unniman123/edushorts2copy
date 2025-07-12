import React, { memo, useCallback } from 'react';
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

interface NewsCardContentProps {
  article: Article;
  isSmallDevice: boolean;
  summaryLines: number;
  adaptiveMargins: {
    summaryMarginBottom: number;
    readMoreMarginTop: number;
    readMoreMarginBottom: number;
  };
  onSourceLinkPress: () => void;
}

const NewsCardContent: React.FC<NewsCardContentProps> = memo(({
  article,
  isSmallDevice,
  summaryLines,
  adaptiveMargins,
  onSourceLinkPress,
}) => {
  const handleSourceLinkPress = useCallback(() => {
    onSourceLinkPress();
  }, [onSourceLinkPress]);

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
            <Text style={styles.timestampText}>| {article.formattedDate}</Text>
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
        marginTop: -18,
        backgroundColor: COLORS.WHITE,
        borderTopLeftRadius: BORDER_RADIUS.LARGE,
        borderTopRightRadius: BORDER_RADIUS.LARGE,
        paddingBottom: SPACING.XXXXL,
        position: 'relative',
    },
    whiteExtensionArea: {
        position: 'absolute',
        top: -30, // Extends upward into the image area
        left: 0,
        right: 0,
        height: 50, // Height of the extension
        backgroundColor: COLORS.WHITE,
        borderTopLeftRadius: BORDER_RADIUS.LARGE,
        borderTopRightRadius: BORDER_RADIUS.LARGE,
        zIndex: 5, // Ensures it appears above the image
    },
    categoryContainer: {
        position: 'absolute',
        bottom: SPACING.XXL, // Moved closer to image boundary for enhanced visual connection
        left: smallDevice ? SPACING.XXL : SPACING.XXXL,
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: SPACING.MD,
        paddingVertical: 3,
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
        paddingTop: 17, // Reduced from 17px to optimize space between category and content
        paddingBottom: SPACING.XL,
    },
    scrollViewBottomPadding: {
        height: SPACING.XXXXL,
    },
    title: {
        fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.XL : TYPOGRAPHY.FONT_SIZE.XXL,
        fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
        marginBottom: 2, // Reduced to match Inshorts minimal title-summary spacing
        color: COLORS.GRAY_900,
        lineHeight: smallDevice ? TYPOGRAPHY.LINE_HEIGHT.TIGHT : TYPOGRAPHY.LINE_HEIGHT.NORMAL,
        textAlign: 'left',
        letterSpacing: 0.2,
    },
    summary: {
        fontSize: smallDevice ? TYPOGRAPHY.FONT_SIZE.MEDIUM : TYPOGRAPHY.FONT_SIZE.LARGE,
        color: COLORS.GRAY_700,
        lineHeight: smallDevice ? TYPOGRAPHY.LINE_HEIGHT.RELAXED : TYPOGRAPHY.LINE_HEIGHT.LOOSE,
        marginTop: 0, // Removed to achieve Inshorts-style minimal title-summary gap
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