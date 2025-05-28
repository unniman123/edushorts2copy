import * as Linking from 'expo-linking';
import { createURL } from 'expo-linking';
import { Platform, NativeModules } from 'react-native';

// Import Branch with a fallback default object in case import fails
let branch: any;
try {
  // Check if the native module is available
  const { RNBranch } = NativeModules;
  if (RNBranch) {
    branch = require('react-native-branch').default;
  } else {
    // This case should ideally not happen if the library is linked correctly
    console.error('RNBranch native module not found. Branch SDK will not function.');
    throw new Error('RNBranch native module not found');
  }
} catch (error) {
  console.error('Error importing Branch SDK:', error);
  // Create a fallback object that won't crash the app
  branch = {
    init: () => console.warn('Branch SDK not available - using fallback'),
    debug: () => {},
    subscribe: () => () => {}, // Returns a no-op unsubscribe function
    createBranchUniversalObject: async () => ({
      generateShortUrl: async () => ({ url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman' })
    }),
    userCompletedAction: () => {}
  };
}

// Create a safer version of the Branch SDK with fallbacks for all methods
const branchSDK = {
  init: typeof branch.init === 'function' ? branch.init.bind(branch) : () => console.warn('Branch init not available'),
  debug: typeof branch.debug === 'function' ? branch.debug.bind(branch) : () => {},
  subscribe: typeof branch.subscribe === 'function' ? branch.subscribe.bind(branch) : () => () => {},
  createBranchUniversalObject: typeof branch.createBranchUniversalObject === 'function' 
    ? branch.createBranchUniversalObject.bind(branch) 
    : async () => ({
        generateShortUrl: async () => ({ url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman' })
      }),
  userCompletedAction: typeof branch.userCompletedAction === 'function' 
    ? branch.userCompletedAction.bind(branch) 
    : () => {}
};

class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private navigationRef: any;
  private branchUnsubscribe: (() => void) | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): DeepLinkHandler {
    try {
      if (!DeepLinkHandler.instance) {
        DeepLinkHandler.instance = new DeepLinkHandler();
      }
      return DeepLinkHandler.instance;
    } catch (error) {
      console.error('Error getting DeepLinkHandler instance:', error);
      // Return a new instance if the singleton fails
      return new DeepLinkHandler();
    }
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
      console.warn('[DeepLinkHandler] Navigation ref not set when trying to navigate to article.');
      return;
    }

    if (typeof this.navigationRef.current.isReady === 'function' && !this.navigationRef.current.isReady()) {
      console.warn('[DeepLinkHandler] Navigation container not ready when trying to navigate to article. Queueing or logging.');
      return;
    }

    console.log(`[DeepLinkHandler] Attempting to navigate to SingleArticleViewer with ID: ${articleId}`);
    try {
      this.navigationRef.current.navigate('SingleArticleViewer', { articleId });
    } catch (e) {
      console.error('[DeepLinkHandler] Error during navigateToArticle:', e);
    }
  }

  setupDeepLinkListeners(): void {
    try {
      // Handle deep links when the app is already open
      Linking.addEventListener('url', ({ url }) => {
        if (url) {
          this.handleDeepLink(url);
        }
      });

      // Handle deep links when the app is launched from a deep link
      Linking.getInitialURL().then((url) => {
        if (url) {
          this.handleDeepLink(url);
        }
      }).catch(error => {
        console.error('Error getting initial URL:', error);
        this.logBranchError(error, 'getInitialURL');
      });

      // Branch initialization and deep link handling
      if (__DEV__) {
        // Enable debug mode in development for detailed logs
        if (typeof branchSDK.debug === 'function') {
          branchSDK.debug(true);
        }
      }

      // Safely subscribe to Branch events
      if (typeof branchSDK.subscribe !== 'function') {
        console.warn('Branch SDK subscribe method not found. Deep linking may not work correctly.');
        this.logBranchError(new Error('branchSDK.subscribe not a function'), 'subscribe_check');
        return;
      }

      // Check if we already have a subscription
      if (this.branchUnsubscribe) {
        // Clean up existing subscription before creating a new one
        this.branchUnsubscribe();
        this.branchUnsubscribe = null;
      }

      try {
        // Initialize Branch SDK with force_new_session flag
        if (typeof branchSDK.init === 'function') {
          branchSDK.init({ forceNewSession: true });
        }

        this.branchUnsubscribe = branchSDK.subscribe(({ error, params, uri }: { error?: any; params?: any; uri?: string }) => {
          if (error) {
            if (!error.toString().includes('Session initialization already happened')) {
              console.error('Branch error from subscribe:', error);
              this.logBranchError(error, 'subscribe_callback');
            }
            return;
          }
          
          if (params && params['+clicked_branch_link']) {
            const articleId = params.articleId || params.article_id || null;
            
            if (articleId) {
              if (this.navigationRef?.current && 
                  typeof this.navigationRef.current.isReady === 'function' && 
                  this.navigationRef.current.isReady() && 
                  typeof this.navigationRef.current.navigate === 'function') {
                console.log('[DeepLinkHandler] Navigating to SingleArticleViewer via Branch deep link:', articleId);
                try {
                  this.navigationRef.current.navigate('SingleArticleViewer', {
                    articleId,
                    branch: true 
                  });
                } catch (navError) {
                  console.error('[DeepLinkHandler] Error navigating from Branch subscribe:', navError);
                  if (this.navigationRef.current.getRootState) {
                    console.log('[DeepLinkHandler] Navigator state on error:', JSON.stringify(this.navigationRef.current.getRootState(), null, 2));
                  }
                }
              } else {
                console.warn('[DeepLinkHandler] Cannot navigate to article from Branch: Navigation reference not properly set or navigator not ready.');
                if (this.navigationRef?.current && typeof this.navigationRef.current.isReady === 'function' && !this.navigationRef.current.isReady()){
                    console.log('[DeepLinkHandler] Navigator was not ready.');
                } else if (!this.navigationRef?.current) {
                    console.log('[DeepLinkHandler] NavigationRef was not current.');
                } else {
                    console.log('[DeepLinkHandler] Navigate function was not available.');
                }
              }
            } else {
                console.warn('[DeepLinkHandler] articleId missing from Branch link params.');
            }
          }
        });
      } catch (subscribeError) {
        console.error('Error subscribing to Branch events:', subscribeError);
        this.logBranchError(subscribeError, 'subscribe_setup');
      }
    } catch (setupError) {
      console.error('Error setting up deep link listeners:', setupError);
      this.logBranchError(setupError, 'setupDeepLinkListeners_overall');
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
    if (typeof branch.getLatestReferringParams === 'function') {
      // If this function exists, Branch native module is likely available and initialized.
      // This doesn't guarantee session data is ready, but it's a good basic check.
      try {
        // A light check - this doesn't guarantee a session, but confirms SDK is responsive.
        await branch.getLatestReferringParams(); 
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
        // Check for a function that indicates Branch might be ready
        // Adjust this check based on a reliable indicator from the Branch SDK
        if (typeof branch.subscribe === 'function' && typeof branch.createBranchUniversalObject === 'function') {
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
