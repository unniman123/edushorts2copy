/**
 * E2E Tests for Edge Cases like offline mode, error states, etc.
 */
const { element, by, device, expect } = require('detox');
const { 
  TEST_USER, 
  waitForElementById, 
  waitForElementByText,
  login,
  navigateToScreen,
  isLoggedIn,
  logout,
  setNetworkCondition
} = require('../utils/testUtils');

describe('Edge Cases', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    
    // Login if not already logged in
    if (!(await isLoggedIn())) {
      await login(TEST_USER.email, TEST_USER.password);
      await waitForElementById('home-screen');
    }
  });
  
  beforeEach(async () => {
    // Ensure we're logged in and network is online before each test
    if (!(await isLoggedIn())) {
      // Reset network to online
      await setNetworkCondition('online');
      await login(TEST_USER.email, TEST_USER.password);
    }
    
    // Ensure network is online for starting each test
    await setNetworkCondition('online');
  });
  
  afterAll(async () => {
    // Reset network condition and logout
    await setNetworkCondition('online');
    if (await isLoggedIn()) {
      await logout();
    }
  });

  describe('Offline Mode', () => {
    it('should show cached content when offline', async () => {
      // First load content while online
      await navigateToScreen('Home');
      await waitForElementById('article-list');
      
      // Now go offline and refresh
      await setNetworkCondition('offline');
      
      // Pull to refresh (simulate the gesture)
      await element(by.id('article-list')).swipe('down', 'slow', 0.5);
      
      // Should show offline indicator
      await waitForElementByText('You are offline');
      
      // Should still show previously loaded content
      expect(element(by.id('article-item-0'))).toBeVisible();
    });

    it('should show offline indicator on search page', async () => {
      await navigateToScreen('Discover');
      
      // Go offline
      await setNetworkCondition('offline');
      
      // Try to search
      await element(by.id('search-input')).typeText('test');
      await element(by.id('search-button')).tap();
      
      // Should show offline error
      await waitForElementByText('Cannot search while offline');
    });

    it('should recover when coming back online', async () => {
      // Go offline
      await setNetworkCondition('offline');
      
      // Navigate to home
      await navigateToScreen('Home');
      
      // Should see offline indicator
      await waitForElementByText('You are offline');
      
      // Come back online
      await setNetworkCondition('online');
      
      // Pull to refresh
      await element(by.id('article-list')).swipe('down', 'slow', 0.5);
      
      // Should no longer see offline indicator
      await expect(element(by.text('You are offline'))).not.toBeVisible();
      
      // Should see refreshed content
      await waitForElementById('article-item-0');
      expect(element(by.id('article-item-0'))).toBeVisible();
    });
  });

  describe('Slow Network', () => {
    it('should show loading indicators during slow network', async () => {
      // Set network to slow
      await setNetworkCondition('slow');
      
      // Navigate to home and pull to refresh
      await navigateToScreen('Home');
      await element(by.id('article-list')).swipe('down', 'slow', 0.5);
      
      // Should see loading indicator
      await waitForElementById('loading-indicator');
      expect(element(by.id('loading-indicator'))).toBeVisible();
      
      // Eventually content should load
      await waitForElementById('article-item-0', 15000); // Longer timeout for slow network
      expect(element(by.id('article-item-0'))).toBeVisible();
    });
  });

  describe('Error States', () => {
    it('should handle and recover from API errors', async () => {
      // This test simulates an API error by using a special test user
      // that triggers a simulated server error
      
      // First logout
      await logout();
      
      // Login with test user that should trigger errors
      await login('error-test@example.com', 'password123');
      
      // Navigate to home
      await waitForElementById('home-screen');
      
      // Should see error state
      await waitForElementByText('Something went wrong');
      await waitForElementById('retry-button');
      
      // Tap retry
      await element(by.id('retry-button')).tap();
      
      // Should eventually load content
      await waitForElementById('article-item-0', 10000);
      expect(element(by.id('article-item-0'))).toBeVisible();
      
      // Logout and login with normal test user
      await logout();
      await login(TEST_USER.email, TEST_USER.password);
    });

    it('should handle session timeout/expiry', async () => {
      // This test simulates a session timeout by manipulating the app state
      
      // Put app in background to simulate timeout
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait briefly
      await device.launchApp({ newInstance: false });
      
      // Force session timeout simulation
      // Note: This requires a special flag in the app for testing
      // In a real implementation, this would need to be handled differently
      await element(by.id('force-session-timeout')).tap();
      
      // Try to access protected content
      await navigateToScreen('Profile');
      
      // Should be redirected to login
      await waitForElementById('login-button');
      expect(element(by.id('login-button'))).toBeVisible();
      
      // Login again
      await login(TEST_USER.email, TEST_USER.password);
      
      // Should be on home screen with valid session
      await waitForElementById('home-screen');
      expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Deep Linking', () => {
    it('should handle deep links to articles', async () => {
      // Test app's handling of deep links
      // This requires special handling in Detox to simulate deep links
      
      // Open a deep link to a specific article
      await device.openURL({ url: 'edushorts://article/12345' });
      
      // Should navigate directly to article detail
      await waitForElementById('article-detail-screen');
      expect(element(by.id('article-detail-screen'))).toBeVisible();
      
      // Article should have correct ID
      await waitForElementByText('Article #12345');
      
      // Navigate back
      await element(by.id('back-button')).tap();
    });
  });
}); 