import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';
import NewsCard from '../components/NewsCard';

type SavedArticlePagerNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SavedArticlePager'
>;

type SavedArticlePagerRouteProp = RouteProp<
  RootStackParamList,
  'SavedArticlePager'
>;

export default function SavedArticlePager() {
  const navigation = useNavigation<SavedArticlePagerNavigationProp>();
  const route = useRoute<SavedArticlePagerRouteProp>();
  const { articleId } = route.params;

  const { savedArticles } = useSavedArticles();
  const [loadedArticles, setLoadedArticles] = useState<{ [key: string]: Article }>({});
  const pagerRef = useRef<PagerView>(null);

  const fetchArticleData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*, category:category_id(id, name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        setLoadedArticles(prev => ({ ...prev, [id]: data as Article }));
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  useEffect(() => {
    savedArticles.forEach(article => {
      if (!loadedArticles[article.id]) {
        fetchArticleData(article.id);
      }
    });
  }, [savedArticles]);

  const initialPage = savedArticles.findIndex(a => a.id === articleId);

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pagerView}
      initialPage={initialPage}
      orientation="vertical"
      overdrag={false}
      onPageSelected={(e) => {
        const newIndex = e.nativeEvent.position;
        const newArticle = savedArticles[newIndex];
        if (newArticle && !loadedArticles[newArticle.id]) {
          fetchArticleData(newArticle.id);
        }
      }}
    >
      {savedArticles.map((item) => {
        const articleData = loadedArticles[item.id] || item;
        return (
          <View key={item.id} style={styles.pageContainer}>
            <NewsCard article={articleData} />
          </View>
        );
      })}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
}); 