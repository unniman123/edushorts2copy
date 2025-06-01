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

class AnalyticsService {
  private static instance: AnalyticsService;
  private firebaseApp: ReactNativeFirebase.FirebaseApp | null = null;
  private analyticsInstance: FirebaseAnalyticsTypes.Module | null = null;

  private constructor() {
    // Private constructor. Firebase-specific initialization deferred to `initialize`.
    // DO NOT call methods that rely on this.analyticsInstance here.
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initializes the AnalyticsService with the Firebase App instance.
   * This MUST be called before any other analytics methods.
   * @param app The FirebaseApp instance.
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

  // Helper to ensure analytics instance is available
  private getAnalyticsInstance(): FirebaseAnalyticsTypes.Module {
    if (!this.analyticsInstance) {
      console.error('[Analytics] Error: AnalyticsService not initialized. Call initialize() first.');
      throw new Error('AnalyticsService not initialized.');
    }
    return this.analyticsInstance;
  }

  /**
   * Generic method to log any analytics event.
   * @param name - The name of the event.
   * @param params - Optional parameters for the event.
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

  // Article Analytics
  async logArticleView(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_VIEW, params);
  }

  async logArticleShare(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_SHARE, params);
  }

  async logArticleBookmark(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_BOOKMARK, params);
  }
  
  async logArticleReadTime(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_READ_TIME, params);
  }
  
  async logArticleScroll(params: ArticleAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.ARTICLE_SCROLL, params);
  }

  // Advertisement Analytics
  async logAdImpression(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_IMPRESSION, params);
  }

  async logAdClick(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_CLICK, params);
  }
  
  async logAdViewComplete(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_VIEW_COMPLETE, params);
  }
  
  async logAdSkip(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_SKIP, params);
  }
  
  async logAdClose(params: AdAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.AD_CLOSE, params);
  }

  // User Interaction Analytics
  async logCategorySelect(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.CATEGORY_SELECT, params);
  }
  
  async logSearchAction(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SEARCH_ACTION, params);
  }
  
  async logUserEngagement(params: UserInteractionAnalyticsParams): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.USER_ENGAGEMENT, params);
  }

  // Screen/Navigation Analytics
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

  // Authentication Events
  async logLogin(method: string): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.LOGIN, { method });
  }

  async logSignUp(method: string): Promise<void> {
    await this.logEvent(ANALYTICS_EVENTS.SIGN_UP, { method });
  }

  // --- User Properties and Settings ---

  /**
   * Sets the user ID for analytics tracking.
   * @param userId - The unique identifier for the user.
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
   * Sets a user property for analytics.
   * @param name - The name of the user property.
   * @param value - The value of the user property.
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
   * Sets multiple user properties at once.
   * @param properties - An object containing user property key-value pairs.
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
   * Enables or disables analytics data collection.
   * @param enabled - Boolean indicating whether collection should be enabled.
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
   * Resets all analytics data for this instance. Used primarily for testing or user logout.
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
   * Gets the app instance ID. Useful for debugging.
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

// Export a singleton instance
export const analyticsService = AnalyticsService.getInstance();
