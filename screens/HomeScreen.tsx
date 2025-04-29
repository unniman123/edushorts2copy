import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNews } from '../context/NewsContext';
import { useAdvertisements } from '../context/AdvertisementContext';
import NewsCard from '../components/NewsCard';
import AdvertCard from '../components/AdvertCard';
import PagerView from 'react-native-pager-view';
import { Article } from '../types/supabase';
import { Advertisement } from '../types/advertisement';

interface HomeScreenRef {
  scrollToTop: () => void;
}

type AdItem = { type: 'ad'; id: string; content: Advertisement };
type NewsItem = Article;
type ContentItem = NewsItem | AdItem;

const isNewsItem = (item: ContentItem): item is NewsItem => {
  return !('type' in item);
};

const HomeScreen = React.forwardRef<HomeScreenRef>((_, ref) => {
  const pagerRef = React.useRef<PagerView>(null);
  const { news, loading: newsLoading, error: newsError, refreshNews, loadMoreNews } = useNews();
  const { advertisements } = useAdvertisements();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Function to merge news and ads
  const getMergedContent = useCallback((): ContentItem[] => {
    console.log('Debug - News count:', news.length);
    console.log('Debug - Advertisements:', advertisements);

    if (!advertisements || advertisements.length === 0) {
      console.log('Debug - No advertisements available');
      return [...news] as ContentItem[];
    }

    // Initialize merged array
    const merged: ContentItem[] = [];
    const frequency = advertisements[0]?.display_frequency || 5;
    let adIndex = 0;

    console.log('Debug - Ad frequency:', frequency);

    // Insert news items and ads in sequence
    news.forEach((newsItem, index) => {
      merged.push(newsItem as ContentItem);
      
      // If we've reached the frequency point, insert an ad
      if ((index + 1) % frequency === 0 && adIndex < advertisements.length) {
        const ad = advertisements[adIndex];
        console.log('Debug - Inserting ad after news index:', index);
        merged.push({
          type: 'ad',
          id: ad.id || `ad-${adIndex}`,
          content: ad
        });
        adIndex = (adIndex + 1) % advertisements.length;
      }
    });

    console.log('Debug - Final merged content:', merged);
    return merged;
  }, [news, advertisements]);

  const content = getMergedContent();

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      pagerRef.current?.setPage(0);
    }
  }));

  const handleLoadMore = useCallback(async () => {
    if (newsLoading || isLoadingMore || news.length === 0) return;

    setIsLoadingMore(true);
    try {
      await loadMoreNews();
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [newsLoading, isLoadingMore, news.length, loadMoreNews]);

  if (newsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {newsError}</Text>
          <TouchableOpacity onPress={refreshNews} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (newsLoading && news.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!newsLoading && news.length === 0 && !newsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyList}>
          <Text>No news available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pages = content.map((item) => {
    if (!isNewsItem(item)) {
      return (
        <View style={styles.pageContainer} key={`ad_${item.id}`}>
          <AdvertCard advertisement={item.content} />
        </View>
      );
    }
    return (
      <View style={styles.pageContainer} key={`news_${item.id}`}>
        <NewsCard article={item} />
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
        offscreenPageLimit={1}
        overdrag={false}
        pageMargin={10}
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
