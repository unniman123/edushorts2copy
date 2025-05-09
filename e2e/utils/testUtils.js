/**
 * Utility functions for E2E testing
 */
const { element, by, device, expect, waitFor } = require('detox');

// Test data for auth flows
const TEST_USER = {
  email: 'test-user@example.com',
  password: 'Test@123456',
  invalidPassword: 'wrongpassword',
};

/**
 * Helper function to wait for an element with the provided ID to be visible
 * @param {string} id - Test ID of the element to wait for
 * @param {number} timeout - Optional timeout in ms (default: 5000ms)
 */
async function waitForElementById(id, timeout = 5000) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Helper function to wait for an element with the provided text to be visible
 * @param {string} text - Text content of the element to wait for
 * @param {number} timeout - Optional timeout in ms (default: 5000ms)
 */
async function waitForElementByText(text, timeout = 5000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Helper function to simulate network conditions
 * @param {string} condition - 'online', 'offline', 'slow'
 */
async function setNetworkCondition(condition) {
  if (condition === 'offline') {
    await device.setStatusBar({ network: 'no-network' });
  } else if (condition === 'slow') {
    await device.setStatusBar({ network: 'edge' });
  } else {
    await device.setStatusBar({ network: 'wifi' });
  }
}

/**
 * Perform login with provided credentials
 * @param {string} email - Email address
 * @param {string} password - Password
 */
async function login(email, password) {
  await waitForElementById('email-input');
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
}

/**
 * Navigate to a specific screen through the bottom tab navigation
 * @param {string} screenName - Name of the screen to navigate to
 */
async function navigateToScreen(screenName) {
  // Map of screen names to tab IDs
  const tabMapping = {
    'Home': 'home-tab',
    'Discover': 'discover-tab',
    'Profile': 'profile-tab',
    'Bookmarks': 'bookmarks-tab',
    'Settings': 'settings-tab',
  };
  
  const tabId = tabMapping[screenName];
  
  if (!tabId) {
    throw new Error(`Screen name "${screenName}" not found in tab mapping`);
  }
  
  await element(by.id(tabId)).tap();
  
  // Wait for the screen to become visible
  await waitForElementById(`${screenName.toLowerCase()}-screen`);
}

/**
 * Logout from the app through the settings menu
 */
async function logout() {
  await navigateToScreen('Settings');
  await element(by.id('logout-button')).tap();
  await element(by.text('Confirm')).tap();
}

/**
 * Check if the user is logged in
 * @returns {Promise<boolean>} - Returns true if user is logged in, false otherwise
 */
async function isLoggedIn() {
  try {
    // Try to find an element that's only visible when logged in
    await waitForElementById('home-screen', 2000);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  TEST_USER,
  waitForElementById,
  waitForElementByText,
  setNetworkCondition,
  login,
  navigateToScreen,
  logout,
  isLoggedIn
}; 