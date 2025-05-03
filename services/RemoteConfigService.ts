import remoteConfig from '@react-native-firebase/remote-config';
import { REMOTE_CONFIG_DEFAULTS, REMOTE_CONFIG_INTERVALS } from '../constants/remoteConfig';

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
  private defaults: RemoteConfigParams = REMOTE_CONFIG_DEFAULTS;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Set default values and apply remote config settings
      await remoteConfig().setDefaults(this.defaults as { [key: string]: any });

      // Set up config settings
      const fetchInterval = __DEV__ 
        ? REMOTE_CONFIG_INTERVALS.DEV 
        : REMOTE_CONFIG_INTERVALS.PROD;

      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: fetchInterval,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize remote config:', error);
      throw error;
    }
  }

  async fetchAndActivate(): Promise<boolean> {
    try {
      return await remoteConfig().fetchAndActivate();
    } catch (error) {
      console.error('Failed to fetch and activate remote config:', error);
      throw error;
    }
  }

  getValue<K extends keyof RemoteConfigParams>(key: K): RemoteConfigParams[K] {
    const configValue = remoteConfig().getValue(key);

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

export const remoteConfigService = new RemoteConfigService();
