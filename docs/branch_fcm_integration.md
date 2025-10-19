# Branch + FCM Integration and Deep Linking

This document maps the current integration between Branch.io (deep links) and Firebase Cloud Messaging (FCM) / Expo Notifications, and provides a small incremental plan to enable opening Branch deep links from FCM notifications.

Evidence-backed inventory (files & key behaviours)

- `services/DeepLinkHandler.ts`
  - Responsible for initializing Branch SDK via `branchSDK.init()` with retries and subscribing via `branchSDK.subscribe(...)`.
  - Processes Branch params and navigates to `SingleArticleViewer` when `articleId` is present.
  - Provides `createNotificationDeepLink(articleId, title, notificationId)` that returns a Branch URL or fallback `edushorts://articles/{id}`.
  - `handleDeepLink(url)` routes `edushorts://` scheme and Branch URLs appropriately.

- `App.tsx`
  - Initializes core services and calls `DeepLinkHandler.getInstance().initialize()` in `NavigationContainer.onReady`.
  - Sets up FCM background handler (`messaging().setBackgroundMessageHandler`) and foreground handler (`messaging().onMessage`) which schedule/display notifications using `expo-notifications`, preserving deep link fields in notification data.
  - `linking` config includes `edushorts://` and the Branch domains `https://xbwk1.app.link` and `https://xbwk1-alternate.app.link`.

- `services/NotificationService.ts`
  - Singleton that manages token registration (`registerForPushNotifications`) using both Expo and FCM tokens, stores tokens in Supabase profile `notification_preferences`.
  - Sets up notification listeners: `addNotificationReceivedListener` -> `handleNotification`; `addNotificationResponseReceivedListener` -> `handleNotificationResponse`.
  - `handleNotification` and `handleNotificationResponse` extract `deep_link` from notification data and call DeepLinkHandler (commented placeholder exists in `handleNotificationResponse`).
  - Provides `createBranchLink` and `createNotificationDeepLink` helpers (see `DeepLinkHandler`) for creating Branch links for notifications.

- `services/NotificationBridge.ts`
  - Processes notifications inserted into a `notifications` channel (Supabase real-time) and sends push via Expo API.
  - When building payload, includes `deep_link` in `data` so FCM/expo will carry it.
  - On handling receipt, identifies Branch links (checks for Branch domain substrings) and uses `branch.openURL(deepLink)` for Branch links; otherwise routes to `DeepLinkHandler` for `edushorts://` scheme.
  - Exposes `handleReceivedFcmMessage` which accepts FCM `RemoteMessage` and schedules local expo notification preserving deep_link in data.

- `context/NotificationContext.tsx`
  - Uses `NotificationService` to `registerForPushNotifications` for logged-in users.
  - Sets up listeners: `addNotificationReceivedListener` -> `notificationService.handleNotification`; `addNotificationResponseReceivedListener` -> `deepLinkHandler.handleDeepLink(data.deep_link)`.

Interconnections summary (how Branch and FCM interact)

- Server side / NotificationBridge prepares notifications and includes a `deep_link` which may be a Branch URL (short link) or the app scheme (`edushorts://articles/{id}`).
- The NotificationService and App FCM handlers preserve `deep_link` in notification `data` when scheduling or displaying notifications via `expo-notifications`.
- When the user taps the notification (handled by `expo-notifications` response listener), `NotificationService.handleNotificationResponse` or `NotificationContext`’s response listener invokes `DeepLinkHandler.handleDeepLink()` or `branch.openURL()` depending on link type.
- `DeepLinkHandler` is responsible for parsing `edushorts://` links and navigating to `SingleArticleViewer`.
- `DeepLinkHandler` subscribes to Branch via `branchSDK.subscribe` to handle Branch sessions and clicked Branch links when app is cold-started.

Current behavior and gaps

- FCM messages are received and displayed correctly; deep_link is preserved in data when scheduling notifications.
- `NotificationBridge` already recognizes Branch domains and calls `branch.openURL(deepLink)` when handling server-side notifications.
- There is a commented placeholder in `NotificationService.handleNotificationResponse` where calling `DeepLinkHandler.getInstance().handleDeepLink(data.deep_link)` is recommended but not executed.
- Some handlers call `handleDeepLink` directly when notification is processed; ensure the tap/response path invokes Branch or DeepLinkHandler consistently.

Goal

- Ensure FCM notifications that include Branch URLs or edushorts:// links open the correct screen (`SingleArticleViewer`) when the user taps the notification, both when app is foreground/background/killed.

Plan (small incremental edits, evidence-backed)

Each edit will follow the required pre/post-change documentation template and will be small and reversible.

