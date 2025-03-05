import React, { useState, useCallback } from 'react';
import type { ListRenderItem } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
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

// Pre-calculate item dimensions
const ITEM_HEIGHT = 150; // Fixed height for each news card

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [news, setNews] = useState<NewsItem[]>(mockNewsData);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate fetch delay
    setTimeout(() => {
      setRefreshing(false);
      // Simulate refreshed data by reversing the order
      setNews([...mockNewsData].reverse());
    }, 2000);
  }, []);

  const loadMoreData = () => {
    if (loading) return;
    setLoading(true);
    // Simulate loading more data with unique IDs
    setTimeout(() => {
      const newData = mockNewsData.slice(0, 3).map(item => ({
        ...item,
        id: `${item.id}-${Date.now()}-${Math.random()}`
      }));
      setNews([...news, ...newData]);
      setLoading(false);
    }, 1000);
  };

  const filterNewsByCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Edushorts </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
            <View>
              <Feather name="search" size={24} color="#333" style={styles.icon} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View>
              <Feather name="bell" size={24} color="#333" style={styles.icon} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Breaking News</Text>
        {news && news.length > 0 && (
          <View style={styles.featuredNewsContainer}>
            <TouchableOpacity 
              style={styles.featuredNews}
              onPress={() => navigation.navigate('ArticleDetail', { articleId: news[0].id })}
            >
              <Image
                source={{ uri: `https://api.a0.dev/assets/image?text=students%20at%20university%20campus&aspect=16:9&seed=1` }}
                style={styles.featuredImage}
              />
              <View style={styles.featuredNewsOverlay}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>Education</Text>
                </View>
                <Text style={styles.featuredNewsTitle}>{news[0].title}</Text>
                <View style={styles.newsMetaData}>
                  <Text style={styles.newsSource}>{news[0].source}</Text>
                  <Text style={styles.newsTime}>{news[0].timeAgo}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.categoryContainer}>
          <CategorySelector 
            selectedCategory={selectedCategory}
            onSelectCategory={filterNewsByCategory}
          />
        </View>

        <FlatList
          data={news.slice(1)}
          keyExtractor={useCallback((item: NewsItem) => item.id.toString(), [])}
          renderItem={useCallback<ListRenderItem<NewsItem>>(({ item }) => (
            item ? <NewsCard article={item} /> : null
          ), [])}
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
          // Performance optimizations
          windowSize={5}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          initialNumToRender={10}
          getItemLayout={useCallback((_: ArrayLike<NewsItem> | null | undefined, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          }), [])}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.newsList}
        />
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featuredNewsContainer: {
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredNews: {
    flex: 1,
    position: 'relative',
    height: ITEM_HEIGHT, // Fixed height for consistent layout
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  featuredNewsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  categoryBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredNewsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  newsMetaData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    color: 'white',
    fontSize: 12,
  },
  newsTime: {
    color: 'white',
    fontSize: 12,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  newsList: {
    paddingBottom: 16,
  },  loaderContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
});
