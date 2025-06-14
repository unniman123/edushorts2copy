import React, { useState, useCallback } from 'react';
import { useSavedArticles } from '../context/SavedArticlesContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import BookmarkCard from '../components/BookmarkCard';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

export default function BookmarksScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { savedArticles } = useSavedArticles();
  const [loading, setLoading] = useState(false);

  const { removeBookmark } = useSavedArticles();

  const handleRemoveBookmark = (articleId: string) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to remove this article from your saved list?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeBookmark(articleId),
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <BookmarkCard
      item={item}
      onPress={() => navigation.navigate('SavedArticlePager', { articleId: item.id })}
      onRemove={() => handleRemoveBookmark(item.id)}
    />
  ), [navigation, handleRemoveBookmark]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <View style={{width: 24}} />
      </View>

      {savedArticles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No saved articles</Text>
          <Text style={styles.emptySubtitle}>
            Articles you save will appear here for easy access
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Main', {
              screen: 'HomeTab'
            })}
          >
            <Text style={styles.browseButtonText}>Browse Articles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedArticles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          ListFooterComponent={loading ? (
            <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
          ) : null}
        />
      )}
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  }, browseButton: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
  }, categoryBadge: {
    backgroundColor: '#ff0000',
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
