import { adaptArticle, adaptArticles, Article } from '../dataAdapter';

describe('dataAdapter', () => {
  const mockDbArticle = {
    id: '123',
    title: 'Test Article',
    summary: 'Test Summary',
    content: 'Test Content',
    image_path: 'test/image.jpg',
    categories: {
      name: 'Education'
    },
    created_at: '2025-03-06T10:00:00Z',
    created_by: 'user123'
  };

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_STORAGE_URL = 'https://test-storage.com';
  });

  describe('adaptArticle', () => {
    it('should correctly adapt a database article to frontend article', () => {
      const result = adaptArticle(mockDbArticle);

      expect(result).toEqual({
        id: '123',
        title: 'Test Article',
        summary: 'Test Summary',
        content: 'Test Content',
        category: 'Education',
        source: 'Global Edu',
        imageUrl: 'https://test-storage.com/article-images/test/image.jpg',
        sourceIconUrl: expect.any(String),
        timeAgo: expect.any(String),
        url: ''
      });
    });

    it('should handle missing category', () => {
      const noCategory = {
        ...mockDbArticle,
        categories: null
      };

      const result = adaptArticle(noCategory);
      expect(result.category).toBe('Uncategorized');
    });
  });

  describe('adaptArticles', () => {
    it('should adapt an array of articles', () => {
      const dbArticles = [mockDbArticle, mockDbArticle];
      const result = adaptArticles(dbArticles);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockDbArticle.id,
        title: mockDbArticle.title
      }));
    });

    it('should return empty array for empty input', () => {
      const result = adaptArticles([]);
      expect(result).toEqual([]);
    });
  });
});
