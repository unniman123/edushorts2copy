# Refactoring and Deep Link Debugging Summary

This document summarizes the refactoring efforts, code changes, and testing strategies employed to address an issue with Branch.io deep link navigation.

## 1. Files Involved

The following files were central to this session:

*   **`services/DeepLinkHandler.ts`**: The primary file modified. This service handles the generation and processing of deep links, including Branch.io integration.
*   **`jest.config.js`**: Temporarily modified during attempts to run Jest tests. Changes were reverted.
*   **`__tests__/services/DeepLinkHandler.test.ts`**: A Jest test script created to unit test `DeepLinkHandler.ts`. This file was subsequently deleted when Jest tests were skipped.

## 2. Summary of Refactoring and Changes

**Goal:** To resolve an issue where Branch.io deep links, when clicked by a user with the app already installed, would navigate to a default article (e.g., the first one) instead of the specific article shared in the link.

**Core Changes in `services/DeepLinkHandler.ts`:**

*   **Improved `articleId` Extraction:** The logic for extracting the `articleId` from the parameters (`params`) received in the Branch SDK's `subscribe` callback was made more robust. It now checks multiple potential locations:
    *   `params.articleId` (direct key)
    *   `params.article_id` (alternative direct key)
    *   `params.data?.articleId` (nested under a `data` object, a common pattern for Branch control parameters)
*   **Enhanced Logging:**
    *   Added a `console.log` statement to output the full URI and the `params` object received from Branch upon a deep link event. This is crucial for debugging the exact structure of the data being passed.
    *   Improved the warning message logged when navigation to an article fails, now including the (potentially null) `articleId` and the full `params` object.
    *   Added a log statement for events that are not Branch link clicks or where `params` are missing.
*   **Type Safety for Navigation:** Ensured that the `articleId` passed to the navigation function (`this.navigationRef.current.navigate`) is explicitly cast to a string (`String(articleId)`).

## 3. Specific Edits Made

### `services/DeepLinkHandler.ts`

Within the `branchSDK.subscribe` callback in the `setupDeepLinkListeners` method:

1.  **Added comprehensive logging for incoming Branch parameters:**
    ```typescript
    // Log the received params for debugging
    console.log('Branch event received. URI:', uri, 'Params:', JSON.stringify(params, null, 2));
    ```

2.  **Modified `articleId` extraction logic:**
    ```diff
    - const articleId = params.articleId || params.article_id || null;
    + // Check common locations: directly in params, or nested under 'data'
    + const articleId = params.articleId || params.article_id || params.data?.articleId || null;
    ```

3.  **Ensured `articleId` is a string for navigation and updated warning log:**
    ```diff
    if (articleId && this.navigationRef?.current && typeof this.navigationRef.current.navigate === 'function') {
      console.log('Navigating to article via Branch deep link:', articleId);
      this.navigationRef.current.navigate('ArticleDetail', { 
    -   articleId,
    +   articleId: String(articleId), // Ensure articleId is a string
        branch: true // Flag to indicate this came from a Branch link
      });
    } else {
    - console.warn('Cannot navigate to article: Navigation reference not properly set or articleId missing');
    + console.warn('Cannot navigate to article: Navigation reference not properly set or articleId missing. articleId:', articleId, 'Params:', params);
    }
    ```
4.  **Added logging for non-Branch link events:**
    ```typescript
    } else {
      // This 'else' corresponds to the `if (params && params['+clicked_branch_link'])`
      console.log('Not a Branch link click event or params missing. Params:', params);
    }
    ```

### `jest.config.js` (Temporary Edits - Reverted)

1.  Commented out `testEnvironment: 'jsdom'`.
2.  Commented out `'./jest.setup.js'` from the `setupFiles` array.
3.  **Both of these changes were reverted to the file's original state.**

### `__tests__/services/DeepLinkHandler.test.ts`

*   This file was created with a comprehensive Jest test suite including mocks for `react-native-branch` and `expo-linking`.
*   **This file was deleted** as per the decision to skip Jest testing for this session.

## 4. Testing Strategies

### Initial Diagnostic Plan:
*   Searched for `Branch.subscribe` to locate deep link handling.
*   Planned to examine link generation and navigation logic.

### Code Analysis:
*   Reviewed `services/DeepLinkHandler.ts`, focusing on `setupDeepLinkListeners` (for processing incoming links) and `createBranchLink` (for generating shareable links).
*   The hypothesis formed was that the `articleId` was not being correctly extracted from the Branch parameters upon link opening.

### Unit Testing (Attempted and Skipped):
*   A Jest test script (`__tests__/services/DeepLinkHandler.test.ts`) was developed to:
    *   Mock `react-native-branch` and `expo-linking` dependencies.
    *   Verify that `createBranchLink` correctly embedded `articleId` into link parameters.
    *   Simulate Branch deep link events within `setupDeepLinkListeners` to test `articleId` extraction from various potential locations in the `params` object (e.g., `params.articleId`, `params.data.articleId`).
    *   Assert that `navigationRef.current.navigate` was called with the correct screen and parameters.
*   **Execution Issues:**
    *   Running the Jest tests resulted in a persistent `TypeError: Object.defineProperty called on non-object` error, originating from `node_modules/jest-expo/src/preset/setup.js`.
*   **Troubleshooting Steps for Jest Error (Unsuccessful):**
    1.  Ensured `jest.config.js` used the `jest-expo` preset.
    2.  Modified `jest.config.js` to comment out `testEnvironment: 'jsdom'`, letting `jest-expo` manage the environment.
    3.  Modified `jest.config.js` to comment out the custom `./jest.setup.js` file to isolate potential conflicts.
    *   The error persisted through these changes.
*   **Decision:** Due to the Jest environment issues, unit testing was skipped for this session.

### Manual Testing & Debugging (Recommended):
*   The primary recommended approach became building the application with the changes in `services/DeepLinkHandler.ts`.
*   **ADB Logcat:** It was advised to use ADB logcat for debugging on an Android device if the issue persisted after the changes. The command `adb logcat ReactNativeJS:S *:E` (or similar) would allow inspection of `console.log` outputs from the JavaScript code, particularly the `Branch event received. Params:` log, to understand the exact structure of data Branch is passing to the app.

This summary covers the main activities and outcomes of the session. The key change in `services/DeepLinkHandler.ts` should provide more robust deep link handling and better diagnostic information. 