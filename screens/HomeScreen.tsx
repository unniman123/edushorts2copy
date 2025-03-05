import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
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
};

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [news, setNews] = useState<NewsItem[]>(mockNewsData);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetch delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const loadMoreData = () => {
    if (loading) return;
    setLoading(true);
    // Simulate loading more data
    setTimeout(() => {
      setNews([...news, ...mockNewsData.slice(0, 3)]);
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
        <Text style={styles.logo}>GlobalEdu News</Text>
        <View style={styles.headerIcons} key="header-icons">
          <TouchableOpacity key="search-icon" onPress={() => navigation.navigate('Discover')}>
            <View>
              <Feather name="search" size={24} color="#333" style={styles.icon} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity key="notifications-icon" onPress={() => navigation.navigate('Notifications')}>
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
                <View style={styles.categoryBadge} key="featured-category">
                  <Text style={styles.categoryText} key="featured-category-text">Education</Text>
                </View>
                <Text style={styles.featuredNewsTitle} key="featured-title">{news[0].title}</Text>
                <View style={styles.newsMetaData} key="featured-metadata">
                  <Text style={styles.newsSource} key="featured-source">{news[0].source}</Text>
                  <Text style={styles.newsTime} key="featured-time">{news[0].timeAgo}</Text>
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
          keyExtractor={(item, index) => item.id + index.toString()}
          renderItem={({ item }) => (
            item ? <NewsCard article={item} /> : null
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
