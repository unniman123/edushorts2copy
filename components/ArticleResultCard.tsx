import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
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
    backgroundColor: '#ff0000',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    marginRight: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#888',
  },
  sourceIconContainer: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  sourceIconPlaceholder: {
    backgroundColor: '#f0f0f0',
  },
});
