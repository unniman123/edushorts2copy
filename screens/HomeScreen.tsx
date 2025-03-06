import React, { useState, useCallback, useEffect } from 'react';
import type { ListRenderItem } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import NewsCard from '../components/NewsCard';
import CategorySelector from '../components/CategorySelector';
import SkeletonLoader from '../components/SkeletonLoader';
import { mockNewsData } from '../data/mockData';

export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  Discover: undefined;
  ArticleDetail: { articleId: string };
  Notifications: undefined;
  Bookmarks: undefined;
  Profile: undefined;
  AdminDashboard: undefined;
  Login: undefined;
  Register: undefined;
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  timeAgo: string;
  imageUrl: string;
  sourceIconUrl: string;
  url: string;
};

const ITEM_HEIGHT = 150; // Fixed height for each news card

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [news, setNews] = useState<NewsItem[]>(mockNewsData);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Define all callbacks first
  const keyExtractor = useCallback((item: NewsItem) => item.id.toString(), []);
  
  const renderItem = useCallback<ListRenderItem<NewsItem>>(({ item }) => (
    item ? <NewsCard article={item} /> : null
  ), []);

  const getItemLayout = useCallback((_: ArrayLike<NewsItem> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setNews([...mockNewsData].reverse());
    }, 1500);
  }, []);

  const loadMoreData = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const newData = mockNewsData.slice(0, 3).map(item => ({
        ...item,
        id: `${item.id}-${Date.now()}-${Math.random()}`
      }));
      setNews(prevNews => [...prevNews, ...newData]);
      setLoading(false);
    }, 1000);
  }, [loading]);

  const filterNewsByCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setNews(mockNewsData);
      return;
    }
    const filtered = mockNewsData.filter(item => item.category === category);
    setNews(filtered);
  }, []);

  const renderFooter = useCallback(() => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }, [loading]);

  // Effects after callbacks
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const renderHeader = useCallback(() => (
    <View style={styles.categoryContainer}>
      <CategorySelector 
        selectedCategory={selectedCategory}
        onSelectCategory={filterNewsByCategory}
      />
    </View>
  ), [selectedCategory, filterNewsByCategory]);

  const renderContent = () => (
    <FlatList
      data={news}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      refreshControl={
        Platform.select({
          ios: (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0066cc"
            />
          ),
          android: (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066cc', '#00cc99']}
              progressBackgroundColor="#ffffff"
              progressViewOffset={20}
            />
          ),
        })
      }
      windowSize={5}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={true}
      initialNumToRender={10}
      getItemLayout={getItemLayout}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      onEndReached={loadMoreData}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.newsList}
    />
  );

  const renderSkeletons = () => (
    <View style={styles.content}>
      {renderHeader()}
      {Array(5).fill(null).map((_, index) => (
        <SkeletonLoader 
          key={index}
          width="100%"
          height={ITEM_HEIGHT}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Edushorts</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
            <Feather name="search" size={24} color="#333" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Feather name="bell" size={24} color="#333" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {initialLoading ? renderSkeletons() : renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  newsList: {
    paddingBottom: 16,
  },
  loaderContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
});