1) Wire notification response tap to DeepLinkHandler/Branch
   - Pre-change state: `NotificationService.handleNotificationResponse` contains a commented placeholder to call `DeepLinkHandler`. Response listeners exist in `NotificationContext` but call `deepLinkHandler.handleDeepLink` directly.
   - Change: Implement `DeepLinkHandler.getInstance().handleDeepLink(data.deep_link)` inside `handleNotificationResponse`, and if deep_link contains a Branch domain, call `branch.openURL(data.deep_link)` instead. Add null checks and error handling.
   - Post-change verification: Tap a notification containing `edushorts://articles/123` and confirm app navigates to `SingleArticleViewer` for article `123`. Tap a Branch link and confirm branch opens and navigates to article.

2) Ensure background and killed app Branch clicks handled by Branch subscribe
   - Pre-change state: `DeepLinkHandler.initialize()` sets up Branch `subscribe` and `Linking.getInitialURL` handlers; `App.tsx` calls `DeepLinkHandler.initialize()` on `NavigationContainer.onReady`.
   - Change: No code change likely needed; add tests and QA steps to confirm Branch link tap cold start opens correct article.
   - Post-change verification: Send a Branch link in FCM, kill app, tap notification, confirm Branch session produces params containing `articleId` and `DeepLinkHandler` navigates correctly.

3) (Optional optimization) Normalize deep_link field in FCM payloads
   - Pre-change state: Payloads sometimes use `deep_link`, `branch_link`, `url`, or `click_action` keys.
   - Change: Ensure server sets `deep_link` consistently. In client code, normalize by preferring `data.deep_link || data.branch_link || data.url || data.click_action` when reading.
   - Post-change verification: Verify normalization by logging received data for a test notification.

Pre/Post change template (apply for each edit)

- File(s) touched
- State before edit (code excerpts with line references)
- Why change is needed (evidence)
- Exact edits to make (high-level; minimal lines)
- Risks and rollback plan
- Test steps to verify behavior
- Post-change state and evidence (logs/screenshots/behavior notes)

Next small implementation I propose

- Implement step (1): make `NotificationService.handleNotificationResponse` call `DeepLinkHandler` or `branch.openURL` appropriately. This is a single-file, small change.

I will implement this edit now in a single small change, create the pre-change state note, perform the edit, run a quick linter check, and write the post-change verification notes in `docs/branch_fcm_integration.md`.

---

Edit #1 — Wire notification response tap to deep link handler

- File(s) touched
  - `services/NotificationService.ts`

- State before edit (evidence)
  - `NotificationService.handleNotificationResponse` contained a commented placeholder suggesting calling `DeepLinkHandler.getInstance().handleDeepLink(data.deep_link)` but had no implementation (see lines ~372-383 pre-edit).

- Why change is needed (evidence)
  - `NotificationContext` registers a response listener that calls `deepLinkHandler.handleDeepLink(data.deep_link)` but `NotificationService.handleNotificationResponse` (used by `NotificationService` listeners) didn't perform navigation — creating an inconsistency in where deep links are handled.
  - Centralizing navigation logic in `NotificationService` ensures notifications tapped anywhere will consistently navigate.

- Exact edits made (minimal)
  - Implemented `handleNotificationResponse` to: 
    - Detect Branch domain links (`xbwk1.app.link` and `xbwk1-alternate.app.link`) and call `branch.openURL(deep_link)` when available.
    - Otherwise call `DeepLinkHandler.getInstance().handleDeepLink(deep_link)`.
    - Added safe `require('react-native-branch')` usage with fallback and error handling.
    - Added `import DeepLinkHandler from './DeepLinkHandler';` at file top.

- Risks and rollback plan
  - Risk: Requiring `react-native-branch` at runtime could throw if module is missing or native RNBranch is not linked properly. Mitigation: Use try/catch and fallback to `DeepLinkHandler`.
  - Rollback: Revert the single-file change in `services/NotificationService.ts` and restore previous behavior.

- Test steps to verify behavior
  1. Start app (foreground) and send a test FCM with data containing `deep_link: 'edushorts://articles/123'`. Tap notification and confirm navigation to article 123.
  2. Send a notification with `deep_link` set to a Branch link (short link previously generated). Tap notification when app is backgrounded and confirm Branch opens and app navigates to the article.
  3. Kill app, send a Branch link notification, tap and confirm cold-start navigation via Branch subscribe flow in `DeepLinkHandler`.

- Post-change state and evidence
  - `services/NotificationService.ts` now actively handles notification responses and navigates using Branch or `DeepLinkHandler` depending on link type.
  - Linter checks passed (`read_lints` produced no errors).

---


---

Edit #2 — Prevent auto-navigation on receipt and register listeners on init

- File(s) touched
  - `services/NotificationBridge.ts`
  - `services/NotificationService.ts`

