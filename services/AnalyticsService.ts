import { getAnalytics, FirebaseAnalyticsTypes } from '@react-native-firebase/analytics';
import { ReactNativeFirebase } from '@react-native-firebase/app';
import {
  ANALYTICS_EVENTS,
  ArticleAnalyticsParams,
  AdAnalyticsParams,
  UserInteractionAnalyticsParams,
  ScreenViewAnalyticsParams,
  AnalyticsEventName,
  EventParams
} from '../src/types/analytics'; // Adjust path as needed

/**
 * AnalyticsService - Firebase Analytics integration service
 * 
 * Provides a comprehensive analytics tracking system for the React Native Expo application.
 * Handles article interactions, advertisement tracking, user behavior analytics, and screen
 * navigation tracking. Implements singleton pattern for consistent analytics instance management.
 * 
 * Key Features:
 * - Article engagement tracking (views, shares, bookmarks, reading time)
 * - Advertisement performance analytics (impressions, clicks, completions)
 * - User interaction monitoring (category selection, search actions, engagement)
 * - Screen navigation and user journey tracking
 * - User identification and property management
 * - Error handling and development logging
 * 
 * @class AnalyticsService
 * @example
 * ```typescript
 * const analytics = AnalyticsService.getInstance();
 * await analytics.initialize(firebaseApp);
 * 
 * // Track article view
 * await analytics.logArticleView({
 *   article_id: 'article-123',
 *   category: 'Education',
 *   author: 'John Doe',
 *   source: 'news-api'
 * });
 * 
 * // Track screen navigation
 * await analytics.logScreenView({
 *   screen_name: 'HomeScreen',
 *   screen_class: 'HomeScreen'
 * });
 * ```
 */
class AnalyticsService {
  private static instance: AnalyticsService;
  private firebaseApp: ReactNativeFirebase.FirebaseApp | null = null;
  private analyticsInstance: FirebaseAnalyticsTypes.Module | null = null;

  /**
   * Private constructor implementing singleton pattern
   * Firebase-specific initialization is deferred to the initialize method
   * to ensure proper app instance availability.
   * 
   * @private
   * @memberof AnalyticsService
   */
  private constructor() {
    // Private constructor. Firebase-specific initialization deferred to `initialize`.
    // DO NOT call methods that rely on this.analyticsInstance here.
  }

  /**
   * Gets the singleton instance of AnalyticsService
   * 
   * @returns {AnalyticsService} The singleton instance
   * @static
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * const analytics = AnalyticsService.getInstance();
   * ```
   */
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initializes the AnalyticsService with Firebase App instance
   * 
   * This method MUST be called before any other analytics methods.
   * Sets up the Firebase Analytics instance and enables analytics collection.
   * 
   * @param {ReactNativeFirebase.FirebaseApp} app - The Firebase App instance
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {Error} When Firebase App initialization fails
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * const firebaseApp = getApp();
   * await analytics.initialize(firebaseApp);
   * ```
   */
  async initialize(app: ReactNativeFirebase.FirebaseApp): Promise<void> {
    this.firebaseApp = app;
    this.analyticsInstance = getAnalytics(app); // Initialize analyticsInstance first
    
    // Now it's safe to call methods that use this.analyticsInstance
    await this.setAnalyticsCollectionEnabled(true); 

    if (__DEV__) {
      console.log('[AnalyticsService] Initialized with Firebase App.');
    }
  }

  /**
   * Helper method to ensure analytics instance is available
   * 
   * Validates that the analytics instance has been properly initialized
   * before attempting to use Firebase Analytics methods.
   * 
   * @private
   * @returns {FirebaseAnalyticsTypes.Module} The initialized analytics instance
   * @throws {Error} When AnalyticsService has not been initialized
   * @memberof AnalyticsService
   */
  private getAnalyticsInstance(): FirebaseAnalyticsTypes.Module {
    if (!this.analyticsInstance) {
      console.error('[Analytics] Error: AnalyticsService not initialized. Call initialize() first.');
      throw new Error('AnalyticsService not initialized.');
    }
    return this.analyticsInstance;
  }

  /**
   * Generic method to log any analytics event
   * 
   * Provides a centralized logging mechanism with validation and error handling.
   * Validates event name length (max 40 characters) and safely logs events
   * with optional parameters.
   * 
   * @param {AnalyticsEventName | string} name - The name of the event (max 40 characters)
   * @param {EventParams} [params] - Optional parameters for the event
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.logEvent('custom_event', { 
   *   category: 'user_action',
   *   value: 'button_click' 
   * });
   * ```
   */
  async logEvent(name: AnalyticsEventName | string, params?: EventParams): Promise<void> {
    try {
      if (!name || typeof name !== 'string' || name.length > 40) {
        if (__DEV__) { console.warn(`[Analytics] Invalid event name: ${name}`); }
        return;
      }
      
      await this.getAnalyticsInstance().logEvent(name, params);
      if (__DEV__) { console.log(`[Analytics] Event logged: ${name}`, params || ''); }
    } catch (error) {
      if (__DEV__) { console.error(`[Analytics] Error logging event "${name}":`, error); }
    }
  }

