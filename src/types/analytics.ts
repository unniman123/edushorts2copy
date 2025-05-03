import { FirebaseAnalyticsTypes } from '@react-native-firebase/analytics';

// Generic type for event parameters
export type EventParams = {
  [key: string]: any;
};

// Base interface for any analytics event
export interface AnalyticsEvent {
  name: string;
  params?: EventParams;
}

// Specific interface for article-related analytics
export interface ArticleAnalyticsParams extends EventParams {
  article_id: string;
  category?: string;
  author?: string;
  reading_time?: number; // Time in seconds
  source?: string;
  scroll_depth?: number; // Percentage scrolled (0-100)
  interaction_type?: 'share' | 'bookmark';
  platform?: string; // For share events
}

// Specific interface for advertisement-related analytics
export interface AdAnalyticsParams extends EventParams {
  ad_id: string;
  position?: string;
  type?: string;
  campaign_id?: string;
  placement_location?: string;
  view_duration?: number; // Time in seconds
  interaction_type?: 'impression' | 'click' | 'skip' | 'close' | 'view_complete';
}

// Specific interface for general user interaction analytics
export interface UserInteractionAnalyticsParams extends EventParams {
  interaction_type: 'category_select' | 'search' | 'engagement';
  category?: string; // For category_select
  search_term?: string; // For search
  engagement_metric?: string; // For general engagement
  content_id?: string;
  content_type?: 'article' | 'advertisement';
}

// Interface for screen view analytics
export interface ScreenViewAnalyticsParams extends EventParams {
  screen_name: string;
  screen_class: string;
}

// Define standard event names as constants for consistency
export const ANALYTICS_EVENTS = {
  // Article Events
  ARTICLE_VIEW: 'article_view',
  ARTICLE_SHARE: 'article_share',
  ARTICLE_BOOKMARK: 'article_bookmark',
  ARTICLE_READ_TIME: 'article_read_time', // Custom event for read duration
  ARTICLE_SCROLL: 'article_scroll', // Custom event for scroll depth

  // Advertisement Events
  AD_IMPRESSION: 'ad_impression',
  AD_CLICK: 'ad_click',
  AD_VIEW_COMPLETE: 'ad_view_complete', // Custom event for view duration
  AD_SKIP: 'ad_skip',
  AD_CLOSE: 'ad_close', // Separate event for close

  // User Interaction Events
  CATEGORY_SELECT: 'category_select',
  SEARCH_ACTION: 'search_action',
  USER_ENGAGEMENT: 'user_engagement', // Generic engagement event

  // Screen/Navigation Events
  SCREEN_VIEW: 'screen_view', // Standard Firebase event

  // Other Custom Events
  APP_OPEN: 'app_open', // Standard Firebase event
  LOGIN: 'login', // Standard Firebase event
  SIGN_UP: 'sign_up', // Standard Firebase event
} as const; // Use 'as const' for strict typing of values

// Type helper for event names
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
