import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useRemoteConfig } from '../hooks/useRemoteConfig';
import { useArticle } from '../hooks/useArticle';
import { useArticleAnalytics } from '../hooks/useArticleAnalytics';
import ArticleHeader from '../components/article/ArticleHeader';
import ArticleContent from '../components/article/ArticleContent';
import DeepLinkHandler from '../services/DeepLinkHandler';
import { analyticsService } from '../services/AnalyticsService';

type ArticleDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SingleArticleViewer'
>;
type ArticleDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'SingleArticleViewer'
>;

const ArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation<ArticleDetailScreenNavigationProp>();
  const route = useRoute<ArticleDetailScreenRouteProp>();
  const { articleId } = route.params;

  const { config } = useRemoteConfig();
  const {
    article,
    loading,
    error,
    isBookmarked,
    isBookmarkLoading,
    toggleBookmark,
  } = useArticle(articleId);

  const { handleScroll } = useArticleAnalytics(article);

  const handleShare = async () => {
    if (!article) return;
    try {
      const deepLinkHandler = DeepLinkHandler.getInstance();
      const branchUrl = await deepLinkHandler.createBranchLink(
        article.id,
        article.title,
        article.summary,
        article.image_path || undefined
      );

      await Share.share({
        message: `Check out this article: ${article.title}\n\n${branchUrl}`,
        url: branchUrl,
      });
      
      analyticsService.logArticleShare({
        article_id: article.id,
        category: article.category?.name || 'Uncategorized',
        platform: 'native_share',
        source: article.source_name || 'Unknown',
        author: article.source_name || 'Unknown',
      });
      deepLinkHandler.trackArticleShare(article.id, 'native_share');
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Article not found.'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ArticleHeader
        onBack={() => navigation.goBack()}
        onToggleBookmark={toggleBookmark}
        onShare={handleShare}
        isBookmarked={isBookmarked}
        isBookmarkLoading={isBookmarkLoading}
        enableSharing={config.enable_sharing}
      />
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <ArticleContent
          article={article}
          showSourceIcon={config.show_source_icon}
          maxSummaryLength={config.max_summary_length}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});

export default ArticleDetailScreen;
