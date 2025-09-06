/**
 * BookmarkCard - Card component for displaying saved/bookmarked articles
 * 
 * Renders a horizontal card layout with article image, title, source information, 
 * and timestamp showing when the article was saved. Includes a remove button for
 * unbookmarking articles. Uses React.memo for performance optimization and memoized
 * timestamp calculation to prevent unnecessary re-renders.
 * 
 * @component
 * @param {BookmarkCardProps} props - Component properties
 * @returns {React.ReactElement} The rendered bookmark card component
 * 
 * @example
 * <BookmarkCard
 *   item={savedArticle}
 *   onPress={() => navigateToArticle(savedArticle.id)}
 *   onRemove={() => removeFromBookmarks(savedArticle.id)}
 * />
 */
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, COMPONENT_STYLES, ELEVATION } from '../constants/theme';
import type { SavedArticle } from '../context/SavedArticlesContext';
import { getRelativeTime } from '../utils/timeUtils';

/**
 * Props interface for BookmarkCard component
 * @interface BookmarkCardProps
 */
interface BookmarkCardProps {
  /** Saved article data containing title, image, source, and save timestamp */
  item: SavedArticle;
  /** Callback function called when the card is pressed to view the article */
  onPress: () => void;
  /** Callback function called when the remove button is pressed to unbookmark */
  onRemove: () => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = memo(({ item, onPress, onRemove }) => {
  /**
   * Memoized timestamp calculation for performance optimization
   * Prevents unnecessary re-computation of relative time on every render
   * @returns {string} Formatted relative time string (e.g., "2 hours ago")
   */
  const memoizedTimestamp = useMemo(() => {
    return getRelativeTime(item.saved_at);
  }, [item.saved_at]);

  return (
    <View style={styles.articleCard}>
      <TouchableOpacity style={styles.articleContent} onPress={onPress}>
        <Image source={{ uri: item.image_path || undefined }} style={styles.articleImage} />
        <View style={styles.articleDetails}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.articleMeta}>
            {item.source_name && <Text style={styles.sourceText}>{item.source_name}</Text>}
            <Text style={styles.timeText}>{memoizedTimestamp}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Feather name="trash-2" size={18} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  articleCard: {
    ...COMPONENT_STYLES.CARD_CONTAINER,
  },
  articleContent: {
    flex: 1,
    flexDirection: 'row',
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  articleTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.TEXT_SECONDARY,
  },
  timeText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    color: COLORS.TEXT_TERTIARY,
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.GRAY_100,
  },
});

export default BookmarkCard; 