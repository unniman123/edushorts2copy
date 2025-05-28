import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PagerView from 'react-native-pager-view';
import { RootStackParamList } from '../types/navigation';
import { Article } from '../types/supabase';
import NewsCard from '../components/NewsCard';
import { supabase } from '../utils/supabase';

type SingleArticleViewerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SingleArticleViewer'
>;

type SingleArticleViewerRouteProp = RouteProp<
  RootStackParamList,
  'SingleArticleViewer'
>;

export default function SingleArticleViewerScreen() {
  const navigation = useNavigation<SingleArticleViewerNavigationProp>();
  const route = useRoute<SingleArticleViewerRouteProp>();
  
  const { articleId: initialArticleId, articles: initialArticles, currentIndex: initialCurrentIndex } = route.params || {};

  const [displayArticles, setDisplayArticles] = useState<Article[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0);
  const [currentArticleForHeader, setCurrentArticleForHeader] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);

      if (initialArticles && initialArticles.length > 0 && initialCurrentIndex !== undefined && initialCurrentIndex >= 0) {
        // Case 1: Navigating from Discover with a list of articles
        if (initialCurrentIndex < initialArticles.length) {
          setDisplayArticles(initialArticles);
          setCurrentArticleIndex(initialCurrentIndex);
          setCurrentArticleForHeader(initialArticles[initialCurrentIndex]);
        } else {
          setError('Invalid initial index provided.');
        }
      } else if (initialArticleId) {
        // Case 2: Navigating from a deep link with only an articleId
        try {
          const { data: articleData, error: fetchError } = await supabase
            .from('news')
            .select('*, category:category_id(id, name)')
            .eq('id', initialArticleId)
            .single();

          if (fetchError) throw fetchError;
          if (!articleData) throw new Error('Article not found.');

          setDisplayArticles([articleData as Article]);
          setCurrentArticleIndex(0);
          setCurrentArticleForHeader(articleData as Article);
        } catch (e) {
          console.error('Error fetching single article:', e);
          setError(e instanceof Error ? e.message : 'Failed to load article.');
          setDisplayArticles([]);
        }
      } else {
        setError('No article ID or article list provided.');
        setDisplayArticles([]);
      }
      setLoading(false);
    };

    loadContent();
  }, [initialArticleId, initialArticles, initialCurrentIndex]);

  useEffect(() => {
    // Update header when current article for header changes
    if (currentArticleForHeader) {
      navigation.setOptions({ headerTitle: currentArticleForHeader.title || 'Article' });
    }
  }, [currentArticleForHeader, navigation]);


  const handlePageSelected = (event: { nativeEvent: { position: number } }) => {
    const newIndex = event.nativeEvent.position;
    if (displayArticles && displayArticles[newIndex]) {
      setCurrentArticleIndex(newIndex);
      setCurrentArticleForHeader(displayArticles[newIndex]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </SafeAreaView>
    );
  }

  if (error || !displayArticles || displayArticles.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error || 'No article to display.'}</Text>
        <TouchableOpacity
          style={styles.backButtonExternal}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Ensure initialPage is valid
  const validInitialPage = Math.max(0, Math.min(currentArticleIndex, displayArticles.length - 1));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {currentArticleForHeader?.title || 'Article'}
        </Text>
        <View style={styles.headerButtonPlaceholder} /> 
      </View>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={validInitialPage}
        orientation="vertical"
        onPageSelected={handlePageSelected}
        scrollEnabled={displayArticles.length > 1} // Disable swiping if only one article
        overdrag={false} // Keep as is, or set based on whether displayArticles.length > 1
      >
        {displayArticles.map((articleItem, index) => (
          <View key={articleItem.id || `article-${index}`} style={styles.pageContainerForNewsCard}>
            <NewsCard article={articleItem} />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#ffffff',
  },
  headerButton: {
    padding: 5, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPlaceholder: {
    minWidth: 34, 
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
  },
  backButtonExternal: {
    marginTop: 20,
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pagerView: {
    flex: 1,
  },
  pageContainerForNewsCard: {
    flex: 1,
  },
}); 