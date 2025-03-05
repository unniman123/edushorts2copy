import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { AccessibilityProps } from '../types/accessibility';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../screens/HomeScreen';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  timeAgo: string;
  imageUrl: string;
  sourceIconUrl: string;
  url: string;
}

interface NewsCardProps {
  article: Article;
}

const NewsCard = ({ article }: NewsCardProps) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Ensure all required properties exist before rendering
  if (!article || !article.id || !article.title || !article.summary || 
      !article.category || !article.source || !article.timeAgo || 
      !article.imageUrl || !article.sourceIconUrl) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ArticleDetail', { articleId: article.id })}
      accessible={true}
      accessibilityLabel={`Article: ${article.title}`}
      accessibilityHint="Click to read the full article"
    >
      <Image 
        source={{ uri: article.imageUrl }} 
        style={styles.image} 
      />
      <View style={styles.contentContainer}>
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
          <Text style={styles.timeAgo}>{article.timeAgo}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.summary} numberOfLines={2}>{article.summary}</Text>
        <View>
          <View style={styles.sourceRow}>
            <Image source={{ uri: article.sourceIconUrl }} style={styles.sourceIcon} />
            <Text style={styles.sourceName}>{article.source}</Text>
          </View>
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => article.url && Linking.openURL(article.url)}
            accessible={true}
            accessibilityLabel="Read full article"
            accessibilityHint="Opens article in your browser"
          >
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 100,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 10,
    color: '#888',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  summary: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  sourceName: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  readMoreButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const areEqual = (prevProps: NewsCardProps, nextProps: NewsCardProps) => {
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.title === nextProps.article.title &&
    prevProps.article.summary === nextProps.article.summary &&
    prevProps.article.category === nextProps.article.category &&
    prevProps.article.source === nextProps.article.source &&
    prevProps.article.timeAgo === nextProps.article.timeAgo &&
    prevProps.article.imageUrl === nextProps.article.imageUrl &&
    prevProps.article.sourceIconUrl === nextProps.article.sourceIconUrl &&
    prevProps.article.url === nextProps.article.url
  );
};

export default memo(NewsCard, areEqual);
