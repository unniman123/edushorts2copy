import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../utils/supabase';
import { Article } from '../types/supabase';

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
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
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

  // Core API Methods
  async getArticles(options: FetchOptions = {}): Promise<Article[]> {
    try {
      const online = await isOnline();
      if (!online) {
        return this.getCachedArticles();
      }

      const { categoryId, search, limit = 10, page = 1 } = options;
      const rangeStart = (page - 1) * limit;
      const rangeEnd = rangeStart + limit - 1;

      let query = supabase
        .from('news')
        .select('*, categories(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      query = query.range(rangeStart, rangeEnd);

      const { data, error } = await query;

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articles = data.map((row: any) => ({
        ...row,
        category: row.categories,
        formattedDate: getFormattedDate(new Date(row.created_at)),
      }));

      // Cache the fetched articles
      await this.cacheArticles(articles);

      return articles;
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      return this.getCachedArticles();
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

  async syncOfflineActions(): Promise<void> {
    try {
      const online = await isOnline();
      if (!online) return;

      const actions = [...this.offlineQueue];
      this.offlineQueue = [];

      await Promise.all(
        actions.map(async (action) => {
          if (action.type === 'view') {
            const viewData = action.data as { articleId: string };
            await this.trackView(viewData.articleId);
          } else if (action.type === 'interaction') {
            const interactionData = action.data as InteractionData;
            await this.trackInteraction(interactionData);
          }
        })
      );

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
