import React, { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Article } from '../types/supabase';
import { useNews } from '../context/NewsContext';
import CategorySelector from '../components/CategorySelector';
import { ArticleResultCard } from '../components/ArticleResultCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Discover'>;

export default function DiscoverScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setSearchQuery(text);
    setLoading(true);

    try {
      let query = supabase
        .from('news')
        .select(`
          *,
          category:category_id (
            id,
            name
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (text.trim() !== '') {
        query = query.or(`title.ilike.%${text}%,summary.ilike.%${text}%,content.ilike.%${text}%`);
      }

      if (selectedCategory !== 'All') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setSearchResults(data as Article[] || []);
    } catch (error) {
      console.error('Error searching news:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const filterByCategory = useCallback(async (category: string) => {
    setSelectedCategory(category);
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>News from all around the world</Text>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for news..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color="#ff0000" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={filterByCategory}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ArticleResultCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
            />
          )}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  filterButton: {
    padding: 4,
  },
  categoryContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultItem: {
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
  resultImage: {
    width: 120,
    height: 120,
  },
  resultContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryWrapper: {
    backgroundColor: '#0066cc',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
