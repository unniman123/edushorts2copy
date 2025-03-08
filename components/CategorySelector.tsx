import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AccessibilityProps } from '../types/accessibility';

const categories = [
  { id: '1', name: 'All' },
  { id: '2', name: 'Education' },
  { id: '3', name: 'Scholarships' },
  { id: '4', name: 'Visas' },
  { id: '5', name: 'Immigration' },
  { id: '6', name: 'Study Abroad' },
  { id: '7', name: 'Research' },
];

export interface CategorySelectorProps {
  // For single select mode
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  // For multi select mode
  selectedCategories?: string[];
  onSelectCategories?: (categories: string[]) => void;
  // Mode configuration
  multiSelect?: boolean;
}

const CategorySelector = ({
  selectedCategory,
  onSelectCategory,
  selectedCategories = [],
  onSelectCategories,
  multiSelect = false,
}: CategorySelectorProps) => {
  const handleSelect = (categoryName: string) => {
    if (multiSelect && onSelectCategories) {
      if (categoryName === 'All') {
        // Clear selection when "All" is clicked
        onSelectCategories([]);
      } else {
        const updatedCategories = selectedCategories.includes(categoryName)
          ? selectedCategories.filter(c => c !== categoryName)
          : [...selectedCategories, categoryName];
        onSelectCategories(updatedCategories);
      }
    } else if (onSelectCategory) {
      onSelectCategory(categoryName);
    }
  };

  const isSelected = (categoryName: string) => {
    if (multiSelect) {
      return selectedCategories.includes(categoryName);
    }
    return selectedCategory === categoryName;
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
            isSelected(category.name) && styles.selectedCategory,
          ]}
          onPress={() => handleSelect(category.name)}
          accessible={true}
          accessibilityLabel={`Category: ${category.name}`}
          accessibilityHint={`Click to ${multiSelect ? 'toggle' : 'select'} ${category.name} category`}
          accessibilityState={{ selected: isSelected(category.name) }}
        >
          <Text 
            style={[
              styles.categoryText,
              isSelected(category.name) && styles.selectedCategoryText,
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

const areEqual = (prevProps: CategorySelectorProps, nextProps: CategorySelectorProps) => {
  if (prevProps.multiSelect) {
    return JSON.stringify(prevProps.selectedCategories) === JSON.stringify(nextProps.selectedCategories);
  }
  return prevProps.selectedCategory === nextProps.selectedCategory;
};

export default memo(CategorySelector, areEqual);
