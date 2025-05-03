import { RemoteConfigParams } from '../services/RemoteConfigService';

/**
 * Default values for Firebase Remote Config
 * These values are used when:
 * 1. The app hasn't yet connected to Firebase
 * 2. The user is offline
 * 3. The fetch hasn't completed yet
 */
export const REMOTE_CONFIG_DEFAULTS: RemoteConfigParams = {
  // Layout & Design
  article_layout: 'default', // 'default' or 'compact' - Controls article presentation style
  categories_per_row: 2, // Number of category buttons to show per row

  // Content Display
  max_summary_length: 280, // Maximum length of article summaries
  show_source_icon: true, // Whether to display publication source icons
  show_related_articles: true, // Whether to show related articles section
  enable_sharing: true, // Whether to enable article sharing functionality
};

// Remote Config fetch intervals (in milliseconds)
export const REMOTE_CONFIG_INTERVALS = {
  DEV: 0, // Fetch immediately in development
  PROD: 3600000, // 1 hour in production
};

// Remote Config parameter descriptions for documentation
export const REMOTE_CONFIG_DESCRIPTIONS = {
  article_layout: 'Controls the layout style of article cards and details. Use "default" for standard view or "compact" for a denser layout.',
  categories_per_row: 'Number of category buttons to display per row in the category selection grid.',
  max_summary_length: 'Maximum number of characters to display in article summaries before truncating.',
  show_source_icon: 'Whether to display source publication icons alongside articles.',
  show_related_articles: 'Whether to display the related articles section at the bottom of article details.',
  enable_sharing: 'Whether to enable the share button and sharing functionality for articles.',
} as const;

// Validate remote config values
export function validateRemoteConfig(config: RemoteConfigParams): boolean {
  try {
    // Validate article_layout
    if (!['default', 'compact'].includes(config.article_layout)) {
      console.error('Invalid article_layout value:', config.article_layout);
      return false;
    }

    // Validate numeric ranges
    if (config.categories_per_row < 1 || config.categories_per_row > 4) {
      console.error('Invalid categories_per_row value:', config.categories_per_row);
      return false;
    }

    if (config.max_summary_length < 100 || config.max_summary_length > 500) {
      console.error('Invalid max_summary_length value:', config.max_summary_length);
      return false;
    }

    // Validate boolean values
    if (typeof config.show_source_icon !== 'boolean' ||
        typeof config.show_related_articles !== 'boolean' ||
        typeof config.enable_sharing !== 'boolean') {
      console.error('Invalid boolean value in config');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating remote config:', error);
    return false;
  }
}
