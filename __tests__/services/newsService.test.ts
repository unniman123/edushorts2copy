import { newsService } from '../../services/newsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

const mockArticle = {
  id: '1',
  title: 'Test Article',
  summary: 'Test Summary',
  content: 'Test Content',
  status: 'published',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  view_count: 0,
};

describe('NewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  describe('getArticles', () => {
    it('should fetch and cache articles when online', async () => {
      const mockData = [mockArticle];
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const articles = await newsService.getArticles();

      expect(articles).toHaveLength(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return cached articles when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
      const cachedArticles = [mockArticle];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({
          timestamp: Date.now(),
          articles: cachedArticles,
        })
      );

      const articles = await newsService.getArticles();

      expect(articles).toEqual(cachedArticles);
    });

    it('should handle category filtering', async () => {
      const mockData = [mockArticle];
      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await newsService.getArticles({ categoryId: '123' });

      expect(mockEq).toHaveBeenCalledWith('category_id', '123');
    });
  });

  describe('trackView', () => {
    it('should track article view when online', async () => {
      const mockRpc = jest.fn().mockResolvedValue({ error: null });
      (supabase.rpc as jest.Mock).mockReturnValue(mockRpc);

      await newsService.trackView('1');

      expect(supabase.rpc).toHaveBeenCalledWith('increment_view_count', {
        article_id: '1',
      });
    });

    it('should queue view tracking when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      await newsService.trackView('1');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const queueData = JSON.parse(setItemCall[1]);
      expect(queueData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'view',
            data: { articleId: '1' },
          }),
        ])
      );
    });
  });

  describe('trackInteraction', () => {
    const interaction = {
      articleId: '1',
      type: 'bookmark' as const,
      duration: 60,
      metadata: { source: 'test' },
    };

    it('should track interaction when online', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await newsService.trackInteraction(interaction);

      expect(supabase.from).toHaveBeenCalledWith('article_analytics');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          article_id: interaction.articleId,
          interaction_type: interaction.type,
        }),
      ]);
    });

    it('should queue interaction when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      await newsService.trackInteraction(interaction);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const queueData = JSON.parse(setItemCall[1]);
      expect(queueData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'interaction',
            data: interaction,
          }),
        ])
      );
    });
  });

  describe('syncOfflineActions', () => {
    it('should process queued actions when coming back online', async () => {
      const mockQueue = [
        {
          id: '1',
          type: 'view',
          data: { articleId: '1' },
          timestamp: Date.now(),
        },
        {
          id: '2',
          type: 'interaction',
          data: {
            articleId: '1',
            type: 'bookmark',
          },
          timestamp: Date.now(),
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );

      const mockRpc = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.rpc as jest.Mock).mockReturnValue(mockRpc);
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await newsService.syncOfflineActions();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.any(String),
        '[]'
      );
      expect(supabase.rpc).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalled();
    });

    it('should not sync when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      await newsService.syncOfflineActions();

      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