  // --- Specific Event Logging Methods ---

  /**
   * Logs article view event
   * 
   * Tracks when users view articles, including article metadata
   * for content performance analysis.
   * 
   * @param {ArticleAnalyticsParams} params - Article view parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.logArticleView({
   *   article_id: 'article-123',
   *   category: 'Education',
   *   author: 'John Doe',
   *   source: 'news-api'
   * });
   * ```
   */
  async logArticleView(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_VIEW, params);
  }

  /**
   * Logs article share event
   * 
   * Tracks when users share articles, helping measure content virality
   * and engagement levels.
   * 
   * @param {ArticleAnalyticsParams} params - Article share parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logArticleShare(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_SHARE, params);
  }

  /**
   * Logs article bookmark event
   * 
   * Tracks when users bookmark articles for later reading,
   * indicating high content value and user intent.
   * 
   * @param {ArticleAnalyticsParams} params - Article bookmark parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logArticleBookmark(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_BOOKMARK, params);
  }
  
  /**
   * Logs article reading time event
   * 
   * Tracks how long users spend reading articles, providing insights
   * into content engagement and reading patterns.
   * 
   * @param {ArticleAnalyticsParams} params - Article reading time parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logArticleReadTime(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_READ_TIME, params);
  }
  
  /**
   * Logs article scroll event
   * 
   * Tracks user scroll behavior within articles, measuring content
   * consumption depth and engagement quality.
   * 
   * @param {ArticleAnalyticsParams} params - Article scroll parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logArticleScroll(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_SCROLL, params);
  }

  /**
   * Logs advertisement impression event
   * 
   * Tracks when advertisements are displayed to users,
   * essential for ad performance measurement and revenue tracking.
   * 
   * @param {AdAnalyticsParams} params - Advertisement impression parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logAdImpression(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_IMPRESSION, params);
  }

  /**
   * Logs advertisement click event
   * 
   * Tracks when users click on advertisements, measuring ad effectiveness
   * and user engagement with promotional content.
   * 
   * @param {AdAnalyticsParams} params - Advertisement click parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logAdClick(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_CLICK, params);
  }
  
  /**
   * Logs advertisement view completion event
   * 
   * Tracks when users complete viewing an advertisement,
   * indicating successful ad delivery and engagement.
   * 
   * @param {AdAnalyticsParams} params - Advertisement view completion parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logAdViewComplete(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_VIEW_COMPLETE, params);
  }
  
  /**
   * Logs advertisement skip event
   * 
   * Tracks when users skip advertisements, providing insights
   * into ad relevance and user preferences.
   * 
   * @param {AdAnalyticsParams} params - Advertisement skip parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logAdSkip(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_SKIP, params);
  }
  
  /**
   * Logs advertisement close event
   * 
   * Tracks when users close advertisements, measuring ad completion
   * rates and user interaction patterns.
   * 
   * @param {AdAnalyticsParams} params - Advertisement close parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logAdClose(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_CLOSE, params);
  }

  /**
   * Logs category selection event
   * 
   * Tracks when users select content categories, providing insights
   * into user preferences and content discovery patterns.
   * 
   * @param {UserInteractionAnalyticsParams} params - Category selection parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logCategorySelect(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.CATEGORY_SELECT, params);
  }
  
  /**
   * Logs search action event
   * 
   * Tracks user search behavior, including search terms and results,
   * helping improve search functionality and content discovery.
   * 
   * @param {UserInteractionAnalyticsParams} params - Search action parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logSearchAction(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SEARCH_ACTION, params);
  }
  
  /**
   * Logs user engagement event
   * 
   * Tracks general user engagement activities, providing broad insights
   * into user behavior and app usage patterns.
   * 
   * @param {UserInteractionAnalyticsParams} params - User engagement parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   */
  async logUserEngagement(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.USER_ENGAGEMENT, params);
  }

  /**
   * Logs screen view event
   * 
   * Tracks user navigation between screens, providing insights into
   * user journey and app usage patterns. Uses Firebase's dedicated
   * screen view logging method.
   * 
   * @param {ScreenViewAnalyticsParams} params - Screen view parameters
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.logScreenView({
   *   screen_name: 'HomeScreen',
   *   screen_class: 'HomeScreen'
   * });
   * ```
   */
  async logScreenView(params: ScreenViewAnalyticsParams): Promise<void> {
    try {
      await this.getAnalyticsInstance().logScreenView(params);
      if (__DEV__) {
        console.log('[Analytics] Screen view logged:', params);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Analytics] Error logging screen view:', error);
      }
    }
  }

  /**
   * Logs user login event
   * 
   * Tracks user authentication events, including login method
   * for understanding user authentication preferences.
   * 
   * @param {string} method - Authentication method used (e.g., 'email', 'google', 'facebook')
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.logLogin('google');
   * ```
   */
  async logLogin(method: string): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.LOGIN, { method });
  }

  /**
   * Logs user sign-up event
   * 
   * Tracks new user registrations, including registration method
   * for measuring user acquisition effectiveness.
   * 
   * @param {string} method - Registration method used (e.g., 'email', 'google', 'facebook')
   * @returns {Promise<void>} Promise that resolves when event is logged
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.logSignUp('email');
   * ```
   */
  async logSignUp(method: string): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SIGN_UP, { method });
  }

  // --- User Properties and Settings ---

  /**
   * Sets the user ID for analytics tracking
   * 
   * Associates analytics events with a specific user identifier,
   * enabling user-level analytics and cross-session tracking.
   * 
   * @param {string | null} userId - The unique identifier for the user (null to clear)
   * @returns {Promise<void>} Promise that resolves when user ID is set
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.setUserId('user-123');
   * // Clear user ID
   * await analytics.setUserId(null);
   * ```
   */
  async setUserId(userId: string | null): Promise<void> {
    try { 
      await this.getAnalyticsInstance().setUserId(userId); 
      if (__DEV__) {
        console.log(`[Analytics] User ID set: ${userId}`);
      }
    } catch (error) { 
      if (__DEV__) {
        console.error('[Analytics] Error setting User ID:', error);
      }
    }
  }

  /**
   * Sets a user property for analytics
   * 
   * Defines custom user attributes for segmentation and analysis.
   * Property names are limited to 24 characters, values to 36 characters.
   * 
   * @param {string} name - The name of the user property (max 24 characters)
   * @param {string | null} value - The value of the user property (max 36 characters, null to clear)
   * @returns {Promise<void>} Promise that resolves when property is set
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.setUserProperty('user_type', 'premium');
   * await analytics.setUserProperty('preferred_category', 'education');
   * ```
   */
  async setUserProperty(name: string, value: string | null): Promise<void> {
    try { 
      if (!name || typeof name !== 'string' || name.length > 24) {
        if (__DEV__) {
          console.warn(`[Analytics] Invalid property name: ${name}`);
        }
        return;
      }
      if (value !== null && (typeof value !== 'string' || value.length > 36)) {
        if (__DEV__) {
          console.warn(`[Analytics] Invalid property value for ${name}: ${value}`);
        }
        return;
      }
      await this.getAnalyticsInstance().setUserProperty(name, value); 
      if (__DEV__) {
        console.log(`[Analytics] User property set: ${name}=${value}`);
      }
    } catch (error) { 
      if (__DEV__) {
        console.error(`[Analytics] Error setting user property "${name}":`, error);
      }
    }
  }

  /**
   * Sets multiple user properties at once
   * 
   * Convenient method for setting multiple user properties in a single call.
   * Validates each property individually and filters out invalid entries.
   * Uses Firebase's batch setUserProperties method for efficient processing.
   * 
   * @param {Object} properties - An object containing user property key-value pairs
   * @returns {Promise<void>} Promise that resolves when all valid properties are set
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * await analytics.setUserProperties({
   *   user_type: 'premium',
   *   preferred_category: 'education',
   *   notification_enabled: 'true'
   * });
   * ```
   */
  async setUserProperties(properties: { [key: string]: string | null }): Promise<void> {
    try { 
      const validProperties: { [key: string]: string | null } = {};
      for (const name in properties) {
        const value = properties[name];
         if (!name || typeof name !== 'string' || name.length > 24) {
           if (__DEV__) {
             console.warn(`[Analytics] Invalid property name: ${name}`);
           }
           continue;
         }
         if (value !== null && (typeof value !== 'string' || value.length > 36)) {
           if (__DEV__) {
             console.warn(`[Analytics] Invalid property value for ${name}: ${value}`);
           }
           continue;
         }
         validProperties[name] = value;
      }
      await this.getAnalyticsInstance().setUserProperties(validProperties); 
      if (__DEV__) {
        console.log('[Analytics] User properties set:', validProperties);
      }
    } catch (error) { 
      if (__DEV__) {
        console.error('[Analytics] Error setting User Properties:', error);
      }
    }
  }

  /**
   * Enables or disables analytics data collection
   * 
   * Controls whether Firebase Analytics collects data for this app instance.
   * Useful for implementing user privacy preferences and GDPR compliance.
   * Called automatically during initialization to enable collection.
   * 
   * @param {boolean} enabled - Boolean indicating whether collection should be enabled
   * @returns {Promise<void>} Promise that resolves when setting is applied
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * // Enable analytics collection
   * await analytics.setAnalyticsCollectionEnabled(true);
   * 
   * // Disable for privacy compliance
   * await analytics.setAnalyticsCollectionEnabled(false);
   * ```
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    // This method relies on analyticsInstance being set.
    // It's called from initialize() after analyticsInstance is set, or externally via getAnalyticsInstance().
    try { 
      await this.getAnalyticsInstance().setAnalyticsCollectionEnabled(enabled);
      if (__DEV__) {
        console.log(`[Analytics] Collection ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) { 
      if (__DEV__) {
        console.error('[Analytics] Error setting collection status:', error);
      }
    }
  }

  /**
   * Resets all analytics data for this instance
   * 
   * Clears all analytics data associated with the current app instance,
   * including user properties and cached events. Used primarily for testing,
   * user logout scenarios, or privacy compliance requests.
   * 
   * @returns {Promise<void>} Promise that resolves when data is reset
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * // Reset analytics data on user logout
   * await analytics.resetAnalyticsData();
   * ```
   */
  async resetAnalyticsData(): Promise<void> {
    try { 
      await this.getAnalyticsInstance().resetAnalyticsData(); 
      if (__DEV__) {
        console.log('[Analytics] Data reset');
      }
    } catch (error) { 
      if (__DEV__) {
        console.error('[Analytics] Error resetting data:', error);
      }
    }
  }
  
  /**
   * Gets the app instance ID for analytics
   * 
   * Retrieves the unique identifier for this app instance used by Firebase Analytics.
   * This ID is used to associate analytics data with the specific app installation.
   * Useful for debugging and cross-referencing analytics data.
   * 
   * @returns {Promise<string | null>} Promise that resolves to the app instance ID or null if unavailable
   * @memberof AnalyticsService
   * @example
   * ```typescript
   * const instanceId = await analytics.getAppInstanceId();
   * console.log('App Instance ID:', instanceId);
   * ```
   */
  async getAppInstanceId(): Promise<string | null> {
    try { 
      const id = await this.getAnalyticsInstance().getAppInstanceId(); 
      if (__DEV__) {
        console.log('[Analytics] App Instance ID:', id);
      }
      return id;
    } catch (error) { 
      if (__DEV__) {
        console.error('[Analytics] Error getting App Instance ID:', error);
      }
      return null;
    }
  }
}

/**
 * Singleton instance of AnalyticsService
 * 
 * Pre-configured analytics service instance ready for use throughout the application.
 * Must be initialized with Firebase App instance before use.
 * 
 * @constant {AnalyticsService} analyticsService - The singleton analytics service instance
 * @example
 * ```typescript
 * import { analyticsService } from './services/AnalyticsService';
 * 
 * // Initialize with Firebase app
 * await analyticsService.initialize(firebaseApp);
 * 
 * // Track events
 * await analyticsService.logArticleView({
 *   article_id: 'article-123',
 *   category: 'Education'
 * });
 * ```
 */
export const analyticsService = AnalyticsService.getInstance();
