import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { preferencesService } from '../lib/preferences';
import { UserPreferences, SavedArticle } from '../types/accessibility';
import { supabase, isTimeoutError } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { withTimeout, withRetry, DEFAULT_TIMEOUT, TimeoutError } from '../lib/timeoutUtils';
import { toast } from 'sonner-native';

interface PreferencesContextType {
  preferences: UserPreferences | null;
  savedArticles: SavedArticle[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  saveArticle: (articleId: string) => Promise<void>;
  unsaveArticle: (articleId: string) => Promise<void>;
  isArticleSaved: (articleId: string) => Promise<boolean>;
  savedCount: number;
  refreshSavedArticles: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const { user, isAuthReady } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  };

  const loadPreferences = useCallback(async () => {
    try {
      clearError();
      const userId = await getCurrentUserId();
      
      const prefs = await withRetry(
        () => preferencesService.getUserPreferences(userId),
        {
          timeoutMs: DEFAULT_TIMEOUT.DATA,
          maxAttempts: 3,
          retryableError: (error) => error instanceof TimeoutError
        }
      );

      if (prefs) {
        setPreferences(prefs);
      } else {
        // Create default preferences if they don't exist
        const defaultPrefs = {
          notifications_enabled: true,
          dark_mode_enabled: false
        };
        await updatePreferences(defaultPrefs);
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading preferences';
      console.error('Error loading preferences:', message);
      setError(message);
      toast.error('Failed to load preferences');
      return false;
    }
  }, [clearError]);

  const loadSavedArticles = useCallback(async () => {
    try {
      clearError();
      const userId = await getCurrentUserId();
      
      const saved = await withRetry(
        () => preferencesService.getSavedArticles(userId),
        {
          timeoutMs: DEFAULT_TIMEOUT.DATA,
          maxAttempts: 2,
          retryableError: (error) => error instanceof TimeoutError
        }
      );
      
      setSavedArticles(saved);
      setSavedCount(saved.length);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading saved articles';
      console.error('Error loading saved articles:', message);
      setError(message);
      toast.error('Failed to load saved articles');
      return false;
    }
  }, [clearError]);

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    try {
      clearError();
      setLoading(true);
      const userId = await getCurrentUserId();
      
      const updatedPrefs = await withTimeout(
        () => preferencesService.updateUserPreferences(userId, newPrefs),
        DEFAULT_TIMEOUT.DATA,
        'Preference update timed out'
      );

      if (updatedPrefs) {
        setPreferences(updatedPrefs);
        toast.success('Preferences updated successfully');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating preferences';
      console.error('Error updating preferences:', message);
      setError(message);
      toast.error('Failed to update preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveArticle = async (articleId: string) => {
    try {
      clearError();
      const userId = await getCurrentUserId();
      
      await withTimeout(
        () => preferencesService.saveArticle(userId, articleId),
        DEFAULT_TIMEOUT.DATA,
        'Save article operation timed out'
      );

      await loadSavedArticles();
      toast.success('Article saved successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving article';
      console.error('Error saving article:', message);
      setError(message);
      toast.error('Failed to save article');
      throw err;
    }
  };

  const unsaveArticle = async (articleId: string) => {
    try {
      clearError();
      const userId = await getCurrentUserId();
      
      await withTimeout(
        () => preferencesService.unsaveArticle(userId, articleId),
        DEFAULT_TIMEOUT.DATA,
        'Remove article operation timed out'
      );

      await loadSavedArticles();
      toast.success('Article removed from saved items');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error removing article';
      console.error('Error removing saved article:', message);
      setError(message);
      toast.error('Failed to remove article');
      throw err;
    }
  };

  const isArticleSaved = async (articleId: string): Promise<boolean> => {
    try {
      const userId = await getCurrentUserId();
      return await withTimeout(
        () => preferencesService.isArticleSaved(userId, articleId),
        DEFAULT_TIMEOUT.DATA,
        'Check saved status timed out'
      );
    } catch (err) {
      console.error('Error checking saved status:', err);
      return false;
    }
  };

  const refreshSavedArticles = useCallback(async () => {
    setLoading(true);
    try {
      await loadSavedArticles();
    } finally {
      setLoading(false);
    }
  }, [loadSavedArticles]);

  // Main data loading effect
  const loadData = useCallback(async () => {
    if (!isAuthReady || !user) {
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    if (!hasLoaded) {
      setLoading(true);
    }
    clearError();

    try {
      await withTimeout(
        async () => {
          await Promise.all([
            loadPreferences(),
            loadSavedArticles()
          ]);
        },
        DEFAULT_TIMEOUT.DATA,
        'Data loading timed out'
      );
      
      setHasLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading data';
      console.error('Data loading error:', message);
      setError(message);
      toast.error('Failed to load user data');
      setHasLoaded(true); // Set hasLoaded even on error to break loading state
    } finally {
      setLoading(false);
    }
  }, [isAuthReady, user, loadPreferences, loadSavedArticles, clearError, hasLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user || process.env.EXPO_PUBLIC_USE_MOCK_SAVES === 'true') return;

    const savedArticlesSubscription = supabase
      .channel('preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_articles',
          filter: `user_id=eq.${user.id}`
        },
        refreshSavedArticles
      )
      .subscribe();

    return () => {
      supabase.removeChannel(savedArticlesSubscription);
    };
  }, [user, refreshSavedArticles]);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        savedArticles,
        loading,
        error,
        hasLoaded,
        updatePreferences,
        saveArticle,
        unsaveArticle,
        isArticleSaved,
        savedCount,
        refreshSavedArticles,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
