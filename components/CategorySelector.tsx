import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const categories = [
  { id: '1', name: 'All' },
  { id: '2', name: 'Education' },
  { id: '3', name: 'Scholarships' },
  { id: '4', name: 'Visas' },
  { id: '5', name: 'Immigration' },
  { id: '6', name: 'Study Abroad' },
  { id: '7', name: 'Research' },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategorySelector = ({ selectedCategory, onSelectCategory }: CategorySelectorProps) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryItem,
            selectedCategory === category.name && styles.selectedCategory,
          ]}
          onPress={() => onSelectCategory(category.name)}
        >
          <Text 
            style={[
              styles.categoryText,
              selectedCategory === category.name && styles.selectedCategoryText,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#0066cc',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CategorySelector;
