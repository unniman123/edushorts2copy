import * as Linking from 'expo-linking';
import { createURL } from 'expo-linking';
import { Platform, NativeModules } from 'react-native';

// Import Branch with a fallback default object in case import fails
// Commenting out the module-scoped 'branch' variable and its initial assignment.
// let branch: any;
// try {
//   // Check if the native module is available
//   const { RNBranch } = NativeModules;
//   if (RNBranch) {
//     branch = require('react-native-branch').default;
//   } else {
//     // This case should ideally not happen if the library is linked correctly
//     console.error('RNBranch native module not found. Branch SDK will not function.');
//     throw new Error('RNBranch native module not found');
//   }
// } catch (error) {
//   console.error('Error importing Branch SDK:', error);
//   // Create a fallback object that won't crash the app
//   branch = {
//     init: () => console.warn('Branch SDK not available - using fallback'),
//     debug: () => {},
//     subscribe: () => () => {}, // Returns a no-op unsubscribe function
//     createBranchUniversalObject: async () => ({
//       generateShortUrl: async () => ({ url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman' })
//     }),
//     userCompletedAction: () => {}
//   };
// }

// Create a safer version of the Branch SDK with fallbacks for all methods.
// This version dynamically requires 'react-native-branch'.default at call time.
const branchSDK = {
  init: async (...args: any[]) => {
    const currentBranchModule = require('react-native-branch').default;
    if (currentBranchModule && typeof currentBranchModule.init === 'function') {
      console.log('[DeepLinkHandler/branchSDK] Found and calling branch.init()');
      return currentBranchModule.init(...args);
    }
    // If branch.init() is not found on the JS module,
    // we assume native initialization is primary for session start.
    // The critical part for JS for deep linking is often branch.subscribe().
    console.log('[DeepLinkHandler/branchSDK] branch.init() not found on JS module. Proceeding, assuming native init is primary. Subscription will be attempted.');
    return Promise.resolve(); // Allow flow to continue to subscribe
  },
  debug: async (...args: any[]) => {
    const currentBranchModule = require('react-native-branch').default;
    if (currentBranchModule && typeof currentBranchModule.debug === 'function') {
      return currentBranchModule.debug(...args);
    }
    // No warning for debug usually
    return Promise.resolve();
  },
  subscribe: (callback: (payload: { error: Error | null; params: BranchParams | null; uri: string | null }) => void) => {
    const currentBranchModule = require('react-native-branch').default;
    if (currentBranchModule && typeof currentBranchModule.subscribe === 'function') {
      return currentBranchModule.subscribe(callback);
    }
    console.warn('Branch subscribe not available [Component Stack] - (Direct require check)');
    return () => {}; // Return a no-op unsubscribe function
  },
  createBranchUniversalObject: async (...args: any[]) => {
    const currentBranchModule = require('react-native-branch').default;
    if (currentBranchModule && typeof currentBranchModule.createBranchUniversalObject === 'function') {
      return currentBranchModule.createBranchUniversalObject(...args);
    }
    console.warn('Branch createBranchUniversalObject not available [Component Stack] - (Direct require check)');
    // Return a fallback BUO that produces a fallback URL
    return {
      generateShortUrl: async () => ({ url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman' })
    };
  },
  userCompletedAction: (...args: any[]) => {
    const currentBranchModule = require('react-native-branch').default;
    if (currentBranchModule && typeof currentBranchModule.userCompletedAction === 'function') {
      return currentBranchModule.userCompletedAction(...args);
    }
    // If not immediately available, try again after a very short delay.
    console.warn('Branch userCompletedAction not immediately available (Direct require check). Attempting a delayed retry (100ms).');
    setTimeout(() => {
      const freshBranchModule = require('react-native-branch').default; // Re-require here too for the retry
      if (freshBranchModule && typeof freshBranchModule.userCompletedAction === 'function') {
        console.log('[DeepLinkHandler/branchSDK] userCompletedAction became available on retry (Direct require). Executing action.');
        freshBranchModule.userCompletedAction(...args);
      } else {
        console.warn('[DeepLinkHandler/branchSDK] userCompletedAction still not available after delayed retry (Direct require). The action may not have been tracked by Branch.');
      }
    }, 100);
  }
};

interface BranchParams {
  '+clicked_branch_link'?: boolean;
  articleId?: string;
  [key: string]: any;
}

interface BranchSubscribeParams {
  error: Error | null;
  params: BranchParams | null;
  uri: string | null;
}

class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private navigationRef: any;
  private branchUnsubscribe: (() => void) | null = null;
  private initialized: boolean = false;
  private maxInitAttempts: number = 3;
  private initAttempts: number = 0;
  private initDelay: number = 1000; // 1 second between retries

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  setNavigationRef(ref: any) {
    this.navigationRef = ref;
  }

  createDeepLink(path: string, params: Record<string, string> = {}): string {
    const prefix = Platform.select({
      ios: 'edushorts://',
      android: 'edushorts://',
      default: 'edushorts://'
    });

    return Linking.createURL(path, { queryParams: params });
  }

  async handleDeepLink(url: string): Promise<boolean> {
    try {
      const parsedUrl = Linking.parse(url);
      
      if (!parsedUrl.path) {
        return false;
      }

      const pathParts = parsedUrl.path.split('/');

      // Handle article deep links
      if (pathParts[0] === 'articles' && pathParts[1]) {
        const articleId = pathParts[1];
        this.navigateToArticle(articleId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  private navigateToArticle(articleId: string): void {
    if (!this.navigationRef?.current) {
      console.error('Navigation ref not set');
      return;
    }

    try {
      this.navigationRef.current.navigate('SingleArticleViewer', { 
        articleId,
        fromDeepLink: true 
      });
    } catch (error) {
      console.error('Error navigating to article:', error);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if Branch SDK is available
      if (Platform.OS !== 'web' && NativeModules.RNBranch) {
        await this.initializeBranchWithRetry();
      } else {
        console.log('Branch SDK not available on this platform or not properly linked');
      }

      // Set up URL handling for non-Branch deep links
      await this.setupURLHandling();
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing DeepLinkHandler:', error);
      throw error;
    }
  }

  private async initializeBranchWithRetry(): Promise<void> {
    while (this.initAttempts < this.maxInitAttempts) {
      try {
        this.initAttempts++;
        console.log(`Attempting Branch SDK initialization (Attempt ${this.initAttempts}/${this.maxInitAttempts})`);
        
        await branchSDK.init();
        if (__DEV__) {
          await branchSDK.debug(true);
        }
        
        this.branchUnsubscribe = branchSDK.subscribe(({ error, params, uri }: BranchSubscribeParams) => {
          if (error) {
            if (!error.toString().includes('Session initialization already happened')) {
                console.error('Branch deep link error from subscribe:', error);
                this.logBranchError(error, 'subscribe_callback_init_retry');
            }
            return;
          }

          if (params && params['+clicked_branch_link']) {
            const articleId = params.articleId || params.article_id || null;
            if (articleId) {
              console.log('[DeepLinkHandler/initializeBranchWithRetry] Branch link clicked, navigating to article:', articleId);
              this.navigateToArticle(articleId);
            } else if (uri) {
              console.log('[DeepLinkHandler/initializeBranchWithRetry] Branch link clicked with URI, attempting to handle:', uri);
              this.handleDeepLink(uri); 
            }
          } else if (uri && !params?.['+clicked_branch_link']) {
            console.log('[DeepLinkHandler/initializeBranchWithRetry] Received URI via Branch subscribe (not a clicked Branch link), attempting to handle:', uri);
            this.handleDeepLink(uri);
          }
        });

        console.log('Branch SDK initialized and subscribed successfully via initializeBranchWithRetry.');
        return; 
      } catch (error) {
        console.error(`Branch SDK initialization attempt ${this.initAttempts} failed:`, error);
        if (this.initAttempts < this.maxInitAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.initDelay));
        } else {
          throw new Error('Failed to initialize Branch SDK after multiple attempts');
        }
      }
    }
  }

  private async setupURLHandling(): Promise<void> {
    try {
      // Handle incoming links when app is not running
      const url = await Linking.getInitialURL();
      if (url) {
        this.handleDeepLink(url);
      }

      // Handle incoming links when app is running
      Linking.addEventListener('url', ({ url }) => {
        if (url) {
          this.handleDeepLink(url);
        }
      });
    } catch (error) {
      console.error('Error setting up URL handling:', error);
    }
  }

  setupDeepLinkListeners(): void {
    try {
      // Handle deep links when the app is already open (Expo Linking)
      Linking.addEventListener('url', ({ url }) => {
        if (url) {
          console.log('[DeepLinkHandler/setupDeepLinkListeners] Expo Linking event received:', url);
          this.handleDeepLink(url); // Assumes handleDeepLink can process non-Branch URLs too
        }
      });

      // Handle deep links when the app is launched from a deep link (Expo Linking)
      Linking.getInitialURL().then((url) => {
        if (url) {
          console.log('[DeepLinkHandler/setupDeepLinkListeners] Expo Linking initial URL:', url);
          this.handleDeepLink(url); // Assumes handleDeepLink can process non-Branch URLs too
        }
      }).catch(error => {
        console.error('Error getting initial URL (Expo Linking):', error);
        // this.logBranchError(error, 'getInitialURL_expo_linking'); // Decide if this specific logging is needed
      });

      // Branch initialization and deep link handling has been moved to initializeBranchWithRetry
      // The following Branch-specific code is removed from here to prevent duplicate initialization:
      // if (__DEV__) { ... branchSDK.debug(true); ... }
      // if (typeof branchSDK.subscribe !== 'function') { ... }
      // if (this.branchUnsubscribe) { ... this.branchUnsubscribe(); ... }
      // try { branchSDK.init({ forceNewSession: true }); ... this.branchUnsubscribe = branchSDK.subscribe(...); ... } catch { ... }

      console.log('[DeepLinkHandler/setupDeepLinkListeners] Generic Expo Linking listeners are set up. Branch listeners are handled via initialize().');

    } catch (setupError) {
      console.error('Error setting up generic deep link listeners:', setupError);
      // this.logBranchError(setupError, 'setupDeepLinkListeners_expo_linking_overall');
    }
  }

  cleanupBranchListeners(): void {
    // Clean up Branch listener when component unmounts
    if (this.branchUnsubscribe) {
      this.branchUnsubscribe();
      this.branchUnsubscribe = null;
    }
  }

  async verifyDeepLinkConfiguration(): Promise<boolean> {
    try {
      const supportedSchemes = await Linking.getInitialURL();
      return !!supportedSchemes;
    } catch (error) {
      console.error('Error verifying deep link configuration:', error);
      this.logBranchError(error, 'verifyDeepLinkConfiguration');
      return false;
    }
  }

  parseArticleId(deepLink: string): string | null {
    try {
      const parsedUrl = Linking.parse(deepLink);
      const pathParts = parsedUrl.path?.split('/');

      if (pathParts?.[0] === 'articles' && pathParts[1]) {
        return pathParts[1];
      }

      return null;
    } catch (error) {
      console.error('Error parsing article ID from deep link:', error);
      return null;
    }
  }

  /**
   * Creates a Branch.io deep link for sharing an article
   * @param articleId The ID of the article to share
   * @param title The title of the article
   * @param description Optional description or summary of the article
   * @param imageUrl Optional image URL for the article
   * @returns A promise that resolves to the generated Branch link
   */
  async createBranchLink(
    articleId: string, 
    title: string, 
    description?: string,
    imageUrl?: string
  ): Promise<string> {
    try {
      // Generate a truly unique identifier using UUID v4
      const uniqueId = `article-${articleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create Branch Universal Object with unique ID
      const branchUniversalObject = await branchSDK.createBranchUniversalObject(uniqueId, {
        locallyIndex: true,
        title,
        contentDescription: description,
        contentImageUrl: imageUrl,
        contentMetadata: {
          customMetadata: {
            articleId: articleId.toString(),
            timestamp: Date.now().toString()
          }
        }
      });

      // Define link properties
      const linkProperties = {
        feature: 'share',
        channel: 'app',
        campaign: 'article-sharing',
      };

      // Define control parameters with fallback URLs
      const controlParams = {
        $desktop_url: `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`,
        $android_url: 'market://details?id=com.ajilkojilgokulravi.unniman',
        $ios_url: 'https://apps.apple.com/app/id123456789', // Replace with actual App Store ID
        $fallback_url: `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`,
        data: {
          articleId: articleId.toString()
        }
      };

      // Generate short URL with retries
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const { url } = await branchUniversalObject.generateShortUrl(linkProperties, controlParams);
          console.log('Successfully created Branch link:', url);
          return url;
        } catch (generateError) {
          attempts++;
          if (attempts === maxAttempts) {
            throw generateError;
          }
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Generate a new unique ID for retry
          const retryId = `article-${articleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-retry${attempts}`;
          await branchUniversalObject.setCanonicalIdentifier(retryId);
        }
      }

      throw new Error('Failed to generate Branch link after multiple attempts');
    } catch (error) {
      console.error('Error creating Branch link:', error);
      return `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`;
    }
  }

  /**
   * Creates a Branch.io deep link specifically for notifications
   * @param articleId The ID of the article to link to
   * @param title The notification title
   * @param notificationId Optional notification ID for tracking
   * @returns A promise that resolves to the generated Branch link
   */
  async createNotificationDeepLink(
    articleId: string,
    title: string,
    notificationId?: string
  ): Promise<string> {
    try {
      // Create a Branch Universal Object
      const branchUniversalObject = await branchSDK.createBranchUniversalObject(`article/${articleId}`, {
        locallyIndex: true,
        title,
        contentMetadata: {
          customMetadata: {
            articleId,
            source: 'notification',
            ...(notificationId ? { notificationId } : {})
          }
        }
      });

      // Define link properties specific to notifications
      const linkProperties = {
        feature: 'notification',
        channel: 'push',
        campaign: 'article_notification'
      };

      // Define control parameters
      const controlParams = {
        $desktop_url: `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`,
        articleId,
        source: 'notification'
      };

      // Generate the link
      const { url } = await branchUniversalObject.generateShortUrl(linkProperties, controlParams);
      return url;
    } catch (error) {
      console.error('Error creating notification Branch link:', error);
      // Fallback to a direct deep link
      return `edushorts://articles/${articleId}`;
    }
  }

  /**
   * Track an article share with Branch analytics
   * @param articleId The ID of the shared article
   * @param channel The sharing channel used (e.g., 'facebook', 'twitter', 'whatsapp')
   */
  trackArticleShare(articleId: string, channel: string = 'unknown'): void {
    try {
      if (typeof branchSDK.userCompletedAction === 'function') {
        branchSDK.userCompletedAction('share_article_custom', {
          articleId,
          channel,
        });
      } else {
        console.warn('branchSDK.userCompletedAction is not a function, cannot track article share.');
        this.logBranchError(new Error('branchSDK.userCompletedAction not a function'), 'trackArticleShare');
      }
    } catch (error) {
      console.error('Error tracking article share event:', error);
      this.logBranchError(error, 'trackArticleShare');
    }
  }

  /**
   * Track an article view with Branch analytics
   * @param articleId The ID of the viewed article
   * @param source Source of the article view (e.g., 'share', 'notification', 'search')
   */
  trackArticleView(articleId: string, source: string = 'app'): void {
    try {
      if (typeof branchSDK.userCompletedAction === 'function') {
        branchSDK.userCompletedAction('view_article_custom', {
          articleId,
          source,
        });
      } else {
        console.warn('branchSDK.userCompletedAction is not a function, cannot track article view.');
        this.logBranchError(new Error('branchSDK.userCompletedAction not a function'), 'trackArticleView');
      }
    } catch (error) {
      console.error('Error tracking article view event:', error);
      this.logBranchError(error, 'trackArticleView');
    }
  }

  // Utility method for logging Branch related errors
  private logBranchError(error: any, context: string): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Branch SDK Error | Context: ${context} | Message: ${message}`, error);
    
    // Placeholder for a more sophisticated error reporting service
    // e.g., Sentry.captureException(error, { tags: { branchContext: context } });
    const errorMonitor = (global as any).ErrorMonitor;
    if (typeof errorMonitor?.captureException === 'function') {
      try {
        errorMonitor.captureException(error, {
          tags: {
            context: 'branch_sdk',
            operation: context
          }
        });
      } catch (monitoringError) {
        console.error('Failed to send error to monitoring service:', monitoringError);
      }
    }
  }

  // Utility method to check if Branch SDK seems initialized (optional usage)
  private async waitForBranchInitialization(timeoutMs = 5000): Promise<boolean> {
    const localBranchInstance = require('react-native-branch').default; // Use a local require

    if (localBranchInstance && typeof localBranchInstance.getLatestReferringParams === 'function') {
      // If this function exists, Branch native module is likely available and initialized.
      // This doesn't guarantee session data is ready, but it's a good basic check.
      try {
        // A light check - this doesn't guarantee a session, but confirms SDK is responsive.
        await localBranchInstance.getLatestReferringParams(); 
        return true;
      } catch (e) {
        // Could be an error if called too early, or SDK not ready.
        this.logBranchError(e, 'waitForBranchInitialization_getLatestReferringParams');
      }
    }

    // Fallback to polling if the above check isn't sufficient or fails
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const currentBranchModule = require('react-native-branch').default; // Re-require for fresh check
        // Check for a function that indicates Branch might be ready
        // Adjust this check based on a reliable indicator from the Branch SDK
        if (currentBranchModule && typeof currentBranchModule.subscribe === 'function' && typeof currentBranchModule.createBranchUniversalObject === 'function') {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          this.logBranchError(new Error('Timeout waiting for Branch SDK initialization'), 'waitForBranchInitialization_timeout');
          resolve(false);
        }
      }, 200);
    });
  }
}

export default DeepLinkHandler;
