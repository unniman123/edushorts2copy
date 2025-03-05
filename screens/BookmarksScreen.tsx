import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { mockNewsData } from '../data/mockData';
import { AccessibilityProps } from '../types/accessibility';
import EmptyState from '../components/EmptyState';

type RootStackParamList = {
  Home: undefined;
  ArticleDetail: { articleId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const BookmarksScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bookmarkedArticles, setBookmarkedArticles] = useState(mockNewsData.slice(0, 3));
  const [loading, setLoading] = useState(false);

  const removeBookmark = (articleId: string) => {
    setBookmarkedArticles(bookmarkedArticles.filter(article => article.id !== articleId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="More options"
          accessibilityHint="Shows additional options for saved articles"
        >
          <Feather name="more-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {bookmarkedArticles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bookmark"
            title="No Saved Articles"
            subtitle="Articles you save will appear here for easy access"
          />
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
            accessible={true}
            accessibilityLabel="Browse Articles"
            accessibilityHint="Click to explore available articles"
          >
            <Text style={styles.browseButtonText}>Browse Articles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookmarkedArticles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.articleCard}>
              <TouchableOpacity 
                style={styles.articleContent}
                onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
                accessible={true}
                accessibilityLabel={`Article: ${item.title}`}
                accessibilityHint="Click to read the full article"
              >
                <Image source={{ uri: item.imageUrl }} style={styles.articleImage} />
                <View style={styles.articleDetails}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.articleMeta}>
                    <Text style={styles.sourceText}>{item.source}</Text>
                    <Text style={styles.timeText}>{item.timeAgo}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeBookmark(item.id)}
                accessible={true}
                accessibilityLabel={`Remove ${item.title} from bookmarks`}
                accessibilityHint="Click to remove this article from your saved articles"
              >
                <Feather name="trash-2" size={18} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListFooterComponent={loading ? (
            <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
          ) : null}
          windowSize={5}
          maxToRenderPerBatch={5}
          removeClippedSubviews={true}
          initialNumToRender={10}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  browseButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  articleContent: {
    flex: 1,
    flexDirection: 'row',
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#0066cc',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 10,
    color: '#888',
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eeeeee',
  },
  loader: {
    marginVertical: 16,
  },
});

export default memo(BookmarksScreen);
