import { preferencesService } from '../preferences';
import { supabase } from '../supabaseClient';
import { TimeoutError } from '../timeoutUtils';
import { UserPreferences, SavedArticle } from '../../types/accessibility';

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

describe('PreferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockUserId = 'test-user-id';
  const mockUserPreferences: UserPreferences = {
    user_id: mockUserId,
    notifications_enabled: true,
    dark_mode_enabled: false,
    created_at: '2025-03-08T10:00:00Z',
    updated_at: '2025-03-08T10:00:00Z'
  };

  const mockSavedArticle: SavedArticle = {
    user_id: mockUserId,
    article_id: 'test-article-id',
    saved_at: '2025-03-08T10:00:00Z',
    article: {
      id: 'test-article-id',
      title: 'Test Article',
      summary: 'Test Summary',
      content: '',
      image_path: 'test-image.jpg',
      category_id: 'test-category',
      created_by: '',
      created_at: '2025-03-08T10:00:00Z',
      saved: true
    }
  };

  describe('getUserPreferences', () => {
    it('should return preferences when found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserPreferences,
              error: null
            })
          })
        })
      });

      const result = await preferencesService.getUserPreferences(mockUserId);
      expect(result).toEqual(mockUserPreferences);
    });

    it('should handle timeout and retry', async () => {
      const mockSelect = jest.fn()
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 6000)))
        .mockImplementationOnce(() => ({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserPreferences,
              error: null
            })
          })
        }));

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      const promise = preferencesService.getUserPreferences(mockUserId);
      
      // Trigger first timeout
      jest.advanceTimersByTime(5001);
      
      // Allow retry to succeed
      jest.advanceTimersByTime(1000);
      
      const result = await promise;
      expect(result).toEqual(mockUserPreferences);
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });

    it('should return null when no preferences found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const result = await preferencesService.getUserPreferences(mockUserId);
      expect(result).toBeNull();
    });
  });

  describe('getSavedArticles', () => {
    it('should return saved articles', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockSavedArticle],
              error: null
            })
          })
        })
      });

      const result = await preferencesService.getSavedArticles(mockUserId);
      expect(result).toEqual([mockSavedArticle]);
    });

    it('should handle timeout with retry', async () => {
      const mockOperation = jest.fn()
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 6000)))
        .mockResolvedValueOnce({
          data: [mockSavedArticle],
          error: null
        });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOperation
          })
        })
      });

      const promise = preferencesService.getSavedArticles(mockUserId);
      
      // Trigger first timeout
      jest.advanceTimersByTime(5001);
      
      // Allow retry to succeed
      jest.advanceTimersByTime(1000);
      
      const result = await promise;
      expect(result).toEqual([mockSavedArticle]);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveArticle', () => {
    it('should save article successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await preferencesService.saveArticle(mockUserId, 'test-article-id');
      expect(result).toBe(true);
    });

    it('should handle timeout', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 6000))
        )
      });

      const promise = preferencesService.saveArticle(mockUserId, 'test-article-id');
      jest.advanceTimersByTime(5001);
      
      await expect(promise).rejects.toThrow(TimeoutError);
    });
  });

  describe('isArticleSaved', () => {
    it('should return true when article is saved', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { article_id: 'test-article-id' },
                error: null
              })
            })
          })
        })
      });

      const result = await preferencesService.isArticleSaved(mockUserId, 'test-article-id');
      expect(result).toBe(true);
    });

    it('should return false when article is not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      });

      const result = await preferencesService.isArticleSaved(mockUserId, 'test-article-id');
      expect(result).toBe(false);
    });
  });
});
