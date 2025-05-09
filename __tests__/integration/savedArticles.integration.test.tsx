import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { SavedArticlesProvider, useSavedArticles } from '../../context/SavedArticlesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';

// Setup mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../utils/supabase');

describe('SavedArticles Context Integration Tests', () => {
  // Mock article data
  const mockArticle1 = {
    id: 'article-1',
    title: 'Test Article 1',
    summary: 'Test Summary 1',
    content: 'Test Content 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_id: 'cat-1',
    category: { 
      id: 'cat-1', 
      name: 'Technology',
      description: null,
      is_active: true,
      article_count: null,
      created_at: new Date().toISOString()
    },
    status: 'published',
    view_count: 0,
    source_name: 'Test Source',
    source_url: 'https://example.com',
    source_icon: 'https://example.com/icon.png',
    image_path: 'https://example.com/image.jpg',
    created_by: 'user-1'
  };

  const mockArticle2 = {
    ...mockArticle1,
    id: 'article-2',
    title: 'Test Article 2',
  };

  // Wrapper component for testing hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SavedArticlesProvider>{children}</SavedArticlesProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AsyncStorage mock
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    
    // Setup empty saved articles initially
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    // Mock supabase fetch for articles
    const mockSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [mockArticle1, mockArticle2],
        error: null
      })
    });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
  });

  // Test Case 1: Initial Load
  it('should load saved articles from storage on initialization', async () => {
    // Mock storage data for saved articles
    const storedIds = ['article-1', 'article-2'];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedIds));
    
    // Render the hook with provider
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for async operations to complete
    await waitForNextUpdate();
    
    // Verify data is loaded properly
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('saved_articles');
    expect(result.current.savedArticles).toHaveLength(2);
    expect(result.current.savedArticles[0].id).toBe('article-1');
  });

  // Test Case 2: Adding Bookmark Integration
  it('should add a bookmark and persist it to storage', async () => {
    // Start with empty bookmarks
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for initial load
    await waitForNextUpdate();
    
    // Verify we start with empty saved articles
    expect(result.current.savedArticles).toHaveLength(0);
    
    // Add a bookmark
    await act(async () => {
      await result.current.addBookmark('article-1');
    });
    
    // Verify article was fetched and added
    expect(supabase.from).toHaveBeenCalledWith('news');
    
    // Verify AsyncStorage was called to persist
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    
    // Extract the storage data to verify
    const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const storageKey = setItemCall[0];
    const storageData = JSON.parse(setItemCall[1]);
    
    expect(storageKey).toBe('saved_articles');
    expect(storageData).toContain('article-1');
    
    // Verify article is now in savedArticles
    expect(result.current.savedArticles).toHaveLength(1);
    expect(result.current.savedArticles[0].id).toBe('article-1');
  });

  // Test Case 3: Removing Bookmark Integration
  it('should remove a bookmark and update storage', async () => {
    // Start with both articles bookmarked
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['article-1', 'article-2']));
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for initial load
    await waitForNextUpdate();
    
    // Verify both articles are loaded
    expect(result.current.savedArticles).toHaveLength(2);
    
    // Remove one bookmark
    await act(async () => {
      await result.current.removeBookmark('article-1');
    });
    
    // Verify only one article remains
    expect(result.current.savedArticles).toHaveLength(1);
    expect(result.current.savedArticles[0].id).toBe('article-2');
    
    // Verify storage was updated
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    
    // Extract the storage data to verify
    const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const storageData = JSON.parse(setItemCall[1]);
    
    expect(storageData).not.toContain('article-1');
    expect(storageData).toContain('article-2');
  });

  // Test Case 4: Storage Error Handling
  it('should handle storage errors gracefully', async () => {
    // Mock storage error
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
    
    // Render hook - should not throw
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for operations to complete
    await waitForNextUpdate();
    
    // Even on error, should initialize with empty array
    expect(result.current.savedArticles).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });

  // Test Case 5: Supabase Error Handling
  it('should handle Supabase errors when fetching saved articles', async () => {
    // Mock saved article IDs
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['article-1']));
    
    // Mock Supabase error
    const mockIn = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Supabase error')
    });
    const mockSelect = jest.fn().mockReturnValue({ in: mockIn });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for operations
    await waitForNextUpdate();
    
    // Should handle error but still have IDs
    expect(result.current.error).toBeTruthy();
    expect(result.current.savedArticles).toEqual([]);
  });

  // Test Case 6: isBookmarked Integration
  it('should correctly determine if an article is bookmarked', async () => {
    // Start with one article bookmarked
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['article-1']));
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for initial load
    await waitForNextUpdate();
    
    // Check functionality
    expect(result.current.isBookmarked('article-1')).toBe(true);
    expect(result.current.isBookmarked('article-2')).toBe(false);
    expect(result.current.isBookmarked('non-existent')).toBe(false);
  });

  // Test Case 7: Idempotent Operations
  it('should handle duplicate adds and removes without errors', async () => {
    // Start with article-1 already saved
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['article-1']));
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useSavedArticles(), { wrapper });
    
    // Wait for initial load
    await waitForNextUpdate();
    
    // Adding the same article again should not duplicate
    await act(async () => {
      await result.current.addBookmark('article-1');
    });
    
    // Should still only have 1 article
    expect(result.current.savedArticles).toHaveLength(1);
    
    // Removing non-existent article should not error
    await act(async () => {
      await result.current.removeBookmark('non-existent');
    });
    
    // Should still have the original article
    expect(result.current.savedArticles).toHaveLength(1);
  });
}); 