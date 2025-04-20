import React, { useState, useEffect } from 'react';
import { useSavedArticles } from '../context/SavedArticlesContext';
import BranchHelper from '../utils/branchHelper';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';
import { toast } from '../utils/toast';
import * as monitoring from '../services/monitoring';

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

  // Update bookmarked state whenever savedArticles changes
  useEffect(() => {
    setBookmarked(savedArticles.some(article => article.id === articleId));
  }, [savedArticles, articleId]);

  useEffect(() => {
    const fetchArticle = async () => {
      const startTime = Date.now();
      try {
        monitoring.logEvent('article_detail_view_started', { articleId });
        
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

        if (error) {
          throw error;
        }
        if (data) {
          // Type guard to ensure category data exists
          if (typeof data.category === 'object' && data.category !== null) {
            const categoryData = data.category as any;
            const articleData = {
              ...data,
              category: {
                id: categoryData?.id || '',
                name: categoryData?.name || '',
                description: null,
                is_active: true,
                article_count: null,
                created_at: new Date().toISOString()
              }
            };
            setArticle(articleData as Article);
          } else {
            // Set article without category if category data is missing
            setArticle({
              ...data,
              category: undefined
            } as Article);
          }
        }
        
        const loadTime = Date.now() - startTime;
        monitoring.logEvent('article_detail_view_loaded', {
          articleId,
          loadTimeMs: loadTime,
          hasCategory: !!data?.category,
          hasImage: !!data?.image_path
        });
      } catch (error) {
        monitoring.logError(error, {
          screen: 'ArticleDetail',
          action: 'fetch_article',
          articleId
        });
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
      const branchLink = await BranchHelper.createShareLink({
        title: article.title,
        description: article.summary || '',
        newsId: article.id,
        category: article.category?.name
      });

      if (branchLink) {
        await Share.share({
          message: `${article.title} - Read more on EduShorts app:\n\n${branchLink}`,
          url: branchLink,
          title: article.title,
        });
      } else {
        toast.error('Failed to create share link');
      }
    } catch (error) {
      toast.error('Unable to share article');
      console.error('Error sharing:', error);
      
      monitoring.logError(error, {
        screen: 'ArticleDetail',
        action: 'share',
        articleId: article.id,
        articleTitle: article.title
      });
      
      monitoring.logEvent('share_failed', {
        articleId: article.id,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await removeBookmark(articleId);
        monitoring.logEvent('article_unbookmarked', {
          articleId,
          articleTitle: article?.title
        });
      } else {
        await addBookmark(articleId);
        monitoring.logEvent('article_bookmarked', {
          articleId,
          articleTitle: article?.title
        });
      }
    } catch (error) {
      monitoring.logError(error, {
        screen: 'ArticleDetail',
        action: 'toggle_bookmark',
        articleId,
        articleTitle: article?.title,
        targetState: bookmarked ? 'unbookmark' : 'bookmark'
      });
      console.error('Error toggling bookmark:', error);
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
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Feather name="share" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.publisherContainer}>
            {article.source_icon ? (
              <Image source={{ uri: article.source_icon }} style={styles.publisherIcon} />
            ) : (
              <View style={[styles.publisherIcon, styles.noSourceIcon]} />
            )}
            <View style={styles.publisherInfo}>
              <Text style={styles.publisherName}>{article.source_name || 'Unknown Source'}</Text>
              <Text style={styles.publishDate}>{article.timeAgo || new Date(article.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          <Text style={styles.summary}>{article.summary}</Text>

          <View style={styles.divider} />

          {article.content && <Text style={styles.content}>{article.content}</Text>}

          {article.source_url && (
            <TouchableOpacity
              style={styles.sourceLink}
              onPress={() => {
                const url = article.source_url || '';
                Linking.openURL(url).catch(error => {
                  console.error("Couldn't open URL:", error);
                  monitoring.logError(error, {
                    screen: 'ArticleDetail',
                    action: 'open_external_link',
                    articleId: article.id,
                    url
                  });
                  toast.error('Could not open the link');
                });
                
                monitoring.logEvent('article_external_link_clicked', {
                  articleId: article.id,
                  url,
                  sourceName: article.source_name
                });
              }}
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
