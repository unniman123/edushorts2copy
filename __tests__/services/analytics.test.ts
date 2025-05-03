import { analyticsService } from '../../services/AnalyticsService';
import analytics from '@react-native-firebase/analytics';
import { ArticleAnalyticsParams } from '../../src/types/analytics';

jest.mock('@react-native-firebase/analytics', () => {
  return jest.fn(() => ({
    logEvent: jest.fn(),
    setUserProperty: jest.fn(),
    setUserId: jest.fn(),
    setAnalyticsCollectionEnabled: jest.fn(),
    resetAnalyticsData: jest.fn(),
  }));
});

describe('AnalyticsService', () => {
  const mockFirebaseAnalytics = analytics();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Article Analytics', () => {
    const mockArticleParams: ArticleAnalyticsParams = {
      article_id: '123',
      category: 'Technology',
      author: 'John Doe',
      source: 'TechNews',
      reading_time: 120,
      scroll_depth: 80
    };

    it('should log article view events', async () => {
      await analyticsService.logArticleView(mockArticleParams);
      
      expect(mockFirebaseAnalytics.logEvent).toHaveBeenCalledWith(
        'article_view',
        mockArticleParams
      );
    });

    it('should log article scroll events', async () => {
      await analyticsService.logArticleScroll(mockArticleParams);
      
      expect(mockFirebaseAnalytics.logEvent).toHaveBeenCalledWith(
        'article_scroll',
        mockArticleParams
      );
    });

    it('should log article read time events', async () => {
      await analyticsService.logArticleReadTime(mockArticleParams);
      
      expect(mockFirebaseAnalytics.logEvent).toHaveBeenCalledWith(
        'article_read_time',
        mockArticleParams
      );
    });

    it('should log article share events', async () => {
      const shareParams = {
        ...mockArticleParams,
        platform: 'native_share'
      };
      await analyticsService.logArticleShare(shareParams);
      
      expect(mockFirebaseAnalytics.logEvent).toHaveBeenCalledWith(
        'article_share',
        shareParams
      );
    });

    it('should log article bookmark events', async () => {
      const bookmarkParams: ArticleAnalyticsParams = {
        ...mockArticleParams,
        interaction_type: 'bookmark' as const
      };
      await analyticsService.logArticleBookmark(bookmarkParams);
      
      expect(mockFirebaseAnalytics.logEvent).toHaveBeenCalledWith(
        'article_bookmark',
        bookmarkParams
      );
    });
  });

  describe('User Properties', () => {
    it('should set user ID', async () => {
      const userId = 'test-user-123';
      await analyticsService.setUserId(userId);
      
      expect(mockFirebaseAnalytics.setUserId).toHaveBeenCalledWith(userId);
    });

    it('should set user property', async () => {
      const propertyName = 'preferred_category';
      const propertyValue = 'Technology';
      
      await analyticsService.setUserProperty(propertyName, propertyValue);
      
      expect(mockFirebaseAnalytics.setUserProperty).toHaveBeenCalledWith(
        propertyName,
        propertyValue
      );
    });

    it('should validate user property name length', async () => {
      const longPropertyName = 'a'.repeat(25);
      await analyticsService.setUserProperty(longPropertyName, 'value');
      
      expect(mockFirebaseAnalytics.setUserProperty).not.toHaveBeenCalled();
    });

    it('should validate user property value length', async () => {
      const longValue = 'a'.repeat(37);
      await analyticsService.setUserProperty('test_prop', longValue);
      
      expect(mockFirebaseAnalytics.setUserProperty).not.toHaveBeenCalled();
    });
  });

  describe('Analytics Collection', () => {
    it('should enable analytics collection', async () => {
      await analyticsService.setAnalyticsCollectionEnabled(true);
      
      expect(mockFirebaseAnalytics.setAnalyticsCollectionEnabled)
        .toHaveBeenCalledWith(true);
    });

    it('should disable analytics collection', async () => {
      await analyticsService.setAnalyticsCollectionEnabled(false);
      
      expect(mockFirebaseAnalytics.setAnalyticsCollectionEnabled)
        .toHaveBeenCalledWith(false);
    });

    it('should reset analytics data', async () => {
      await analyticsService.resetAnalyticsData();
      
      expect(mockFirebaseAnalytics.resetAnalyticsData).toHaveBeenCalled();
    });
  });
});
