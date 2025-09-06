/**
 * CategorySelector - Horizontal scrollable category filter component for news articles
 * 
 * Renders a horizontal list of category buttons that allow users to filter news articles
 * by category. Supports both controlled and uncontrolled modes, with optional integration
 * with the global NewsContext for automatic filtering. Uses React.memo for performance
 * optimization and includes proper accessibility features.
 * 
 * @component
 * @param {CategorySelectorProps} props - Component properties
 * @returns {React.ReactElement} The rendered category selector component
 * 
 * @example
 * // Controlled mode with custom handler
 * <CategorySelector
 *   selectedCategory="scholarships"
 *   onSelectCategory={handleCategoryChange}
 *   useGlobalContext={false}
 * />
 * 
 * @example
 * // Uncontrolled mode with global context integration
 * <CategorySelector
 *   useGlobalContext={true}
 * />
 */
import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useNews } from '../context/NewsContext';
import { COLORS } from '../constants/theme';

/**
 * Category data structure for news filtering
 * @interface Category
 */
interface Category {
  /** Unique identifier for the category */
  id: string;
  /** Display name for the category */
  name: string;
}

/**
 * Predefined categories for news filtering
 * Includes special 'all' category for showing all news articles
 * @constant {Category[]}
 */
const categories: Category[] = [
  { id: 'all', name: 'All' }, // Special case for showing all news
  { id: 'f9abf635-267d-43a0-8bc1-05f8c3ed14aa', name: 'Foreign Education' },
  { id: '3ee1584a-d113-4c2c-a0e1-bd2807f13a7d', name: 'Scholarships' },
  { id: 'e15f365c-e438-4635-a42d-8b1556e760e5', name: 'Visas' },
  { id: '1203777a-c24b-47da-a958-136d06cd2555', name: 'Immigration' },
  { id: '8c7d6c6c-2031-40fd-9840-5c2ab0226cfe', name: 'Courses' }
];

/**
 * Props interface for CategorySelector component
 * @interface CategorySelectorProps
 */
interface CategorySelectorProps {
  /** Currently selected category ID (controlled mode) */
  selectedCategory?: string;
  /** Callback function called when a category is selected */
  onSelectCategory?: (category: string) => void;
  /** Whether to use global NewsContext for filtering (default: false) */
  useGlobalContext?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = memo(({
  selectedCategory: propSelectedCategory,
  onSelectCategory,
  useGlobalContext = false
}) => {
  const { filterByCategory } = useNews();
  const [localSelectedCategory, setLocalSelectedCategory] = React.useState<string>('all');
  
  const selectedCategory = propSelectedCategory || localSelectedCategory;

  /**
   * Handles category selection with support for both controlled and uncontrolled modes
   * @param {string} categoryId - The ID of the selected category
   * @returns {Promise<void>} Promise that resolves when selection is complete
   */
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    if (useGlobalContext) {
      await filterByCategory(categoryId === 'all' ? null : categoryId);
    }
    setLocalSelectedCategory(categoryId);
    onSelectCategory?.(categoryId);
  }, [useGlobalContext, filterByCategory, onSelectCategory]);

  /**
   * Memoized category items to prevent re-rendering when props haven't changed
   * Optimizes performance by only re-computing when selectedCategory or handleCategorySelect changes
   */
  const categoryItems = useMemo(() => categories.map((category) => (
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
  )), [selectedCategory, handleCategorySelect]);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categoryItems}
    </ScrollView>
  );
});

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
    backgroundColor: COLORS.PRIMARY,
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
