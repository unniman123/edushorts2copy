import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, createChannel } from '../utils/supabase';
import { NewsRow } from '../types/supabase';
import { showToast } from '../utils/toast';
import { useAuth } from './AuthContext';

interface SavedArticleRecord {
  id: string;
  article_id: string;
  user_id: string;
  saved_at: string;
  is_read: boolean;
  news?: NewsRow;
}

export interface SavedArticle {
  id: string;
  title: string;
  summary: string;
  image_path: string | null;
  source_name: string | null;
  source_url: string | null;
  category_id: string | null;
  saved_at: string;
  is_read: boolean;
}

type SavedArticlesContextType = {
  savedArticles: SavedArticle[];
  addBookmark: (articleId: string) => Promise<void>;
  removeBookmark: (articleId: string) => Promise<void>;
  isLoading: boolean;
};

const SavedArticlesContext = createContext<SavedArticlesContextType | undefined>(undefined);

export function SavedArticlesProvider({ children }: { children: ReactNode }) {
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { session, isLoading: authLoading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  const loadSavedArticles = useCallback(async () => {
    console.log('SavedArticlesContext: Loading saved articles...');
    try {
      if (session?.user) {
        console.log('SavedArticlesContext: Fetching from Supabase for user:', session.user.id);

        const { data, error } = await supabase
          .from('saved_articles')
          .select(`
            id,
            article_id,
            saved_at,
            is_read,
            news:article_id (
              id,
              title,
              summary,
              image_path,
              source_name,
              source_url,
              category_id
            )
          `)
          .eq('user_id', session.user.id)
          .order('saved_at', { ascending: false });

        if (error) throw error;

        if (!data) return;

        type SavedArticleResponse = {
          id: string;
          article_id: string;
          saved_at: string;
          is_read: boolean;
          news?: {
            id: string;
            title: string;
            summary: string;
            image_path: string | null;
            source_name: string | null;
            source_url: string | null;
            category_id: string | null;
          };
        };

        // First cast to unknown to avoid direct type assertion errors
        const rawData = data as unknown;
        // Then cast to our expected type
        const typedData = rawData as SavedArticleResponse[];
        
        const articles: SavedArticle[] = typedData
          .filter((item): item is SavedArticleResponse & { news: NonNullable<SavedArticleResponse['news']> } => 
            item.news != null
          )
          .map(item => ({
            id: item.article_id,
            title: item.news.title,
            summary: item.news.summary,
            image_path: item.news.image_path,
            source_name: item.news.source_name,
            source_url: item.news.source_url,
            category_id: item.news.category_id,
            saved_at: item.saved_at,
            is_read: item.is_read
          }));

        setSavedArticles(articles);
        await AsyncStorage.setItem('savedArticles', JSON.stringify(articles));
        console.log('SavedArticlesContext: Loaded', articles.length, 'saved articles');
      } else {
        // Try loading from AsyncStorage when offline
        const savedData = await AsyncStorage.getItem('savedArticles');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setSavedArticles(parsed);
          console.log('SavedArticlesContext: Loaded from AsyncStorage:', parsed.length, 'articles');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', 'Error loading saved articles');
      console.error('SavedArticlesContext: Error loading articles:', errorMessage);
    }
  }, [session]);

  useEffect(() => {
    // Load articles once auth is ready
    if (!authLoading && !initialized) {
      console.log('SavedArticlesContext: Initial load started');
      loadSavedArticles().then(() => {
        setInitialized(true);
        console.log('SavedArticlesContext: Initial load complete');
      });
    }
  }, [authLoading, loadSavedArticles, initialized]);

  useEffect(() => {
    // Set up real-time subscription only when authenticated
    if (!session?.user || authLoading || !initialized) {
      console.log('SavedArticlesContext: Skipping real-time setup -', 
        !session?.user ? 'No session' : 
        authLoading ? 'Auth loading' : 
        'Not initialized');
      return;
    }

    console.log('SavedArticlesContext: Setting up real-time subscription for user:', session.user.id);
    
    let isSubscribed = true;
    const { channel, cleanup } = createChannel('saved_articles');
    
    channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'saved_articles',
          filter: `user_id=eq.${session.user.id}` // Only listen to user's changes
        }, 
        async (payload) => {
          if (!isSubscribed) return;
          console.log('SavedArticlesContext: Real-time update received, reloading...');
          await loadSavedArticles();
        }
      );

    return () => {
      console.log('SavedArticlesContext: Cleaning up subscription');
      isSubscribed = false;
      cleanup();
    };
  }, [session, authLoading, loadSavedArticles, initialized]);

  const addBookmark = async (articleId: string) => {
    console.log('SavedArticlesContext: Adding bookmark:', articleId);
    setIsLoading(true);
    try {
      if (!session?.user) {
        console.log('SavedArticlesContext: No session, saving to AsyncStorage only');
        // First fetch the article data
        const { data: articleData, error: articleError } = await supabase
          .from('news')
          .select('*')
          .eq('id', articleId)
          .single();

        if (articleError) throw articleError;
        if (!articleData) throw new Error('Article not found');

        const newSavedArticle: SavedArticle = {
          id: articleId,
          title: articleData.title || '',
          summary: articleData.summary || '',
          image_path: articleData.image_path || '',
          source_name: articleData.source_name || '',
          source_url: articleData.source_url || '',
          category_id: articleData.category_id || '',
          saved_at: new Date().toISOString(),
          is_read: false
        };

        const updatedArticles = [...savedArticles, newSavedArticle];
        setSavedArticles(updatedArticles);
        await AsyncStorage.setItem('savedArticles', JSON.stringify(updatedArticles));
        return;
      }

      const { error } = await supabase
        .from('saved_articles')
        .insert([
          {
            article_id: articleId,
            user_id: session.user.id,
            is_read: false
          }
        ]);

      if (error) throw error;
      
      // Reload to get the latest data
      await loadSavedArticles();
      console.log('SavedArticlesContext: Bookmark added successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', 'Error saving article');
      console.error('SavedArticlesContext: Error adding bookmark:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeBookmark = async (articleId: string) => {
    console.log('SavedArticlesContext: Removing bookmark:', articleId);
    setIsLoading(true);
    try {
      if (!session?.user) {
        console.log('SavedArticlesContext: No session, removing from AsyncStorage only');
        const updatedArticles = savedArticles.filter(article => article.id !== articleId);
        setSavedArticles(updatedArticles);
        await AsyncStorage.setItem('savedArticles', JSON.stringify(updatedArticles));
        return;
      }

      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      // Update local state optimistically
      setSavedArticles(current => current.filter(article => article.id !== articleId));
      console.log('SavedArticlesContext: Bookmark removed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', 'Error removing saved article');
      console.error('SavedArticlesContext: Error removing bookmark:', errorMessage);
      // Reload in case of error to ensure consistency
      await loadSavedArticles();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SavedArticlesContext.Provider
      value={{
        savedArticles,
        addBookmark,
        removeBookmark,
        isLoading
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
