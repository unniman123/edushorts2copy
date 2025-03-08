import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { SavedArticle } from '../types/accessibility';
import EmptyState from '../components/EmptyState';
import AuthGuard from '../components/AuthGuard';
import { toast } from 'sonner-native';

type RootStackParamList = {
  Home: undefined;
  ArticleDetail: { articleId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const BookmarksContent = memo(() => {
  const navigation = useNavigation<NavigationProp>();
  const { 
    savedArticles, 
    loading, 
    error,
    hasLoaded,
    unsaveArticle, 
    refreshSavedArticles 
  } = usePreferences();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial data load with timeout
  useEffect(() => {
    if (user && !hasLoaded) {
      const timeoutId = setTimeout(() => {
        if (!hasLoaded) {
          toast.error('Loading timed out. Please try again.');
          setIsProcessing(false);
        }
      }, 10000);

      refreshSavedArticles();

      return () => clearTimeout(timeoutId);
    }
  }, [user, hasLoaded, refreshSavedArticles]);

  // Handle errors with toast and auto-retry
  useEffect(() => {
    if (error) {
      toast.error(error);
      // Auto-retry after 3 seconds
      const retryTimer = setTimeout(() => {
        if (!hasLoaded) {
          refreshSavedArticles();
        }
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, hasLoaded, refreshSavedArticles]);

  const handleRemoveBookmark = useCallback(async (articleId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      toast.error('Operation timed out. Please try again.');
    }, 5000);

    try {
      await Promise.race([
        unsaveArticle(articleId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), 4000)
        )
      ]);
      toast.success('Article removed from bookmarks');
      clearTimeout(timeoutId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove article';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [unsaveArticle, isProcessing]);

  const handleRefresh = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      toast.error('Refresh timed out. Please try again.');
    }, 5000);

    try {
      await Promise.race([
        refreshSavedArticles(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Refresh timed out')), 4000)
        )
      ]);
      clearTimeout(timeoutId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh saved articles';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [refreshSavedArticles, isProcessing]);

  const renderArticleItem = useCallback(({ item }: { item: SavedArticle }) => {
    const article = item.article;
    if (!article) {
      console.warn('Article data missing for saved article:', item);
      return null;
    }

    return (
      <View style={styles.articleCard}>
        <TouchableOpacity 
          style={styles.articleContent}
          onPress={() => navigation.navigate('ArticleDetail', { articleId: article.id })}
          accessible={true}
          accessibilityLabel={`Article: ${article.title}`}
          accessibilityHint="Click to read the full article"
        >
          <Image 
            source={{ uri: article.image_path }} 
            style={styles.articleImage} 
          />
          <View style={styles.articleDetails}>
            {article.category_id && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{article.category_id}</Text>
              </View>
            )}
            <Text style={styles.articleTitle} numberOfLines={2}>
              {article.title}
            </Text>
            <View style={styles.articleMeta}>
              <Text style={styles.timeText}>
                {new Date(item.saved_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.removeButton, isProcessing && styles.disabledButton]}
          onPress={() => handleRemoveBookmark(article.id)}
          disabled={isProcessing}
          accessible={true}
          accessibilityLabel={`Remove ${article.title} from bookmarks`}
          accessibilityHint="Click to remove this article from your saved articles"
        >
          <Feather name="trash-2" size={18} color={isProcessing ? '#999' : '#ff3b30'} />
        </TouchableOpacity>
      </View>
    );
  }, [navigation, handleRemoveBookmark, isProcessing]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorTitle}>Unable to load articles</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, isProcessing && styles.disabledButton]}
          onPress={handleRefresh}
          disabled={isProcessing}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && hasLoaded && savedArticles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="bookmark"
          title="No Saved Articles"
          message="Articles you save will appear here for easy access"
        />
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.navigate('Home')}
          accessible={true}
          accessibilityLabel="Browse Articles"
          accessibilityHint="Click to explore available articles"
        >
          <Text style={styles.browseButtonText}>Browse Articles</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <TouchableOpacity 
          onPress={handleRefresh}
          accessible={true}
          accessibilityLabel="Refresh saved articles"
          accessibilityHint="Updates the list of saved articles"
          disabled={loading || isProcessing}
        >
          <Feather 
            name={(loading || isProcessing) ? "loader" : "refresh-ccw"} 
            size={24} 
            color={(loading || isProcessing) ? "#999" : "#333"} 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={savedArticles}
        keyExtractor={(item) => `${item.user_id}-${item.article_id}`}
        renderItem={renderArticleItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onRefresh={handleRefresh}
        refreshing={loading || isProcessing}
        windowSize={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />
    </>
  );
});

export default memo(function BookmarksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthGuard loadingMessage="Loading saved articles...">
        <BookmarksContent />
      </AuthGuard>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  browseButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
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
  categoryBadge: {
    backgroundColor: '#0066cc',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  disabledButton: {
    opacity: 0.5,
  },
});
