import * as Linking from 'expo-linking';
import { createURL } from 'expo-linking';
import { Platform } from 'react-native';
import branch from 'react-native-branch';

class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private navigationRef: any;
  private branchUnsubscribe: Function | null = null;

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

    this.navigationRef.current.navigate('ArticleDetail', { articleId });
  }

  setupDeepLinkListeners(): void {
    // Handle deep links when the app is already open
    Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    // Handle deep links when the app is launched from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url);
      }
    });

    // Branch initialization and deep link handling
    if (__DEV__) {
      // Enable debug mode in development
      // @ts-ignore: Branch types may not be up to date
      branch.setDebug(true);
    }

    this.branchUnsubscribe = branch.subscribe(({ error, params, uri }) => {
      if (error) {
        console.error('Branch error:', error);
        return;
      }
      
      // Check if params exists and if it's a branch link
      if (params && params['+clicked_branch_link']) {
        // Extract article ID from Branch link params
        const articleId = params.articleId || params.article_id || null;
        
        if (articleId && this.navigationRef?.current) {
          console.log('Navigating to article via Branch deep link:', articleId);
          this.navigationRef.current.navigate('ArticleDetail', { articleId });
        }
      }
    });
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
      // Create a Branch Universal Object
      const branchUniversalObject = await branch.createBranchUniversalObject(`article/${articleId}`, {
        locallyIndex: true,
        title,
        contentDescription: description,
        contentImageUrl: imageUrl,
        contentMetadata: {
          customMetadata: {
            articleId: articleId
          }
        }
      });

      // Define link properties
      const linkProperties = {
        feature: 'share',
        channel: 'app',
        campaign: 'article_sharing'
      };

      // Define control parameters (extra data for the link)
      const controlParams = {
        $desktop_url: `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`,
        $android_url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman',
        $ios_url: 'https://apps.apple.com/app/apple-store/id{YOUR_APP_ID}',
        articleId: articleId
      };

      // Generate the link
      const { url } = await branchUniversalObject.generateShortUrl(linkProperties, controlParams);
      return url;
    } catch (error) {
      console.error('Error creating Branch link:', error);
      // Fallback to a direct store link if Branch fails
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
      const branchUniversalObject = await branch.createBranchUniversalObject(`article/${articleId}`, {
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
   * Track an article view with Branch analytics
   * @param articleId The ID of the viewed article 
   * @param source Source of the article view (e.g., 'share', 'notification', 'search')
   */
  trackArticleView(articleId: string, source: string = 'app'): void {
    try {
      // Log a custom event with Branch
      // @ts-ignore - logEvent is available but missing from type definitions
      branch.logEvent('View Article', {
        articleId,
        source,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging Branch event:', error);
    }
  }

  /**
   * Track an article share with Branch analytics
   * @param articleId The ID of the shared article
   * @param channel The sharing channel used (e.g., 'facebook', 'twitter', 'whatsapp')
   */
  trackArticleShare(articleId: string, channel: string = 'unknown'): void {
    try {
      // Log a content share event with Branch
      // @ts-ignore - logEvent is available but missing from type definitions
      branch.logEvent('Share Article', {
        articleId, 
        channel,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging Branch share event:', error);
    }
  }
}

export default DeepLinkHandler;
