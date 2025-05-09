/**
 * E2E Tests for Authentication Flows
 */
const { element, by, device, expect } = require('detox');
const { 
  TEST_USER, 
  waitForElementById, 
  waitForElementByText,
  login,
  isLoggedIn,
  logout
} = require('../utils/testUtils');

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    // Reset app to login screen if needed
    if (await isLoggedIn()) {
      await logout();
    }
    // Ensure we're on login screen
    await device.reloadReactNative();
  });

  describe('Login', () => {
    it('should show validation error for empty email and password', async () => {
      await waitForElementById('login-button');
      await element(by.id('login-button')).tap();
      await waitForElementByText('Please enter both email and password');
    });

    it('should login successfully with valid credentials', async () => {
      await login(TEST_USER.email, TEST_USER.password);
      // Verify successful login by finding an element on the home screen
      await waitForElementById('home-screen');
      expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should show error message with invalid credentials', async () => {
      await login(TEST_USER.email, TEST_USER.invalidPassword);
      // Verify error message appears
      await waitForElementByText('Invalid login credentials');
    });
  });

  describe('Registration', () => {
    it('should navigate to registration screen', async () => {
      await waitForElementById('register-link');
      await element(by.id('register-link')).tap();
      await waitForElementById('register-screen');
    });

    it('should show validation errors for invalid registration inputs', async () => {
      // Navigate to registration
      await waitForElementById('register-link');
      await element(by.id('register-link')).tap();
      
      // Try to register with empty fields
      await element(by.id('register-button')).tap();
      await waitForElementByText('Please fill all required fields');
      
      // Try with invalid email format
      await element(by.id('register-email-input')).typeText('invalid-email');
      await element(by.id('register-password-input')).typeText('Password123');
      await element(by.id('register-confirm-password-input')).typeText('Password123');
      await element(by.id('register-button')).tap();
      await waitForElementByText('Please enter a valid email address');
    });

    it('should show error when passwords do not match', async () => {
      // Navigate to registration
      await waitForElementById('register-link');
      await element(by.id('register-link')).tap();
      
      // Enter different passwords
      await element(by.id('register-email-input')).typeText('test@example.com');
      await element(by.id('register-password-input')).typeText('Password123');
      await element(by.id('register-confirm-password-input')).typeText('DifferentPassword123');
      await element(by.id('register-button')).tap();
      await waitForElementByText('Passwords do not match');
    });

    // Note: We don't test actual registration to avoid creating new users in the database
    // In a real test environment, we would use test accounts or mock the registration API
  });

  describe('Password Reset', () => {
    it('should navigate to forgot password screen', async () => {
      await waitForElementById('forgot-password-link');
      await element(by.id('forgot-password-link')).tap();
      await waitForElementById('reset-password-screen');
    });

    it('should show validation error for empty email', async () => {
      // Navigate to forgot password
      await waitForElementById('forgot-password-link');
      await element(by.id('forgot-password-link')).tap();
      
      // Try with empty email
      await element(by.id('reset-password-button')).tap();
      await waitForElementByText('Please enter your email address');
    });

    it('should show success message when valid email is submitted', async () => {
      // Navigate to forgot password
      await waitForElementById('forgot-password-link');
      await element(by.id('forgot-password-link')).tap();
      
      // Enter email and submit
      await element(by.id('reset-email-input')).typeText(TEST_USER.email);
      await element(by.id('reset-password-button')).tap();
      await waitForElementByText('Password reset email sent');
    });
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      // First login
      await login(TEST_USER.email, TEST_USER.password);
      await waitForElementById('home-screen');
      
      // Then logout
      await logout();
      
      // Verify logout by checking for login screen
      await waitForElementById('login-button');
      expect(element(by.id('login-button'))).toBeVisible();
    });
  });
}); 