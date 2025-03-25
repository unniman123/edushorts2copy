import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useNews } from '../context/NewsContext';
import NewsCard from '../components/NewsCard';
import CategorySelector from '../components/CategorySelector';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { news, loading, error, refreshNews, loadMoreNews } = useNews();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshNews();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    // Don't load more if we're already loading, refreshing, or have no news
    if (loading || isRefreshing || news.length === 0) return;
    try {
      await loadMoreNews();
    } catch (error) {
      console.error('Error loading more news:', error);
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={refreshNews} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Edushorts News</Text>
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
        <View style={styles.categoryContainer}>
          <CategorySelector useGlobalContext={true} />
        </View>

        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NewsCard article={item} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#ff0000']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          contentContainerStyle={[
            styles.newsList,
            news.length === 0 && styles.emptyList
          ]}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    color: '#ff0000',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
