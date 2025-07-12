import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, COMPONENT_STYLES } from '../constants/theme';
import { Article } from '../types/supabase';

interface ArticleResultCardProps {
  article: Article;
  onPress: () => void;
}

export const ArticleResultCard: React.FC<ArticleResultCardProps> = ({
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
};

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
