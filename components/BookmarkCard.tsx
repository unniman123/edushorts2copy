import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
            <Text style={styles.sourceText}>{item.source_name || 'Unknown Source'}</Text>
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
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 10,
    color: '#888',
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eeeeee',
  },
});

export default memo(BookmarkCard); 