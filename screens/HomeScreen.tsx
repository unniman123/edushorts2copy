import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNews } from '../context/NewsContext';
import NewsCard from '../components/NewsCard';
import PagerView from 'react-native-pager-view';
import branch from 'react-native-branch';
import { useNavigation } from '@react-navigation/native';
import BranchHelper from '../utils/branchHelper';

interface HomeScreenRef {
  scrollToTop: () => void;
}

const HomeScreen = React.forwardRef<HomeScreenRef>((props, ref) => {
  const pagerRef = React.useRef<PagerView>(null);
  const { news, loading, error, refreshNews, loadMoreNews } = useNews();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigation = useNavigation();

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      pagerRef.current?.setPage(0);
    }
  }));

  

  const handleLoadMore = useCallback(async () => {
    if (loading || isLoadingMore || news.length === 0) return;

    setIsLoadingMore(true);
    try {
      await loadMoreNews();
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [loading, isLoadingMore, news.length, loadMoreNews]);

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

  // Create page elements outside of the JSX to avoid TypeScript issues with keys
  const pages = news.map((article) => {
    return (
      // @ts-ignore - Ignoring the key prop TypeScript error
      <View style={styles.pageContainer} key={`page_${article.id}`}>
        <NewsCard article={article} />
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <PagerView
        // @ts-ignore - Ignoring the ref TypeScript error
        ref={pagerRef}
        style={styles.pagerView}
        orientation="vertical"
        initialPage={0}
        offscreenPageLimit={1} // Only keep 1 page in each direction in memory
        overdrag={false} // Prevent overdragging beyond content bounds
        pageMargin={10} // Add small margin between pages for better visual separation
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          if (offset > 0 && position >= news.length - 2 && !isLoadingMore) {
            handleLoadMore();
          }
        }}
      >
        {pages}
      </PagerView>
      {isLoadingMore && (
        <View style={styles.loadingMoreIndicator}>
          <ActivityIndicator size="small" color="#ff0000" />
        </View>
      )}
    </SafeAreaView>
  );
});

HomeScreen.displayName = 'HomeScreen';

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
  pageContainer: {
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
