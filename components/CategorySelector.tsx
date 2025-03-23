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
  { id: 'all', name: 'All' }, // Special case for showing all news
  { id: 'f9abf635-267d-43a0-8bc1-05f8c3ed14aa', name: 'Foreign Education' },
  { id: '3ee1584a-d113-4c2c-a0e1-bd2807f13a7d', name: 'Scholarships' },
  { id: 'e15f365c-e438-4635-a42d-8b1556e760e5', name: 'Visas' },
  { id: '1203777a-c24b-47da-a958-136d06cd2555', name: 'Immigration' },
  { id: '8c7d6c6c-2031-40fd-9840-5c2ab0226cfe', name: 'Courses' }
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
  const [localSelectedCategory, setLocalSelectedCategory] = React.useState<string>('all');
  
  const selectedCategory = propSelectedCategory || localSelectedCategory;

  const handleCategorySelect = async (categoryId: string) => {
    if (useGlobalContext) {
      await filterByCategory(categoryId === 'all' ? null : categoryId);
    }
    setLocalSelectedCategory(categoryId);
    onSelectCategory?.(categoryId);
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
            selectedCategory === category.id && styles.selectedCategory,
          ]}
          onPress={() => handleCategorySelect(category.id)}
        >
          <Text 
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText,
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
