/**
 * E2E Tests for Navigation and Core Functionality
 */
const { element, by, device, expect } = require('detox');
const { 
  TEST_USER, 
  waitForElementById, 
  waitForElementByText,
  login,
  navigateToScreen,
  isLoggedIn,
  logout
} = require('../utils/testUtils');

describe('Navigation and Core Functionality', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    
    // Login if not already logged in
    if (!(await isLoggedIn())) {
      await login(TEST_USER.email, TEST_USER.password);
      await waitForElementById('home-screen');
    }
  });
  
  beforeEach(async () => {
    // Ensure we're logged in before each test
    if (!(await isLoggedIn())) {
      await login(TEST_USER.email, TEST_USER.password);
    }
  });
  
  afterAll(async () => {
    // Logout after all tests
    if (await isLoggedIn()) {
      await logout();
    }
  });

  describe('Tab Navigation', () => {
    it('should navigate to Home screen', async () => {
      await navigateToScreen('Home');
      await waitForElementById('home-screen');
      expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should navigate to Discover screen', async () => {
      await navigateToScreen('Discover');
      await waitForElementById('discover-screen');
      expect(element(by.id('discover-screen'))).toBeVisible();
    });

    it('should navigate to Bookmarks screen', async () => {
      await navigateToScreen('Bookmarks');
      await waitForElementById('bookmarks-screen');
      expect(element(by.id('bookmarks-screen'))).toBeVisible();
    });

    it('should navigate to Profile screen', async () => {
      await navigateToScreen('Profile');
      await waitForElementById('profile-screen');
      expect(element(by.id('profile-screen'))).toBeVisible();
    });

    it('should navigate to Settings screen', async () => {
      await navigateToScreen('Settings');
      await waitForElementById('settings-screen');
      expect(element(by.id('settings-screen'))).toBeVisible();
    });
  });

  describe('Article Interaction', () => {
    it('should display articles on Home screen', async () => {
      await navigateToScreen('Home');
      await waitForElementById('article-list');
      expect(element(by.id('article-list'))).toBeVisible();
      
      // Check if at least one article is displayed
      await waitForElementById('article-item-0');
      expect(element(by.id('article-item-0'))).toBeVisible();
    });

    it('should open article when tapped', async () => {
      await navigateToScreen('Home');
      await waitForElementById('article-item-0');
      await element(by.id('article-item-0')).tap();
      
      // Verify article detail screen is displayed
      await waitForElementById('article-detail-screen');
      expect(element(by.id('article-detail-screen'))).toBeVisible();
      
      // Go back to home screen
      await element(by.id('back-button')).tap();
      await waitForElementById('home-screen');
    });

    it('should bookmark an article', async () => {
      // Navigate to home and open first article
      await navigateToScreen('Home');
      await waitForElementById('article-item-0');
      await element(by.id('article-item-0')).tap();
      
      // Bookmark the article
      await waitForElementById('bookmark-button');
      await element(by.id('bookmark-button')).tap();
      
      // Verify bookmark confirmation
      await waitForElementByText('Article bookmarked');
      
      // Go back to home
      await element(by.id('back-button')).tap();
      
      // Go to bookmarks and verify article is there
      await navigateToScreen('Bookmarks');
      await waitForElementById('bookmarks-list');
      expect(element(by.id('bookmarks-list'))).toBeVisible();
      
      // There should be at least one bookmarked article
      await waitForElementById('bookmark-item-0');
      expect(element(by.id('bookmark-item-0'))).toBeVisible();
    });
  });

  describe('Search Functionality', () => {
    it('should search for articles', async () => {
      await navigateToScreen('Discover');
      await waitForElementById('search-input');
      
      // Type search query
      await element(by.id('search-input')).typeText('education');
      await element(by.id('search-button')).tap();
      
      // Wait for search results
      await waitForElementById('search-results');
      expect(element(by.id('search-results'))).toBeVisible();
      
      // Check if search returned at least one result
      await waitForElementById('search-result-0');
      expect(element(by.id('search-result-0'))).toBeVisible();
    });

    it('should show empty state for no search results', async () => {
      await navigateToScreen('Discover');
      await waitForElementById('search-input');
      
      // Type search query that shouldn't match anything
      await element(by.id('search-input')).typeText('xyznonexistentquery123');
      await element(by.id('search-button')).tap();
      
      // Check if no results message is displayed
      await waitForElementByText('No results found');
    });
  });

  describe('Profile Functionality', () => {
    it('should display user information on profile screen', async () => {
      await navigateToScreen('Profile');
      
      // Check for profile elements
      await waitForElementById('profile-username');
      expect(element(by.id('profile-username'))).toBeVisible();
      
      await waitForElementById('profile-email');
      expect(element(by.id('profile-email'))).toBeVisible();
    });

    it('should navigate to notification settings', async () => {
      await navigateToScreen('Settings');
      await waitForElementById('notification-settings-button');
      await element(by.id('notification-settings-button')).tap();
      
      // Verify navigation to notification settings
      await waitForElementById('notification-settings-screen');
      expect(element(by.id('notification-settings-screen'))).toBeVisible();
      
      // Go back
      await element(by.id('back-button')).tap();
    });
  });
}); 