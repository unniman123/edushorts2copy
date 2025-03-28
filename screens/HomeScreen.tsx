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

  // Render loading indicator while news is loading initially
  if (loading && news.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      </SafeAreaView>
    );
  }

  // Render message if there are no news articles
  if (!loading && news.length === 0 && !error) { // Added !error check
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyList}>
          <Text>No news available.</Text>
          {/* Consider adding a manual refresh button here if needed */}
          {/* <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity> */}
        </View>
      </SafeAreaView>
   );
   }

  return (
    <SafeAreaView style={styles.container}>
      {/* Render only the first news card for design purposes in Phase 1 */}
      {/* Ensure news array is not empty before accessing news[0] */}
     { news.length > 0 && <NewsCard article={news[0]} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
 // Added style for loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Match container background
  },
 container: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed background to white for full screen card
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
