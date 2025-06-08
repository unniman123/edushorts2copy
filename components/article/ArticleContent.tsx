import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Article } from '../../types/supabase';

interface ArticleContentProps {
  article: Article;
  showSourceIcon: boolean;
  maxSummaryLength: number;
}

const ArticleContent: React.FC<ArticleContentProps> = ({
  article,
  showSourceIcon,
  maxSummaryLength,
}) => {
  const truncatedSummary =
    article.summary.length > maxSummaryLength
      ? article.summary.substring(0, maxSummaryLength) + '...'
      : article.summary;

  return (
    <View>
      <View style={styles.heroContainer}>
        {article.image_path ? (
          <Image source={{ uri: article.image_path }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.noHeroImage]}>
            <Feather name="image" size={40} color="#ccc" />
            <Text style={styles.noImageText}>No Image Available</Text>
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{article.title}</Text>
        <View style={styles.publisherContainer}>
          {showSourceIcon && article.source_icon && (
            <Image
              source={{ uri: article.source_icon }}
              style={styles.publisherIcon}
            />
          )}
          <View style={styles.publisherInfo}>
            <Text style={styles.publisherName}>{article.source_name}</Text>
            <Text style={styles.publishDate}>
              {new Date(article.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={styles.summary}>{truncatedSummary}</Text>
        <View style={styles.divider} />
        <Text style={styles.content}>{article.content}</Text>
        {article.source_url && (
          <TouchableOpacity
            style={styles.sourceLink}
            onPress={() => Linking.openURL(article.source_url!)}
          >
            <Text style={styles.sourceLinkText}>Read Full Story</Text>
            <Feather name="external-link" size={16} color="#ff0000" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noHeroImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  publisherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  publisherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  publisherInfo: {
    flex: 1,
  },
  publisherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  publishDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  sourceLinkText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
    marginRight: 6,
  },
});

export default ArticleContent; 