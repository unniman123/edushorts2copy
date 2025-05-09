import React from 'react';
import { Article } from '../../types/supabase';

export const useSavedArticles = jest.fn().mockReturnValue({
  savedArticles: [],
  addBookmark: jest.fn(),
  removeBookmark: jest.fn(),
  isBookmarked: jest.fn().mockReturnValue(false),
  loading: false,
  error: null,
});

export const SavedArticlesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <>{children}</>
); 