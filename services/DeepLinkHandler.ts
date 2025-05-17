import * as Linking from 'expo-linking';
import { createURL } from 'expo-linking';
import { Platform } from 'react-native';
import branch, { BranchParams, BranchSubscriptionEvent } from 'react-native-branch';

class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private navigationRef: any;
  private branchUnsubscribe: (() => void) | null = null; // To store the unsubscribe function

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

    this.navigationRef.current.navigate('ArticleDetail', { id: articleId });
  }

  setupDeepLinkListeners(): void {
    // Handle deep links when the app is already open (Expo Linking)
    Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLinkHandler] Expo Linking event received:', url);
      this.handleDeepLink(url);
    });

    // Handle deep links when the app is launched from a deep link (Expo Linking)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[DeepLinkHandler] Expo Linking initial URL:', url);
        this.handleDeepLink(url);
      }
    });

    // Subscribe to Branch deep link events
    // Store the unsubscribe function returned by branch.subscribe
    this.branchUnsubscribe = branch.subscribe(({ error, params, uri }: BranchSubscriptionEvent) => {
      if (error) {
        console.error('[DeepLinkHandler] Branch subscription error:', error);
        return;
      }

      if (params && params['+clicked_branch_link']) {
        console.log('[DeepLinkHandler] Branch link opened:', params);
        
        const articleId = params.articleId as string || params.id as string;
        const referringLink = params['~referring_link'] as string;

        if (articleId) {
          console.log(`[DeepLinkHandler] Branch link has articleId: ${articleId}`);
          this.navigateToArticle(articleId);
        } else if (uri) {
            console.log(`[DeepLinkHandler] Branch link URI provided: ${uri}, attempting to handle.`);
            this.handleDeepLink(uri);
        } else if (referringLink) {
            console.log(`[DeepLinkHandler] Branch referring_link: ${referringLink}, attempting to handle.`);
            this.handleDeepLink(referringLink);
        } else {
          console.log('[DeepLinkHandler] Branch link opened, but no actionable parameters (articleId, uri, or ~referring_link) found directly in params. Params:', params);
        }
      } else if (params && Object.keys(params).length > 0) {
        console.log('[DeepLinkHandler] Branch params received (not a direct link click or first session):', params);
        const articleIdFromPayload = params.articleId as string || params.id as string;
        if (articleIdFromPayload) {
            console.log(`[DeepLinkHandler] Found articleId in non-click Branch params: ${articleIdFromPayload}`);
            this.navigateToArticle(articleIdFromPayload);
        }
      }
    });
  }

  cleanupBranchListeners(): void {
    if (this.branchUnsubscribe) {
      this.branchUnsubscribe();
      this.branchUnsubscribe = null; // Clear after unsubscribing
      console.log('[DeepLinkHandler] Branch listeners unsubscribed.');
    } else {
      console.log('[DeepLinkHandler] No Branch unsubscribe function to call.');
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
}

export default DeepLinkHandler;
