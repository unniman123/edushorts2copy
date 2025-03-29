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
import PagerView from 'react-native-pager-view';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface HomeScreenRef {
  scrollToTop: () => void;
}

const HomeScreen = React.forwardRef<HomeScreenRef>((props, ref) => {
  const pagerRef = React.useRef<PagerView>(null);
  const navigation = useNavigation<NavigationProp>();
  const { news, loading, error, refreshNews, loadMoreNews } = useNews();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      pagerRef.current?.setPage(0);
    }
  }));

  const handleLoadMore = async () => {
    if (loading || isLoadingMore || news.length === 0) return;
    
    setIsLoadingMore(true);
    try {
      await loadMoreNews();
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setIsLoadingMore(false);
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

  if (loading && news.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && news.length === 0 && !error) {
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
        ref={pagerRef}
        style={styles.pagerView}
        orientation="vertical"
        initialPage={0}
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          if (offset > 0 && position >= news.length - 2 && !isLoadingMore) {
            handleLoadMore();
          }
        }}
      >
        {news.map((article) => (
          <View key={article.id}>
            <NewsCard article={article} />
          </View>
        ))}
      </PagerView>
      {isLoadingMore && (
        <View style={styles.loadingMoreIndicator}>
          <ActivityIndicator size="small" color="#ff0000" />
        </View>
      )}
    </SafeAreaView>
  );
});

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
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pagerView: {
    flex: 1,
  },
  loadingMoreIndicator: {
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

export default HomeScreen;
