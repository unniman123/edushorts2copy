/**
 * ArticleResultCard - Compact card component for displaying article search results
 * 
 * Renders a horizontal card layout with article image, category tag, title, and source
 * information. Used primarily in search results and article listings where space-efficient
 * display is required. Includes fallback handling for missing images and optional source
 * icons. Uses React.memo for performance optimization.
 * 
 * @component
 * @param {ArticleResultCardProps} props - Component properties
 * @returns {React.ReactElement} The rendered article result card component
 * 
 * @example
 * <ArticleResultCard
 *   article={articleData}
 *   onPress={() => navigateToArticle(articleData.id)}
 * />
 */
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, COMPONENT_STYLES } from '../constants/theme';
import { Article } from '../types/supabase';

/**
 * Props interface for ArticleResultCard component
 * @interface ArticleResultCardProps
 */
interface ArticleResultCardProps {
  /** Article data containing title, image, category, and source information */
  article: Article;
  /** Callback function called when the card is pressed */
  onPress: () => void;
}

export const ArticleResultCard: React.FC<ArticleResultCardProps> = memo(({
  article,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={onPress}
    >
      <View style={[styles.resultImage, !article.image_path && styles.placeholderImage]}>
        {article.image_path ? (
          <Image 
            source={{ uri: article.image_path }} 
            style={styles.resultImage}
          />
        ) : (
          <Text style={styles.placeholderText}>No Image</Text>
        )}
      </View>
      <View style={styles.resultContent}>
        <View style={styles.categoryWrapper}>
          <Text style={styles.categoryLabel}>{article.category?.name || 'Uncategorized'}</Text>
        </View>
        <Text style={styles.resultTitle} numberOfLines={2}>{article.title}</Text>
        <View style={styles.resultMeta}>
          {article.source_icon && (
            <View style={styles.sourceIconContainer}>
              <Image 
                source={{ uri: article.source_icon }} 
                style={styles.sourceIcon}
              />
            </View>
          )}
          {article.source_name && <Text style={styles.sourceText}>{article.source_name}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  resultItem: {
    ...COMPONENT_STYLES.CARD_CONTAINER,
  },
  resultImage: {
    width: 120,
    height: 120,
  },
  resultContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryWrapper: {
    backgroundColor: COLORS.PRIMARY,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.SMALL,
    marginBottom: 8,
  },
  categoryLabel: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  resultTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MEDIUM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.TEXT_SECONDARY,
  },
  placeholderImage: {
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SMALL,
    color: COLORS.TEXT_TERTIARY,
  },
  sourceIconContainer: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  sourceIconPlaceholder: {
    backgroundColor: COLORS.GRAY_100,
  },
});
