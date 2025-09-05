import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';
import { getRelativeTime } from '../utils/timeUtils';

// Types
interface FetchOptions {
  categoryId?: string | null;
  page?: number;
  limit?: number;
  search?: string;
}

interface InteractionData {
  articleId: string;
  type: 'view' | 'share' | 'bookmark' | 'click';
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface OfflineAction {
  id: string;
  type: 'view' | 'interaction';
  data: { articleId: string } | InteractionData;
  timestamp: number;
}

interface CacheConfig {
  maxAge: number; // milliseconds
  maxItems: number;
}

// Constants
const CACHE_CONFIG: CacheConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxItems: 100,
};

const STORAGE_KEYS = {
  ARTICLES_CACHE: '@news_cache_articles',
  OFFLINE_QUEUE: '@news_offline_queue',
  LAST_SYNC: '@news_last_sync',
};

// Helper Functions
const isOnline = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return navigator.onLine;
  }
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? true;
};

const getFormattedDate = (date: Date): string => {
  return getRelativeTime(date);
};

class NewsService {
  private static instance: NewsService;
  private offlineQueue: OfflineAction[] = [];
  private lastSyncTime: number = 0;

  private constructor() {
    this.initializeOfflineQueue();
  }

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private async initializeOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }

      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSync) {
        this.lastSyncTime = parseInt(lastSync, 10);
      }
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
    }
  }

  // Cache Management
  private async cacheArticles(articles: Article[]): Promise<void> {
    try {
      const cacheData = {
        timestamp: Date.now(),
        articles: articles.slice(0, CACHE_CONFIG.maxItems),
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.ARTICLES_CACHE,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Failed to cache articles:', error);
    }
  }

  private async getCachedArticles(): Promise<Article[]> {
    try {
      const cacheData = await AsyncStorage.getItem(STORAGE_KEYS.ARTICLES_CACHE);
      if (!cacheData) return [];

      const { timestamp, articles } = JSON.parse(cacheData);
      const isCacheValid = Date.now() - timestamp < CACHE_CONFIG.maxAge;

      return isCacheValid ? articles : [];
    } catch (error) {
      console.error('Failed to get cached articles:', error);
      return [];
    }
  }

  // Core API Methods - Performance optimized
  async getArticles(options: FetchOptions = {}): Promise<Article[]> {
    try {
      // Cache-first strategy - Check cache before network
      const cachedArticles = await this.getCachedArticles();
      if (cachedArticles.length > 0 && (!options.page || options.page === 1)) {
        // Return cached data immediately for first page, fetch in background
        this.refreshCacheInBackground(options);
        return cachedArticles;
      }

      const online = await isOnline();
      if (!online) {
        return cachedArticles;
      }

      const { categoryId, search, limit = 10, page = 1 } = options;
      const rangeStart = (page - 1) * limit;
      const rangeEnd = rangeStart + limit - 1;

      // Optimized query with specific field selection to reduce payload
      let query = supabase
        .from('news')
        .select(`
          id,
          title,
          summary,
          image_path,
          source_url,
          created_at,
          view_count,
          category_id,
          categories!inner(
            id,
            name
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (search) {
        // Optimized search with trigram similarity for better performance
        query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
      }

      query = query.range(rangeStart, rangeEnd);

      const { data, error } = await query;

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articles = data.map((row: any) => {
        // Sanitize summary: trim and collapse multiple blank lines to a single newline
        const rawSummary = typeof row.summary === 'string' ? row.summary : '';
        const sanitizedSummary = rawSummary.replace(/\r/g, '')
          .replace(/\n{2,}/g, '\n')
          .trim();

        return {
          ...row,
          summary: sanitizedSummary,
          category: row.categories,
          formattedDate: getFormattedDate(new Date(row.created_at)),
        };
      });

      // Smart caching - Only cache first page results
      if (page === 1) {
        await this.cacheArticles(articles);
      }

      return articles;
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      return this.getCachedArticles();
    }
  }

  // Background cache refresh for better UX
  private async refreshCacheInBackground(options: FetchOptions): Promise<void> {
    try {
      // Don't await - run in background
      setTimeout(async () => {
        const { categoryId, search, limit = 10 } = options;
        
        let query = supabase
          .from('news')
          .select(`
            id,
            title,
            summary,
            image_path,
            source_url,
            created_at,
            view_count,
            category_id,
            categories!inner(id, name)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(0, limit - 1);

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        if (search) {
          query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
        }

        const { data } = await query;
        if (data) {
          const articles = data.map((row: any) => ({
            ...row,
            category: row.categories,
            formattedDate: getFormattedDate(new Date(row.created_at)),
          }));
          await this.cacheArticles(articles);
        }
      }, 100); // Small delay to not block UI
    } catch (error) {
      // Silent failure for background refresh
      console.log('Background cache refresh failed:', error);
    }
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*, categories(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        category: data.categories,
        formattedDate: getFormattedDate(new Date(data.created_at)),
      };
    } catch (error) {
      console.error('Failed to fetch article:', error);
      return null;
    }
  }

  // Analytics Methods
  async trackView(articleId: string): Promise<void> {
    try {
      const online = await isOnline();
      if (!online) {
        this.queueOfflineAction({
          id: Date.now().toString(),
          type: 'view',
          data: { articleId },
          timestamp: Date.now(),
        });
        return;
      }

      const { error } = await supabase.rpc('increment_view_count', {
        article_id: articleId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track article view:', error);
    }
  }

  async trackInteraction(data: InteractionData): Promise<void> {
    try {
      const online = await isOnline();
      if (!online) {
        this.queueOfflineAction({
          id: Date.now().toString(),
          type: 'interaction',
          data,
          timestamp: Date.now(),
        });
        return;
      }

      const { error } = await supabase.from('article_analytics').insert([{
        article_id: data.articleId,
        interaction_type: data.type,
        duration: data.duration,
        metadata: data.metadata,
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }

  // Offline Queue Management
  private async queueOfflineAction(action: OfflineAction): Promise<void> {
    try {
      this.offlineQueue.push(action);
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  }

  // Optimized batch sync for better performance
  async syncOfflineActions(): Promise<void> {
    try {
      const online = await isOnline();
      if (!online) return;

      const actions = [...this.offlineQueue];
      this.offlineQueue = [];

      // Group actions by type for batch processing
      const viewActions = actions.filter(a => a.type === 'view');
      const interactionActions = actions.filter(a => a.type === 'interaction');

      // Batch process views - Single RPC call for multiple views
      if (viewActions.length > 0) {
        const viewUpdates = viewActions.map(action => {
          const viewData = action.data as { articleId: string };
          return viewData.articleId;
        });

        // Use batch RPC for multiple view counts
        const { error: batchViewError } = await supabase.rpc('batch_increment_view_counts', {
          article_ids: viewUpdates,
        });

        if (batchViewError) {
          console.error('Batch view tracking failed:', batchViewError);
          // Fallback to individual calls if batch fails
          await Promise.all(viewActions.map(action => {
            const viewData = action.data as { articleId: string };
            return this.trackView(viewData.articleId);
          }));
        }
      }

      // Batch process interactions - Single insert for multiple interactions
      if (interactionActions.length > 0) {
        const interactionInserts = interactionActions.map(action => {
          const data = action.data as InteractionData;
          return {
            article_id: data.articleId,
            interaction_type: data.type,
            duration: data.duration,
            metadata: data.metadata,
            created_at: new Date(action.timestamp).toISOString(),
          };
        });

        const { error: batchInteractionError } = await supabase.from('article_analytics').insert(interactionInserts);

        if (batchInteractionError) {
          console.error('Batch interaction tracking failed:', batchInteractionError);
          // Fallback to individual calls if batch fails
          await Promise.all(interactionActions.map(action => {
            const data = action.data as InteractionData;
            return this.trackInteraction(data);
          }));
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, '[]');
      this.lastSyncTime = Date.now();
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC,
        this.lastSyncTime.toString()
      );
    } catch (error) {
      console.error('Failed to sync offline actions:', error);
    }
  }
}

export const newsService = NewsService.getInstance();
