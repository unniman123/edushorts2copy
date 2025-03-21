import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SavedArticlesContextType = {
  savedArticleIds: string[];
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
};

const SavedArticlesContext = createContext<SavedArticlesContextType | undefined>(undefined);

export function SavedArticlesProvider({ children }: { children: React.ReactNode }) {
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  useEffect(() => {
    // Load saved articles from AsyncStorage when the app starts
    loadSavedArticles();
  }, []);

  const loadSavedArticles = async () => {
    try {
      const savedArticles = await AsyncStorage.getItem('savedArticles');
      if (savedArticles) {
        setSavedArticleIds(JSON.parse(savedArticles));
      }
    } catch (error) {
      // Use a safer approach for error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Avoid direct console.error which might cause text rendering issues
      setTimeout(() => {
        console.log('Error loading saved articles:', errorMessage);
      }, 0);
    }
  };

  const saveSavedArticles = async (articleIds: string[]) => {
    try {
      await AsyncStorage.setItem('savedArticles', JSON.stringify(articleIds));
    } catch (error) {
      // Use a safer approach for error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Avoid direct console.error which might cause text rendering issues
      setTimeout(() => {
        console.log('Error saving articles:', errorMessage);
      }, 0);
    }
  };

  const addBookmark = (articleId: string) => {
    const updatedIds = [...savedArticleIds, articleId];
    setSavedArticleIds(updatedIds);
    saveSavedArticles(updatedIds);
  };

  const removeBookmark = (articleId: string) => {
    const updatedIds = savedArticleIds.filter(id => id !== articleId);
    setSavedArticleIds(updatedIds);
    saveSavedArticles(updatedIds);
  };

  return (
    <SavedArticlesContext.Provider
      value={{
        savedArticleIds,
        addBookmark,
        removeBookmark,
      }}
    >
      {children}
    </SavedArticlesContext.Provider>
  );
}

export function useSavedArticles() {
  const context = useContext(SavedArticlesContext);
  if (context === undefined) {
    throw new Error('useSavedArticles must be used within a SavedArticlesProvider');
  }
  return context;
}