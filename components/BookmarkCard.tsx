import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, COMPONENT_STYLES, ELEVATION } from '../constants/theme';
import type { SavedArticle } from '../context/SavedArticlesContext';

interface BookmarkCardProps {
  item: SavedArticle;
  onPress: () => void;
  onRemove: () => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ item, onPress, onRemove }) => {
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
            <Text style={styles.timeText}>{new Date(item.saved_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Feather name="trash-2" size={18} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );
};

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

export default memo(BookmarkCard); 