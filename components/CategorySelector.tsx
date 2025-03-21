import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useNews } from '../context/NewsContext';

interface Category {
  id: string;
  name: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'education', name: 'Education' },
  { id: 'scholarships', name: 'Scholarships' },
  { id: 'visas', name: 'Visas' },
  { id: 'immigration', name: 'Immigration' },
  { id: 'study-abroad', name: 'Study Abroad' },
  { id: 'research', name: 'Research' },
];

interface CategorySelectorProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  useGlobalContext?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory: propSelectedCategory,
  onSelectCategory,
  useGlobalContext = false
}) => {
  const { filterByCategory } = useNews();
  const [localSelectedCategory, setLocalSelectedCategory] = React.useState('All');
  
  const selectedCategory = propSelectedCategory || localSelectedCategory;

  const handleCategorySelect = (category: string) => {
    if (useGlobalContext) {
      filterByCategory(category === 'All' ? null : category);
    }
    setLocalSelectedCategory(category);
    onSelectCategory?.(category);
  };

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
          onPress={() => handleCategorySelect(category.name)}
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
  },  selectedCategory: {
    backgroundColor: '#ff0000',
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
