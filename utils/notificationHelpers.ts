/**
 * Notification Helper Utilities
 * 
 * Provides centralized utilities for handling notification payloads and deep links
 * across different notification sources (Expo, FCM, Branch).
 * 
 * Key Features:
 * - Normalizes notification data from various sources
 * - Extracts deep links from multiple possible payload keys
 * - Routes deep links to appropriate handlers (Branch or DeepLinkHandler)
 * - Ensures consistent behavior across app states (foreground, background, killed)
 */

import DeepLinkHandler from '../services/DeepLinkHandler';

/**
 * Notification data structure that may come from various sources
 */
export interface NotificationData {
  deep_link?: string | unknown;
  branch_link?: string | unknown;
  url?: string | unknown;
  click_action?: string | unknown;
  [key: string]: unknown;
}

/**
 * Normalizes notification payload to extract deep link
 * 
 * Searches through common deep link keys in order of preference:
 * 1. deep_link (primary)
 * 2. branch_link (Branch-specific)
 * 3. url (generic URL)
 * 4. click_action (Android-style)
 * 
 * Evidence: Multiple payload keys observed in codebase (App.tsx:563-566, NotificationBridge.ts:369)
 * 
 * @param data - Notification data object from any source
 * @returns Normalized deep link string or null if none found
 */
export function normalizeNotificationDeepLink(data: NotificationData | undefined | null): string | null {
  if (!data) {
    return null;
  }

  // Check each possible key in priority order
  const possibleKeys = ['deep_link', 'branch_link', 'url', 'click_action'] as const;
  
  for (const key of possibleKeys) {
    const value = data[key];
    if (value && typeof value === 'string' && value.trim().length > 0) {
      console.log(`[NotificationHelpers] Deep link found in key '${key}':`, value);
      return value.trim();
    }
  }

  console.log('[NotificationHelpers] No deep link found in notification data');
  return null;
}

/**
 * Determines if a URL is a Branch short link
 * 
 * Evidence: Branch domains identified in App.tsx:587, NotificationService.ts:385, DeepLinkHandler.ts
 * 
 * @param url - URL to check
 * @returns true if URL is a Branch link
 */
export function isBranchLink(url: string): boolean {
  return url.includes('xbwk1.app.link') || url.includes('xbwk1-alternate.app.link');
}

/**
 * Routes a notification deep link to the appropriate handler
 * 
 * This function provides centralized routing logic for all notification deep links,
 * ensuring consistent behavior regardless of app state or notification source.
 * 
 * Routing Logic:
 * 1. Branch links (xbwk1.app.link) → branch.openURL() if available, else DeepLinkHandler
 * 2. App scheme links (edushorts://) → DeepLinkHandler
 * 3. Other URLs → DeepLinkHandler
 * 
 * Evidence-based decision: Multiple handlers in codebase route differently (NotificationService.ts:384-400,
 * NotificationBridge.ts:203-219). This centralizes the logic to prevent inconsistencies.
 * 
 * @param deepLink - The normalized deep link URL
 * @returns Promise<boolean> - true if navigation was attempted, false otherwise
 */
export async function routeNotificationDeepLink(deepLink: string): Promise<boolean> {
  if (!deepLink) {
    console.warn('[NotificationHelpers] routeNotificationDeepLink called with empty deep link');
    return false;
  }

  console.log('[NotificationHelpers] Routing notification deep link:', deepLink);

  try {
    // Handle Branch links
    if (isBranchLink(deepLink)) {
      console.log('[NotificationHelpers] Branch link detected, attempting branch.openURL');
      
      try {
        const branch = require('react-native-branch').default;
        if (branch && typeof branch.openURL === 'function') {
          await branch.openURL(deepLink);
          console.log('[NotificationHelpers] Branch link opened successfully');
          return true;
        } else {
          console.warn('[NotificationHelpers] Branch SDK openURL not available, falling back to DeepLinkHandler');
        }
      } catch (branchError) {
        console.error('[NotificationHelpers] Error loading Branch SDK, falling back to DeepLinkHandler:', branchError);
      }
    }

    // Handle app scheme links and fallback for Branch links
    console.log('[NotificationHelpers] Using DeepLinkHandler for deep link:', deepLink);
    const deepLinkHandler = DeepLinkHandler.getInstance();
    const handled = await deepLinkHandler.handleDeepLink(deepLink);
    
    if (handled) {
      console.log('[NotificationHelpers] Deep link handled successfully by DeepLinkHandler');
    } else {
      console.warn('[NotificationHelpers] DeepLinkHandler returned false for deep link:', deepLink);
    }
    
    return handled;
  } catch (error) {
    console.error('[NotificationHelpers] Error routing notification deep link:', error);
    return false;
  }
}

/**
 * Waits for navigation readiness with timeout
 * 
 * Checks if navigation ref is available and returns immediately if so.
 * Otherwise, polls with exponential backoff up to maxWaitMs.
 * 
 * Evidence: Fixed delays cause race conditions (App.tsx:574). This provides
 * adaptive waiting based on actual readiness state.
 * 
 * @param navigationRef - React Navigation ref to check
 * @param maxWaitMs - Maximum time to wait in milliseconds
 * @returns Promise<boolean> - true if navigation is ready
 */
export async function waitForNavigationReady(
  navigationRef: { current: any } | null | undefined,
  maxWaitMs: number = 3000
): Promise<boolean> {
  const startTime = Date.now();
  let attempt = 0;
  const maxAttempts = 10;

  while (Date.now() - startTime < maxWaitMs && attempt < maxAttempts) {
    // Check if navigation ref is available and has navigation state
    if (navigationRef?.current) {
      const navState = navigationRef.current.getState?.();
      if (navState && navState.routes && navState.routes.length > 0) {
        console.log('[NotificationHelpers] Navigation ready after', Date.now() - startTime, 'ms');
        return true;
      }
    }

    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, then 500ms intervals
    const delay = attempt < 4 ? Math.pow(2, attempt) * 100 : 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    attempt++;
  }

  console.warn('[NotificationHelpers] Navigation readiness timeout after', Date.now() - startTime, 'ms');
  return false;
}

/**
 * Waits for Branch SDK to be ready with timeout
 * 
 * Ensures Branch SDK is initialized before attempting to open Branch URLs.
 * 
 * Evidence: Branch readiness check exists in DeepLinkHandler.waitForBranchInitialization (DeepLinkHandler.ts:536-569)
 * This provides a lightweight wrapper for external use.
 * 
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns Promise<boolean> - true if Branch is ready
 */
export async function waitForBranchReady(timeoutMs: number = 5000): Promise<boolean> {
  try {
    const deepLinkHandler = DeepLinkHandler.getInstance();
    // Use existing waitForBranchInitialization method if available
    if (typeof deepLinkHandler.waitForBranchInitialization === 'function') {
      return await deepLinkHandler.waitForBranchInitialization(timeoutMs);
    }

    // Fallback: simple check if Branch SDK is available
    const branch = require('react-native-branch').default;
    return !!(branch && typeof branch.subscribe === 'function');
  } catch (error) {
    console.error('[NotificationHelpers] Error checking Branch readiness:', error);
    return false;
  }
}

