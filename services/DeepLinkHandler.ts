import * as Linking from 'expo-linking';
import { createURL } from 'expo-linking';
import { Platform } from 'react-native';

class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private navigationRef: any;

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
