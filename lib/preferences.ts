import { supabase } from './supabaseClient';
import { UserPreferences, SavedArticle, Article } from '../types/accessibility';
import { withTimeout, withRetry, DEFAULT_TIMEOUT, TimeoutError } from './timeoutUtils';
import { PostgrestResponse } from '@supabase/supabase-js';

// Database response types
type DbArticle = Pick<Article, 'id' | 'title' | 'summary' | 'image_path' | 'category_id' | 'created_at'>;

interface DbSavedArticle {
  user_id: string;
  article_id: string;
  saved_at: string;
  article: DbArticle;
}

class PreferencesService {
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {  // Record not found
              return null;
            }
            throw error;
          }
          
          return data as UserPreferences;
        },
        {
          timeoutMs: DEFAULT_TIMEOUT.DATA,
          maxAttempts: 3,
          retryableError: (error) => error instanceof TimeoutError
        }
      );

      return result;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch preferences');
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const result = await withTimeout(
        async () => {
          const { data, error } = await supabase
            .from('user_preferences')
            .upsert(
              {
                user_id: userId,
                ...preferences,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'user_id' }
            )
            .select()
            .single();

          if (error) throw error;
          return data as UserPreferences;
        },
        DEFAULT_TIMEOUT.DATA,
        'Preference update operation timed out'
      );

      return result;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update preferences');
    }
  }

  async getSavedArticles(userId: string): Promise<SavedArticle[]> {
    try {
      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('saved_articles')
            .select(`
              user_id,
              article_id,
              saved_at,
              article:articles (
                id,
                title,
                summary,
                image_path,
                category_id,
                created_at
              )
            `)
            .eq('user_id', userId)
            .order('saved_at', { ascending: false });

          if (error) throw error;

          // Cast the database response
          const savedArticles = (data as unknown as DbSavedArticle[]).map(item => ({
            user_id: item.user_id,
            article_id: item.article_id,
            saved_at: item.saved_at,
            article: {
              ...item.article,
              content: '', // Required by Article interface but not needed for saved articles list
              created_by: '', // Required by Article interface but not needed for saved articles list
              saved: true // Client-side UI state
            }
          })) satisfies SavedArticle[];

          return savedArticles;
        },
        {
          timeoutMs: DEFAULT_TIMEOUT.DATA,
          maxAttempts: 2,
          retryableError: (error) => error instanceof TimeoutError
        }
      );

      return result;
    } catch (error) {
      console.error('Error fetching saved articles:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch saved articles');
    }
  }

  async saveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      await withTimeout(
        async () => {
          const { error } = await supabase
            .from('saved_articles')
            .insert([
              {
                user_id: userId,
                article_id: articleId,
                saved_at: new Date().toISOString()
              }
            ]);

          if (error) throw error;
        },
        DEFAULT_TIMEOUT.DATA,
        'Save article operation timed out'
      );

      return true;
    } catch (error) {
      console.error('Error saving article:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to save article');
    }
  }

  async unsaveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      await withTimeout(
        async () => {
          const { error } = await supabase
            .from('saved_articles')
            .delete()
            .eq('user_id', userId)
            .eq('article_id', articleId);

          if (error) throw error;
        },
        DEFAULT_TIMEOUT.DATA,
        'Remove article operation timed out'
      );

      return true;
    } catch (error) {
      console.error('Error removing saved article:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to remove article');
    }
  }

  async isArticleSaved(userId: string, articleId: string): Promise<boolean> {
    try {
      const result = await withTimeout(
        async () => {
          const { data, error } = await supabase
            .from('saved_articles')
            .select('article_id')
            .eq('user_id', userId)
            .eq('article_id', articleId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {  // Record not found
              return false;
            }
            throw error;
          }

          return Boolean(data);
        },
        DEFAULT_TIMEOUT.DATA,
        'Check saved status operation timed out'
      );

      return result;
    } catch (error) {
      console.error('Error checking saved status:', error);
      return false;
    }
  }
}

export const preferencesService = new PreferencesService();