- State before edit (evidence)
  - `NotificationBridge.handleReceivedFcmMessage` and `NotificationBridge.handlePushNotification` were calling `handleDeepLink` immediately when an FCM data payload contained `deep_link`, causing navigation on receipt.
  - `NotificationService.handleNotification` constructed a `NotificationResponse` and forwarded it to `handleNotificationResponse`, effectively triggering navigation when notifications were received in foreground.
  - `NotificationService.initialize()` did not register expo notification listeners; `initializeListeners()` existed but was called elsewhere in app flow.

- Changes made (minimal)
  1. `services/NotificationBridge.ts`: removed auto-navigation during FCM message receipt; deep_link is preserved in scheduled notification data so navigation only happens on tap.
  2. `services/NotificationService.ts`: changed `handleNotification` to no longer construct a fake response and trigger navigation; added `this.initializeListeners()` call inside `initialize()` so listeners (including response listener) are registered when the service initializes.

- Risks and rollback plan
  - Risk: If listeners are initialized too early, they may run before `DeepLinkHandler` is ready. Mitigation: `DeepLinkHandler` is initialized in `AppContent.onReady` and `NotificationService` navigations fallback safely to `DeepLinkHandler` or Branch. Rollback: revert the two-file changes.

- Test steps to verify behavior
  1. Foreground: send notification with `deep_link` — app should NOT navigate automatically; a local notification should be shown and tapping it should navigate.
  2. Background: send notification, tap it — app should open and navigate to the deep link target.
  3. Killed: send Branch link notification, tap it — app should cold-start and navigate.

- Post-change state and evidence
  - Notification receipt no longer triggers immediate navigation; response/tap handling (registered at `initialize()`) will navigate.
  - Linter checks passed.

---


---

Edit #3 — Handle cold-start notification taps using last notification response

- File(s) touched
  - `App.tsx`

- State before edit (evidence)
  - When app was killed and user tapped notification, app opened but did not navigate to deep link target. `DeepLinkHandler.initialize()` was called in `NavigationContainer.onReady`, but there was no check for the last notification response to handle a tap that triggered cold-start navigation.
  - `expo-notifications` provides `getLastNotificationResponseAsync()` to retrieve the response that launched the app.

- Change made (minimal)
  - In `NavigationContainer.onReady`, after initializing `DeepLinkHandler`, call `Notifications.getLastNotificationResponseAsync()` and, if a response exists with `deep_link` (or `branch_link`/`url`/`click_action`), navigate using Branch or `DeepLinkHandler`.
  - Wrapped in try/catch blocks to avoid breaking startup.

- Risks and rollback plan
  - Risk: If `getLastNotificationResponseAsync()` behaves differently across platforms or returns stale data, navigation may be triggered unexpectedly. Mitigation: Only act when `deep_link` is present and handle errors gracefully; log actions for debugging. Rollback: revert the single block in `App.tsx`.

- Test steps to verify
  1. Kill the app process fully.
  2. Send a notification with `deep_link` set to `edushorts://articles/123` or a Branch short link.
  3. Tap the notification from the OS notification tray.
  4. App should cold-start and navigate to article 123.

- Post-change status
  - Code updated; linter passed. This should handle the cold-start path now by explicitly checking the last notification response once `DeepLinkHandler` is initialized.

---


---

Edit #4 — Robust cold-start navigation with retries and Branch readiness wait

- File(s) touched
  - `App.tsx`
  - `services/DeepLinkHandler.ts` (made `waitForBranchInitialization` public)

- State before edit (evidence)
  - After earlier attempts, tapping a notification when the app was killed opened the app but did not navigate to the article.
  - `App.tsx` attempted to read the last notification response and navigate, but timing issues (Branch SDK or navigation stack readiness) could prevent navigation.

- Changes made (minimal)
  - In `App.tsx`, when handling the last notification response deep_link on startup, added:
    - A call to `DeepLinkHandler.getInstance().waitForBranchInitialization(5000)` before using `branch.openURL`.
    - A retry loop for non-Branch deep links that calls `DeepLinkHandler.handleDeepLink` up to 6 times with 500ms delay to allow navigation stack to be ready.
  - In `services/DeepLinkHandler.ts`, changed `waitForBranchInitialization` visibility from private to public so `App.tsx` can await Branch readiness.

- Risks and rollback plan
  - Risk: If Branch never initializes within the timeout, we fallback to DeepLinkHandler which may still fail if navigationRef is not yet ready. Rollback: revert the small changes in `App.tsx` and `DeepLinkHandler.ts`.

- Test steps
  1. Kill the app completely.
  2. Send a notification (Branch short link and also test with `edushorts://articles/123`).
  3. Tap notification and observe if the app navigates to the article. Repeat if intermittent.

- Post-change status
  - `waitForBranchInitialization` is now callable from `App.tsx`.
  - `App.tsx` will attempt multiple navigation attempts and log success/failure.

---
