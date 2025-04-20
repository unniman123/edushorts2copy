import Branch, { BranchEvent, BranchParams } from 'react-native-branch';

export interface BranchShareData {
  title: string;
  description: string;
  newsId: string;
  category?: string;
}

class BranchHelper {
  private static instance: BranchHelper;

  private constructor() {}

  public static getInstance(): BranchHelper {
    if (!BranchHelper.instance) {
      BranchHelper.instance = new BranchHelper();
    }
    return BranchHelper.instance;
  }

  public async createShareLink(data: BranchShareData): Promise<string | null> {
    try {
      // Create Branch Universal Object
      const branchUniversalObject = await Branch.createBranchUniversalObject(
        `news_${data.newsId}`,
        {
          title: data.title,
          contentDescription: data.description,
          contentMetadata: {
            customMetadata: {
              news_id: data.newsId,
              category: data.category || 'general'
            }
          }
        }
      );

      // Define link properties
      const linkProperties = {
        feature: 'news_sharing',
        channel: 'app',
        campaign: 'news_share'
      };

      // Define control parameters
      const controlParams = {
        $desktop_url: `https://lh1wg.app.link/news/${data.newsId}`,
        $android_url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman'
      };

      // Generate the link
      const { url } = await branchUniversalObject.generateShortUrl(linkProperties, controlParams);
      return url;
    } catch (error) {
      console.error('Error creating Branch link:', error);
      return null;
    }
  }

  public async shareNews(data: BranchShareData): Promise<boolean> {
    try {
      // Create Branch Universal Object
      const branchUniversalObject = await Branch.createBranchUniversalObject(
        `news_${data.newsId}`,
        {
          title: data.title,
          contentDescription: data.description,
          contentMetadata: {
            customMetadata: {
              news_id: data.newsId,
              category: data.category || 'general'
            }
          }
        }
      );

      // Define link properties
      const linkProperties = {
        feature: 'share',
        channel: 'app'
      };

      // Share options
      const shareOptions = {
        messageHeader: 'Check out this news!',
        messageBody: `${data.title} - Read more on EduShorts app`
      };

      // Show share sheet
      await branchUniversalObject.showShareSheet(shareOptions, linkProperties);
      return true;
    } catch (error) {
      console.error('Error sharing with Branch:', error);
      return false;
    }
  }

  public async logNewsView(newsId: string, title: string): Promise<void> {
    try {
      const branchUniversalObject = await Branch.createBranchUniversalObject(
        `news_${newsId}`,
        {
          title: title,
          contentMetadata: {
            customMetadata: {
              news_id: newsId
            }
          }
        }
      );

      // Use the imported BranchEvent directly
      await new BranchEvent(BranchEvent.ViewItem, branchUniversalObject).logEvent();
    } catch (error) {
      console.error('Error logging news view:', error);
    }
  }

  public async handleBranchDeepLink(uri: string | null): Promise<{newsId?: string; category?: string} | null> {
    try {
      if (!uri) return null;

      // Subscribe to Branch links and type the params
      const branchData = await new Promise<BranchParams | null>((resolve) => {
        Branch.subscribe(({ error, params }) => {
          if (error) {
            console.error('Error from Branch:', error);
            resolve(null);
            return;
          }
          // Ensure params is not undefined before resolving
          resolve(params || null);
        });
      });

      if (!branchData) return null;

      // Extract news ID and category from Branch data using defined types
      const newsId = (branchData['+canonical_identifier'] as string)?.replace('news_', '') ||
                    (branchData['news_id'] as string);
      const category = branchData['category'] as string;

      return { newsId, category };
    } catch (error) {
      console.error('Error handling Branch deep link:', error);
      return null;
    }
  }
}

export default BranchHelper.getInstance();
