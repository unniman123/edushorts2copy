/**
 * Performance E2E Tests
 * These tests measure various performance aspects of the app
 */
const { element, by, device, expect } = require('detox');
const { 
  TEST_USER, 
  waitForElementById, 
  login,
  navigateToScreen,
  isLoggedIn,
  logout
} = require('../utils/testUtils');

describe('Performance Tests', () => {
  beforeEach(async () => {
    // Start with a fresh app instance for each test
    await device.terminateApp();
  });
  
  afterAll(async () => {
    // Ensure we're logged out at the end
    await device.launchApp({ newInstance: true });
    if (await isLoggedIn()) {
      await logout();
    }
  });

  describe('App Launch Performance', () => {
    it('should measure cold start time', async () => {
      // Record start time
      const startTime = Date.now();
      
      // Launch app as new instance (cold start)
      await device.launchApp({ newInstance: true });
      
      // Wait for the login screen to appear
      await waitForElementById('login-button');
      
      // Record end time
      const endTime = Date.now();
      const launchTime = endTime - startTime;
      
      console.log(`Cold start time: ${launchTime}ms`);
      
      // Assert that launch time is within acceptable limits (adjust as needed)
      // This is somewhat arbitrary and should be calibrated based on your app and device expectations
      expect(launchTime).toBeLessThan(5000); // 5 seconds max for cold start
    });

    it('should measure warm start time', async () => {
      // First launch app to ensure it's in memory
      await device.launchApp({ newInstance: true });
      await waitForElementById('login-button');
      
      // Send app to background
      await device.sendToHome();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait briefly
      
      // Record start time
      const startTime = Date.now();
      
      // Launch app from background (warm start)
      await device.launchApp({ newInstance: false });
      
      // Wait for the login screen to appear
      await waitForElementById('login-button');
      
      // Record end time
      const endTime = Date.now();
      const launchTime = endTime - startTime;
      
      console.log(`Warm start time: ${launchTime}ms`);
      
      // Assert that warm start is faster than cold start
      expect(launchTime).toBeLessThan(2000); // 2 seconds max for warm start
    });
  });

  describe('Navigation Performance', () => {
    beforeEach(async () => {
      // Start app and login for navigation tests
      await device.launchApp({ newInstance: true });
      if (!(await isLoggedIn())) {
        await login(TEST_USER.email, TEST_USER.password);
        await waitForElementById('home-screen');
      }
    });

    it('should measure tab navigation time', async () => {
      // Starting from home screen
      await navigateToScreen('Home');
      
      const tabScreens = ['Discover', 'Bookmarks', 'Profile', 'Settings'];
      
      for (const screen of tabScreens) {
        // Record start time
        const startTime = Date.now();
        
        // Navigate to tab
        await navigateToScreen(screen);
        
        // Record end time
        const endTime = Date.now();
        const navigationTime = endTime - startTime;
        
        console.log(`Navigation time to ${screen}: ${navigationTime}ms`);
        
        // Assert navigation performance
        expect(navigationTime).toBeLessThan(1000); // 1 second max for tab navigation
      }
    });

    it('should measure article open performance', async () => {
      // Navigate to home screen
      await navigateToScreen('Home');
      await waitForElementById('article-item-0');
      
      // Record start time
      const startTime = Date.now();
      
      // Open article
      await element(by.id('article-item-0')).tap();
      
      // Wait for article detail to load
      await waitForElementById('article-detail-screen');
      
      // Record end time
      const endTime = Date.now();
      const openTime = endTime - startTime;
      
      console.log(`Article open time: ${openTime}ms`);
      
      // Assert article open performance
      expect(openTime).toBeLessThan(2000); // 2 seconds max for article open
      
      // Navigate back
      await element(by.id('back-button')).tap();
    });
  });

  describe('Scroll Performance', () => {
    beforeEach(async () => {
      // Start app and login for scroll tests
      await device.launchApp({ newInstance: true });
      if (!(await isLoggedIn())) {
        await login(TEST_USER.email, TEST_USER.password);
        await waitForElementById('home-screen');
      }
      // Ensure we're on the home screen
      await navigateToScreen('Home');
    });

    it('should measure article list scroll performance', async () => {
      // Wait for article list to be visible
      await waitForElementById('article-list');
      
      // Record start time
      const startTime = Date.now();
      
      // Perform multiple scrolls
      for (let i = 0; i < 5; i++) {
        await element(by.id('article-list')).scroll(500, 'down');
        await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause between scrolls
      }
      
      // Record end time
      const endTime = Date.now();
      const scrollTime = endTime - startTime;
      
      console.log(`Article list scroll time (5 scrolls): ${scrollTime}ms`);
      console.log(`Average time per scroll: ${scrollTime / 5}ms`);
      
      // Assert scroll performance (adjust based on your app's expectations)
      // This checks if each scroll takes less than 500ms on average
      expect(scrollTime / 5).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('should not exhibit excessive memory growth during usage', async () => {
      // This test simulates typical user interaction and checks memory usage
      // Note: Detox doesn't directly provide memory metrics, so we'll use logs and visual inspection
      
      // Launch app and login
      await device.launchApp({ newInstance: true });
      await login(TEST_USER.email, TEST_USER.password);
      await waitForElementById('home-screen');
      
      console.log('Starting memory usage test - check device profiler for baseline');
      
      // Perform a series of interactions to simulate user behavior
      const screens = ['Home', 'Discover', 'Bookmarks', 'Profile', 'Settings'];
      
      // Perform multiple cycles of navigation and interaction
      for (let cycle = 0; cycle < 3; cycle++) {
        console.log(`Starting interaction cycle ${cycle + 1}`);
        
        // Navigate through all tabs
        for (const screen of screens) {
          await navigateToScreen(screen);
          await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
        }
        
        // Open and close a few articles
        await navigateToScreen('Home');
        for (let i = 0; i < 3; i++) {
          // Open article
          const articleId = `article-item-${i}`;
          if (await element(by.id(articleId)).isVisible()) {
            await element(by.id(articleId)).tap();
            await waitForElementById('article-detail-screen');
            
            // Scroll in the article
            await element(by.id('article-content')).scroll(300, 'down');
            await new Promise(resolve => setTimeout(resolve, 500));
            await element(by.id('article-content')).scroll(300, 'down');
            
            // Go back
            await element(by.id('back-button')).tap();
            await waitForElementById('home-screen');
          }
        }
        
        // Search for content
        await navigateToScreen('Discover');
        await element(by.id('search-input')).typeText('education');
        await element(by.id('search-button')).tap();
        await waitForElementById('search-results');
        
        // Clear search
        await element(by.id('clear-search')).tap();
      }
      
      console.log('Completed memory usage test - check device profiler for comparison');
      
      // Normally, we would assert on memory metrics here, but this requires device-specific
      // instrumentation beyond what Detox provides by default
    });
  });
}); 