# Branch.io Deep Linking Integration Plan

This document outlines the steps to integrate Branch.io for deep linking in the Edushorts React Native application, replacing the previous microsite-based solution.

## Phase 1: Setup & Configuration (User Actions)

1.  **Sign Up for Branch.io:**
    *   Go to [Branch.io](https://branch.io/) and create a free account.
2.  **Configure App in Branch Dashboard:**
    *   Log in to your Branch dashboard.
    *   Navigate to **Configuration -> App Settings**.
    *   Add your app details:
        *   App Name: Edushorts
        *   Android Package Name: `com.ajilkojilgokulravi.unniman`
        *   iOS Bundle ID: (Enter if you have an iOS app)
    *   Add **Android Signing Certificate Fingerprints (SHA-256)**:
        *   Go to **Configuration -> Link Settings -> Android**.
        *   Add your **Debug/Development** fingerprint (obtain using `cd android && ./gradlew signingReport`).
        *   Add your **Production/Release** fingerprint (obtain from your release keystore or Google Play Console App Signing section).
    *   Configure **Link Domain**:
        *   Go to **Configuration -> Link Settings -> Link Domain**.
        *   Note down the default Branch domain provided (e.g., `yourapp.app.link`) or configure a custom subdomain if desired. This will be used in your app configuration.
3.  **Get Branch Keys:**
    *   Go to **Configuration -> Account Settings -> App Keys**.
    *   Note down your **Branch Key** and **Branch Secret** for both **Live** and **Test** environments.

**Action Required:** Complete these steps in the Branch.io dashboard before proceeding to Phase 2.

## Phase 2: React Native App Integration (Cline Actions)

4.  **Install Branch SDK:**
    *   Add the `react-native-branch` package to the project.
    *   Command: `npm install react-native-branch --save` or `yarn add react-native-branch`
5.  **Configure Native Projects:**
    *   **Android:**
        *   Modify `android/app/src/main/AndroidManifest.xml`: Add Branch key metadata and intent filters for the Branch link domain. Remove old intent filters for `edushortlinks.netlify.app`.
        *   Modify `android/app/build.gradle` if necessary for SDK integration.
    *   **iOS:** (If applicable)
        *   Modify `ios/YourApp/Info.plist`: Add Branch key and configure Associated Domains with the Branch link domain.
        *   Modify `ios/YourApp/AppDelegate.m` or `AppDelegate.swift`: Add Branch initialization code.
    *   **Expo Config (`app.config.js`):**
        *   Add Branch keys to `extra` or use the `expo-branch` config plugin (if using Expo managed workflow or EAS Build).
        *   Remove old `intentFilters` related to the microsite.
6.  **Initialize Branch SDK:**
    *   In `App.tsx`, import `react-native-branch`.
    *   Add initialization logic, likely within a `useEffect` hook in `AppContent` or the main `App` component.
7.  **Handle Incoming Deep Links:**
    *   Implement `branch.subscribe` listener in `App.tsx` or a dedicated navigation handler.
    *   Inside the listener:
        *   Check `params` for deep link data (e.g., `params['articleId']`).
        *   Check `params['+clicked_branch_link']` to confirm it's a Branch link.
        *   If `articleId` exists, use `react-navigation` to navigate to `ArticleDetailScreen`.
        *   Handle potential errors (`error` object in the callback).
8.  **Generate Branch Links for Sharing:**
    *   Modify `components/NewsCard.tsx` (or the relevant sharing component).
    *   Import Branch methods (`BranchUniversalObject`, `showShareSheet`).
    *   When sharing:
        *   Create a `BranchUniversalObject` with article metadata (canonicalIdentifier, title, contentDescription, imageUrl, contentMetadata: { articleId: article.id }).
        *   Define link properties (e.g., { channel: 'whatsapp', feature: 'sharing' }).
        *   Call `branchUniversalObject.showShareSheet(shareOptions, linkProperties)` to generate and share the Branch link.
9.  **Cleanup Old Configuration:**
    *   Ensure all references to `edushortlinks.netlify.app` and the old custom scheme logic (`edushort://`) related to deep linking are removed from `app.config.js`, `AndroidManifest.xml`, and `App.tsx` linking configuration.

## Phase 3: Testing

10. **Test Link Generation:** Verify that sharing an article now generates a Branch domain link.
11. **Test Deep Linking (App Installed):**
    *   Click a generated Branch link on a device with the app installed.
    *   Expected: App opens directly to the corresponding `ArticleDetailScreen`.
12. **Test Store Redirect (App Not Installed):**
    *   Uninstall the app.
    *   Click a generated Branch link.
    *   Expected: Redirects to the Google Play Store page for the app.
13. **Test Deferred Deep Linking:**
    *   Click a generated Branch link with the app uninstalled.
    *   Install the app from the Play Store via the redirect.
    *   Open the app for the first time *after* installation.
    *   Expected: App opens and navigates directly to the corresponding `ArticleDetailScreen`.

**Next Step:** Please complete Phase 1 and provide the Branch Keys and your chosen Branch Link Domain.
