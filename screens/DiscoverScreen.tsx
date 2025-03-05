import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CategorySelector from '../components/CategorySelector';
import { mockNewsData } from '../data/mockData';

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState(mockNewsData);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults(mockNewsData);
      return;
    }
    
    const filtered = mockNewsData.filter(
      (item) => 
        item.title.toLowerCase().includes(text.toLowerCase()) ||
        item.summary.toLowerCase().includes(text.toLowerCase()) ||
        item.content.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const filterByCategory = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setSearchResults(mockNewsData);
      return;
    }
    
    const filtered = mockNewsData.filter(item => item.category === category);
    setSearchResults(filtered);
  };

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
          <Feather name="sliders" size={20} color="#0066cc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoryContainer}>
        <CategorySelector 
          selectedCategory={selectedCategory}
          onSelectCategory={filterByCategory}
        />
      </View>
      
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
            <View style={styles.resultContent}>
              <View style={styles.categoryWrapper}>
                <Text style={styles.categoryLabel}>{item.category}</Text>
              </View>
              <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.resultMeta}>
                <Image source={{ uri: item.sourceIconUrl }} style={styles.sourceIcon} />
                <Text style={styles.sourceText}>{item.source}</Text>
                <Text style={styles.timeText}> • {item.timeAgo}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
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
});