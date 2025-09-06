/**
 * NewsCardActions - Floating action buttons for news card interactions
 * 
 * Renders a vertical stack of floating action buttons positioned over the news card
 * for bookmark toggle and share functionality. Uses conditional icon states for
 * bookmark status and includes optimized touch handling with React.memo for performance.
 * Positioned absolutely with elevation for proper layering.
 * 
 * @component
 * @param {NewsCardActionsProps} props - Component properties
 * @returns {React.ReactElement} The rendered news card actions component
 * 
 * @example
 * <NewsCardActions
 *   isSaved={isBookmarked}
 *   onSaveToggle={() => toggleBookmark()}
 *   onShare={() => shareArticle()}
 * />
 */
import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ELEVATION } from '../../constants/theme';

/**
 * Props interface for NewsCardActions component
 * @interface NewsCardActionsProps
 */
interface NewsCardActionsProps {
  /** Whether the article is currently saved/bookmarked */
  isSaved: boolean;
  /** Callback function for bookmark toggle action */
  onSaveToggle: () => void;
  /** Callback function for share action */
  onShare: () => void;
}

const NewsCardActions: React.FC<NewsCardActionsProps> = memo(({ isSaved, onSaveToggle, onShare }) => {
  /**
   * Handles bookmark toggle with callback optimization
   * @returns {void}
   */
  const handleSaveToggle = useCallback(() => {
    onSaveToggle();
  }, [onSaveToggle]);

  /**
   * Handles share action with callback optimization
   * @returns {void}
   */
  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  return (
    <View style={styles.interactionContainer}>
      <TouchableOpacity onPress={handleSaveToggle} style={styles.iconButton}>
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={28} 
          color={isSaved ? COLORS.PRIMARY : COLORS.GRAY_900} 
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
        <Feather name="share-2" size={28} color={COLORS.GRAY_900} />
      </TouchableOpacity>
    </View>
  );
});

NewsCardActions.displayName = 'NewsCardActions';

const styles = StyleSheet.create({
  interactionContainer: {
    position: 'absolute',
    bottom: SPACING.XLARGE,
    right: SPACING.XXXXL,
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: COLORS.BACKGROUND_CARD,
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.CIRCLE,
    marginBottom: SPACING.XL,
    ...ELEVATION.LOW,
  },
});

export default NewsCardActions; 