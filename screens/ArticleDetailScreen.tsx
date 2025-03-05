import React, { useState, useEffect } from 'react';
import { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ArticleDetail: { articleId: string };
};

type ArticleDetailScreenRouteProp = RouteProp<RootStackParamList, 'ArticleDetail'>;
type ArticleDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  sourceIconUrl: string;
  imageUrl: string;
  timeAgo: string;
  url: string;
  timestamp: string;
}
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { mockNewsData } from '../data/mockData';

export default function ArticleDetailScreen() {
  const navigation = useNavigation<ArticleDetailScreenNavigationProp>();
  const route = useRoute<ArticleDetailScreenRouteProp>();
  const { articleId } = route.params;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    // In a real app, we would fetch the article from an API
    const foundArticle = mockNewsData.find(item => item.id === articleId) as Article;
    setArticle(foundArticle || null);
    setLoading(false);
  }, [articleId]);

  const handleShare = async () => {
    try {
      if (!article) return;
      await Share.share({
        message: `Check out this article: ${article.title} ${article.url}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    // In a real app, we would update the user's bookmarks in the backend
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={toggleBookmark}>
            <Ionicons 
              name={bookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={bookmarked ? "#0066cc" : "#333"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Feather name="share" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="more-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: article.imageUrl }} style={styles.heroImage} />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{article.title}</Text>
          
          <View style={styles.publisherContainer}>
            <Image source={{ uri: article.sourceIconUrl }} style={styles.publisherIcon} />
            <View style={styles.publisherInfo}>
              <Text style={styles.publisherName}>{article.source}</Text>
              <Text style={styles.publishDate}>{article.timeAgo}</Text>
            </View>
          </View>
          
          <Text style={styles.summary}>{article.summary}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.content}>{article.content}</Text>
          
          <TouchableOpacity 
            style={styles.sourceLink}
            onPress={() => article.url && Linking.openURL(article.url)}
          >
            <Text style={styles.sourceLinkText}>Read full article on {article.source}</Text>
            <Feather name="external-link" size={16} color="#0066cc" />
          </TouchableOpacity>
        </View>        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 20,
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  publisherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  publisherIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  publisherInfo: {
    flex: 1,
  },
  publisherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  publishDate: {
    fontSize: 12,
    color: '#888',
  },
  summary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sourceLinkText: {
    fontSize: 14,
    color: '#0066cc',
    marginRight: 4,
  },
  relatedSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  relatedArticlesContainer: {
    paddingBottom: 16,
  },
  relatedArticleCard: {
    width: 250,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  relatedArticleImage: {
    width: '100%',
    height: 130,
  },
  relatedArticleContent: {
    padding: 12,
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  relatedArticleSource: {
    fontSize: 12,
    color: '#888',
  },
});
