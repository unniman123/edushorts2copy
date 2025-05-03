import React, { useState, useEffect, useRef } from 'react';
import { useSavedArticles } from '../context/SavedArticlesContext';
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
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { analyticsService } from '../services/AnalyticsService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRemoteConfig } from '../hooks/useRemoteConfig';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';

type ArticleDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ArticleDetail'
>;

type ArticleDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ArticleDetail'
>;

export default function ArticleDetailScreen() {
  const navigation = useNavigation<ArticleDetailScreenNavigationProp>();
  const route = useRoute<ArticleDetailScreenRouteProp>();
  const { articleId } = route.params;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { savedArticles, addBookmark, removeBookmark, isLoading } = useSavedArticles();
  const [bookmarked, setBookmarked] = useState(false);
  const { config } = useRemoteConfig();

  // Get layout configuration from remote config
  const layout = config.article_layout;
  const showSourceIcon = config.show_source_icon;
  const enableSharing = config.enable_sharing;
  const maxSummaryLength = config.max_summary_length;

  // Update bookmarked state whenever savedArticles changes
  useEffect(() => {
    setBookmarked(savedArticles.some(article => article.id === articleId));
  }, [savedArticles, articleId]);

  // Track view time and scroll depth
  const viewStartTime = useRef(Date.now());
  const hasLoggedView = useRef(false);
  const maxScrollDepth = useRef(0);
  const scrollDepthTimeout = useRef<NodeJS.Timeout>();

  // Handle scroll events to track reading progress
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const scrollDepth = Math.round(
      ((contentOffset.y + layoutMeasurement.height) / contentSize.height) * 100
    );

    // Only update if we've scrolled further than before
    if (scrollDepth > maxScrollDepth.current) {
      maxScrollDepth.current = scrollDepth;

      // Debounce the scroll depth logging
      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }

      scrollDepthTimeout.current = setTimeout(() => {
        if (article) {
          analyticsService.logArticleScroll({
            article_id: article.id,
            category: article.category?.name || 'Uncategorized',
            scroll_depth: maxScrollDepth.current,
            source: article.source_name || 'Unknown',
            author: article.source_name || 'Unknown'
          });
        }
      }, 1000); // Wait 1 second after last scroll before logging
    }
  };

  useEffect(() => {
    return () => {
      // Log view duration and final scroll depth when component unmounts
      if (hasLoggedView.current && article) {
        const viewDuration = Math.floor((Date.now() - viewStartTime.current) / 1000); // Convert to seconds
          analyticsService.logArticleReadTime({
            article_id: article.id,
            category: article.category?.name || 'Uncategorized',
            author: article.source_name || 'Unknown',
            reading_time: viewDuration,
            source: article.source_name || 'Unknown',
            scroll_depth: maxScrollDepth.current
          });
      }
    };
  }, [article]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select(`
            *,
            category:category_id (
              id,
              name
            )
          `)
          .eq('id', articleId)
          .single();

        if (error) throw error;
        if (data) {
          setArticle(data as Article);
          // Log article view once data is loaded
          if (!hasLoggedView.current) {
            const viewParams = {
              article_id: data.id,
              category: data.category?.name || 'Uncategorized',
              author: data.source_name || 'Unknown',
              reading_time: 0,
              source: data.source_name || 'Unknown',
              scroll_depth: 0
            };
            analyticsService.logArticleView(viewParams);
            hasLoggedView.current = true;
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const handleShare = async () => {
    if (!article) return;
    try {
      // Use the microsite URL for sharing
      const webUrl = `https://edushortlinks.netlify.app/article/${articleId}`;
      await Share.share({
        message: `Check out this article in Edushorts: ${article.title}\n\n${webUrl}`,
        url: webUrl // Use the web URL for sharing
      });

      // Log share event using standard method
      analyticsService.logArticleShare({
        article_id: article.id,
        category: article.category?.name || 'Uncategorized',
        platform: 'native_share',
        source: article.source_name || 'Unknown',
        author: article.source_name || 'Unknown'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await removeBookmark(articleId);
      } else {
        await addBookmark(articleId);
        // Log bookmark event only when adding (not when removing)
        if (article) {
          analyticsService.logArticleBookmark({
            article_id: article.id,
            category: article.category?.name || 'Uncategorized',
            author: article.source_name || 'Unknown',
            source: article.source_name || 'Unknown',
            interaction_type: 'bookmark'
          });
        }
      }
    } catch (error) {
      // Error will be handled by context with toast
      console.log('Error toggling bookmark:', error);
    }
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleBookmark}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ff0000" />
            ) : (
              <Ionicons
                name={bookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color={bookmarked ? "#ff0000" : "#333"}
              />
            )}
          </TouchableOpacity>
          {enableSharing && (
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Feather name="share" size={22} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Throttle scroll events to ~60fps
      >
        <View style={styles.heroContainer}>
          {article.image_path ? (
            <Image source={{ uri: article.image_path }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.noHeroImage]}>
              <Feather name="image" size={48} color="#ccc" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category?.name || 'Uncategorized'}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={[
            styles.title,
            layout === 'compact' && styles.compactTitle
          ]}>{article.title}</Text>

          <View style={styles.publisherContainer}>
            {showSourceIcon && (
              article.source_icon ? (
                <Image source={{ uri: article.source_icon }} style={styles.publisherIcon} />
              ) : (
                <View style={[styles.publisherIcon, styles.noSourceIcon]} />
              )
            )}
            <View style={styles.publisherInfo}>
              <Text style={styles.publisherName}>{article.source_name || 'Unknown Source'}</Text>
              <Text style={styles.publishDate}>{article.timeAgo || new Date(article.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          <Text style={[
            styles.summary,
            layout === 'compact' && styles.compactSummary
          ]}>
            {article.summary.length > maxSummaryLength
              ? `${article.summary.substring(0, maxSummaryLength)}...`
              : article.summary}
          </Text>

          <View style={styles.divider} />

          {article.content && (
            <Text style={[
              styles.content,
              layout === 'compact' && styles.compactContent
            ]}>{article.content}</Text>
          )}

          {article.source_url && (
            <TouchableOpacity
              style={styles.sourceLink}
              onPress={() => Linking.openURL(article.source_url || '')}
            >
              <Text style={styles.sourceLinkText}>Read full article on {article.source_name || 'source'}</Text>
              <Feather name="external-link" size={16} color="#0066cc" />
            </TouchableOpacity>
          )}
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
  compactTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  compactSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  compactContent: {
    fontSize: 14,
    lineHeight: 20,
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
  noHeroImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  }, categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#ff0000',
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
  }, sourceLinkText: {
    fontSize: 14,
    color: '#ff0000',
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
  noSourceIcon: {
    backgroundColor: '#f0f0f0',
  },
});
