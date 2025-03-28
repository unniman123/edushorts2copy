import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useNews } from '../context/NewsContext';
import NewsCard from '../components/NewsCard';
import PagerView from 'react-native-pager-view'; // Import PagerView

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { news, loading, error, refreshNews, loadMoreNews } = useNews();
  // Removed isRefreshing state and handleRefresh function as RefreshControl is not used with PagerView directly
  const [isLoadingMore, setIsLoadingMore] = useState(false); // State to prevent multiple loadMore calls

  const handleLoadMore = async () => {
    // Don't load more if we're already loading, refreshing, or have no news
    // Also check isLoadingMore state
    if (loading || isLoadingMore || news.length === 0) return;
 
    
    setIsLoadingMore(true); // Set loading more state
    try {
      await loadMoreNews();
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setIsLoadingMore(false); // Reset loading more state
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
        </View>
      </SafeAreaView>
   );
   }

  return (
    <SafeAreaView style={styles.container}>
      <PagerView
        style={styles.pagerView}
        orientation="vertical"
        initialPage={0}
        onPageScroll={(e) => {
          // Basic load more trigger: if scrolling near the end and not already loading
          const { position, offset } = e.nativeEvent;
          // Trigger when user is scrolling *towards* the last page (offset > 0) 
          // and is close to it (position >= news.length - 2)
          if (offset > 0 && position >= news.length - 2 && !isLoadingMore) {
             handleLoadMore();
          }
        }}
      >
        {news.map((article) => (
          // Each child of PagerView must be a View with a key
          <View key={article.id}> 
            <NewsCard article={article} />
          </View>
        ))}
      </PagerView>
      {/* Optional: Add a loading indicator for loadMore */}
      {isLoadingMore && (
        <View style={styles.loadingMoreIndicator}>
          <ActivityIndicator size="small" color="#ff0000" />
        </View>
      )}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Match container background
  },
 container: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed background to white for full screen card
  },
  pagerView: { // Style for the PagerView component
    flex: 1,
  },
  loadingMoreIndicator: { // Style for the load more indicator overlay
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
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
