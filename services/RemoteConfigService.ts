import { FirebaseRemoteConfigTypes, getRemoteConfig } from '@react-native-firebase/remote-config';
import type { ReactNativeFirebase } from '@react-native-firebase/app';
import { REMOTE_CONFIG_DEFAULTS, REMOTE_CONFIG_INTERVALS } from '../constants/remoteConfig';
import { logger } from '../utils/logger';

export type ArticleLayout = 'default' | 'compact';

export interface RemoteConfigParams {
  article_layout: ArticleLayout;
  show_related_articles: boolean;
  max_summary_length: number;
  show_source_icon: boolean;
  enable_sharing: boolean;
  categories_per_row: number;
}

class RemoteConfigService {
  private static instance: RemoteConfigService;
  private firebaseApp: ReactNativeFirebase.FirebaseApp | null = null;
  private remoteConfigInstance: FirebaseRemoteConfigTypes.Module | null = null;
  private defaults: RemoteConfigParams = REMOTE_CONFIG_DEFAULTS;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  /**
   * Initializes the RemoteConfigService with the Firebase App instance.
   * This MUST be called before fetching or getting config values.
   * @param app The FirebaseApp instance obtained from `@react-native-firebase/app`.
   */
  async initialize(app: ReactNativeFirebase.FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    this.remoteConfigInstance = getRemoteConfig(app);

    try {
      // Set default values and apply remote config settings
      await this.remoteConfigInstance.setDefaults(this.defaults as unknown as Record<string, string | number | boolean>);

      // Set up config settings
      const fetchInterval = __DEV__ 
        ? REMOTE_CONFIG_INTERVALS.DEV 
        : REMOTE_CONFIG_INTERVALS.PROD;

      await this.remoteConfigInstance.setConfigSettings({
        minimumFetchIntervalMillis: fetchInterval,
      });

      // Perform initial fetch and activate
      await this.fetchAndActivate();

      if (__DEV__) {
        logger.log('[RemoteConfigService] Initialized with Firebase App');
      }
    } catch (error) {
      logger.error('[RemoteConfigService] Error initializing:', error);
      throw error;
    }
  }

  async fetchAndActivate(): Promise<boolean> {
    if (!this.remoteConfigInstance) {
      logger.error('[RemoteConfigService] Error: RemoteConfigService not initialized. Call initialize() first.');
      return false;
    }
    // Add resilience: check network and perform retries with exponential backoff
    const maxAttempts = 3;
    let attempt = 0;
    const baseDelayMs = 500;

    // Simple network availability check using navigator if available (fallback to attempt anyway)
    const isNetworkAvailable = typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;
    if (!isNetworkAvailable) {
      logger.warn('[RemoteConfigService] Network appears offline; skipping remote fetch. Using defaults/cached values.');
      return false;
    }

    while (attempt < maxAttempts) {
      try {
        attempt += 1;
        const fetchedRemotely = await this.remoteConfigInstance.fetchAndActivate();
        if (__DEV__) {
          if (fetchedRemotely) {
            logger.log('[RemoteConfigService] Remote Configs fetched and activated from server');
          } else {
            logger.log('[RemoteConfigService] Remote Configs not fetched (using cached or default values)');
          }
        }
        return fetchedRemotely;
      } catch (error) {
        logger.warn(`[RemoteConfigService] fetchAndActivate attempt ${attempt} failed:`, error);
        if (attempt >= maxAttempts) {
          logger.error('[RemoteConfigService] All fetch attempts failed. Using defaults/cached values.');
          return false;
        }
        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    return false;
  }

  getValue<K extends keyof RemoteConfigParams>(key: K): RemoteConfigParams[K] {
    if (!this.remoteConfigInstance) {
      logger.error('[RemoteConfigService] Error: RemoteConfigService not initialized. Call initialize() first.');
      return this.defaults[key];
    }

    const configValue = this.remoteConfigInstance.getValue(key);

    switch (key) {
      case 'article_layout':
        return configValue.asString() as RemoteConfigParams[K];
      case 'show_related_articles':
      case 'show_source_icon':
      case 'enable_sharing':
        return configValue.asBoolean() as RemoteConfigParams[K];
      case 'max_summary_length':
      case 'categories_per_row':
        return configValue.asNumber() as RemoteConfigParams[K];
      default:
        throw new Error(`Unknown remote config key: ${key}`);
    }
  }

  getParams(): RemoteConfigParams {
    return {
      article_layout: this.getValue('article_layout'),
      show_related_articles: this.getValue('show_related_articles'),
      max_summary_length: this.getValue('max_summary_length'),
      show_source_icon: this.getValue('show_source_icon'),
      enable_sharing: this.getValue('enable_sharing'),
      categories_per_row: this.getValue('categories_per_row'),
    };
  }
}

export const remoteConfigService = RemoteConfigService.getInstance();
