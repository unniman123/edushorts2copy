# Comprehensive Plan: Implementing Expo Push Notifications

**Overall Goal:** Enable sending push notifications from the external admin panel to users of the React Native mobile app (`c:/a0 edushorts/a0-project`) via Expo Push Notifications, triggered by actions in the Supabase backend.

**Guiding Principles:**

*   **Safety First:** Minimize disruption to existing functionality. Use branching and have clear rollback paths. Prioritize caution due to lack of automated backups on the free tier.
*   **Simplicity:** Encapsulate logic where possible. Start with core functionality.
*   **Leverage Existing Tools:** Utilize Expo, EAS, and Supabase features effectively.
*   **Verification:** Continuously verify each step before proceeding to the next.

---

## **Phase 0: Preparation & Safety**

1.  **Create Development Branch (Mobile App):**
    *   **Action:** In the `c:/a0 edushorts/a0-project` directory, create a new Git branch specifically for this feature (e.g., `feature/push-notifications`). All mobile app code changes will occur on this branch.
    *   **Command:** `git checkout -b feature/push-notifications` (assuming you're on the main branch).
    *   **Purpose:** Isolates development work, allowing easy rollback by simply discarding the branch or switching back to the main branch.
    *   **Verification:** Confirm the new branch is created and checked out.
2.  **Manual Schema Snapshot (Supabase):**
    *   **Action:** Manually copy the "Create Table" SQL script for the `public.profiles` table from the Supabase Dashboard (Database -> Tables -> profiles -> Definition). Save this script locally.
    *   **Purpose:** Preserves the exact table structure *before* any changes, providing a reference point. This is **not** a data backup.
    *   **Verification:** Confirm the schema script is saved.

---

## **Phase 1: Database Schema Modification (Supabase Backend)**

1.  **Add `push_token` Column:**
    *   **Action:** Add a new column named `push_token` to the `public.profiles` table. This column will store the `ExpoPushToken` string.
    *   **Data Type:** `TEXT`. It must be nullable (`NULL`) initially.
    *   **SQL (Example):**
        ```sql
        -- Add the column
        ALTER TABLE public.profiles
        ADD COLUMN push_token TEXT NULL;

        -- Add a comment for clarity
        COMMENT ON COLUMN public.profiles.push_token IS 'Stores the Expo Push Token for the user device.';
        ```
    *   **Implementation:** Apply this change cautiously using a Supabase migration file (preferred) or directly via the Supabase SQL Editor.
    *   **Potential Problem:** Migration script error or typo.
    *   **Solution:** Double-check the SQL syntax. Execute carefully.
    *   **Verification:** Confirm the `push_token` column exists in the `profiles` table structure via the Supabase dashboard. Confirm it is nullable.
2.  **Rollback Plan (Database - Phase 1):**
    *   **Action:** Execute the reverse SQL migration if needed immediately after adding the column.
    *   **SQL (Example):**
        ```sql
        ALTER TABLE public.profiles
        DROP COLUMN IF EXISTS push_token;
        ```
    *   **Verification:** Confirm the column is removed via the Supabase dashboard.

---

## **Phase 2: Mobile App Implementation (React Native Frontend)**

*(All changes on the `feature/push-notifications` branch)*

1.  **Install Dependencies:**
    *   **Action:** Add the necessary Expo libraries.
    *   **Command:** `npx expo install expo-notifications expo-device expo-constants`
    *   **Verification:** Check `package.json` and `package-lock.json` for successful installation. Run `npm install` or `yarn install` if needed.
2.  **Create Push Notification Hook/Service:**
    *   **Action:** Create a new file (e.g., `hooks/usePushNotifications.ts`) to encapsulate push notification logic.
    *   **Purpose:** Organization, reusability.
    *   **Verification:** File exists in the project structure.
3.  **Implement Permission Request Logic:**
    *   **Action:** Inside the hook/service, create `requestPermissionsAsync` using `Notifications.requestPermissionsAsync()`. Handle granted/denied states. Plan to call this after successful login.
    *   **Potential Problem:** User denies permission.
    *   **Solution:** Store preference (e.g., local storage or `profiles.notification_preferences`), provide UI feedback, avoid repeated prompts unless user-initiated.
    *   **Verification:** Test the permission prompt appears correctly on development builds.
4.  **Implement Token Retrieval & Storage:**
    *   **Action:** Create `registerForPushNotificationsAsync` in the hook/service.
        *   Check permissions (`Notifications.getPermissionsAsync()`). Request if needed.
        *   Get `projectId` (`Constants...projectId`). Handle missing ID.
        *   Get token (`Notifications.getExpoPushTokenAsync({ projectId })`).
        *   Get user ID (`supabase.auth.user()?.id`).
        *   If token and user ID exist, update Supabase: `supabase.from('profiles').update({ push_token: tokenString }).eq('id', userId)`.
        *   Add error handling (logging, potential retry flags).
    *   **Potential Problem:** Errors getting token or saving to Supabase. RLS issues (though analysis suggests existing policy should work).
    *   **Solution:** Robust error logging. Implement retry logic if appropriate. Verify RLS allows the update during testing.
    *   **Verification:** Use development builds on devices. After login, check the Supabase `profiles` table to confirm the `push_token` column is populated for the test user. Check logs for errors.
5.  **Implement Token Update Logic:**
    *   **Action:** Ensure `registerForPushNotificationsAsync` is called on app startup (after login) to handle potential token changes.
    *   **Verification:** Test by reinstalling the app or clearing data; verify the token is re-registered on next login.
6.  **Implement Notification Handlers:**
    *   **Action:** Set up listeners in the hook/service:
        *   `Notifications.setNotificationHandler({...})` (foreground handling).
        *   `Notifications.addNotificationReceivedListener(notification => {...})` (optional foreground logic).
        *   `Notifications.addNotificationResponseReceivedListener(response => {...})` (handle user taps, use `response.notification.request.content.data` for navigation).
    *   **Verification:** Test receiving notifications while app is foregrounded, backgrounded, and closed. Test tapping notifications triggers correct navigation/action.
7.  **Integrate Hook/Service:**
    *   **Action:** Call the initialization function from the hook/service in a top-level component after login (e.g., `App.tsx`'s authenticated stack).
    *   **Verification:** Confirm the registration logic runs after login by checking logs or database entries.
8.  **Rollback Plan (Mobile App - Phase 2):**
    *   **Action:**
        *   Checkout the previous branch: `git checkout main` (or primary branch).
        *   Delete the feature branch: `git branch -D feature/push-notifications`.
        *   Uninstall dependencies: `npm uninstall expo-notifications expo-device expo-constants` (or revert `package.json` changes).
    *   **Verification:** Confirm codebase is back to the pre-feature state.

---

## **Phase 3: Backend Sending Logic (Supabase Function)**

1.  **Choose & Plan Trigger Mechanism:**
    *   **Decision:** Use both Database Webhooks (for immediate sends) and Cron Jobs (for scheduled sends).
    *   **Webhook Plan:** Trigger on `INSERT` into `public.notifications`.
    *   **Cron Job Plan:** Run periodically (e.g., every minute) to check for due scheduled notifications (`scheduled_for <= now()` and `sent_at IS NULL`).
2.  **Create Supabase Edge Function:**
    *   **Action:** Create a new Edge Function (e.g., `send-push-notification`). Ensure it's configured to use the `service_role` key to bypass RLS for reading tokens.
    *   **Verification:** Function exists in Supabase project. Check function settings for `service_role` usage.
3.  **Implement Function Logic (`send-push-notification`):**
    *   **Action:** Implement incrementally:
        *   Parse input (webhook payload or queried data).
        *   Fetch target `push_token`s from `profiles` based on `target_audience`, filtering `NULL` tokens.
        *   Chunk tokens (e.g., 100 per batch).
        *   For each chunk, format Expo API payload (`to`, `title`, `body`, `data`).
        *   Call Expo Push API (`POST https://exp.host/--/api/v2/push/send`).
        *   Handle Expo API responses (success, errors like `DeviceNotRegistered`). Log results.
        *   Update `sent_at` (and potentially a `status`) in the `notifications` table upon completion/failure.
        *   Implement robust error handling and logging throughout.
    *   **Potential Problem:** Function timeouts, Expo API errors/rate limits, incorrect token fetching logic, `DeviceNotRegistered` errors.
    *   **Solution:** Optimize queries, implement chunking correctly, add retry logic for transient Expo errors, log persistent errors, consider removing/flagging invalid tokens based on `DeviceNotRegistered` feedback.
    *   **Verification:** Test function locally if possible. Test by manually invoking with sample data. Check function logs in Supabase dashboard. Verify `notifications` table status is updated correctly.
4.  **Configure Triggers:**
    *   **Action:** Only after the function is tested, configure the Database Webhook and the Cron Job schedule (`pg_cron`).
    *   **Verification:** Test that inserting a notification triggers the webhook/function. Test that a scheduled notification triggers the function via the cron job at the correct time. Check trigger/function logs.
5.  **Rollback Plan (Backend Function - Phase 3):**
    *   **Action:**
        *   Delete the Edge Function.
        *   Delete the Database Webhook configuration.
        *   Disable/delete the Cron Job schedule (`SELECT cron.unschedule(...)`).
    *   **Verification:** Confirm function, webhook, and cron job are removed/disabled via Supabase dashboard/CLI.

---

## **Phase 4: Admin Panel Changes**

1.  **Initial Implementation:** No changes required.
2.  **Future Enhancements (Optional):** Consider displaying send status (`sent_at`, `status`) fetched from the `notifications` table.
3.  **Rollback Plan (Admin Panel):** Not applicable if no changes are made.

---

## **Phase 5: Expo / EAS Configuration**

1.  **Verify `projectId`:**
    *   **Action:** Double-check `app.json` / `app.config.js` for the correct Expo Project ID (`expo.extra.eas.projectId` or `expo.eas.projectId`).
    *   **Verification:** Confirm ID is present and correct.
2.  **Verify EAS Credentials:**
    *   **Action:** Run `eas credentials` in the mobile app project. Verify valid FCM Server Key (Android) and APNS Key (iOS) are configured for relevant build profiles.
    *   **Potential Problem:** Missing/expired credentials.
    *   **Solution:** Follow `eas credentials` prompts or `docs/push-notification.md` to configure.
    *   **Verification:** `eas credentials` shows valid credentials associated with the project.
3.  **Rollback Plan (EAS):** No action needed unless credentials need explicit revocation (`eas credentials`).

---

## **Phase 6: Testing Strategy**

1.  **Component/Function Testing:** Test mobile app hooks/services and the backend function in isolation where possible.
2.  **Development Build End-to-End:** Use `eas build --profile development` on physical devices.
    *   Verify permissions flow.
    *   Verify token registration in Supabase `profiles` table.
    *   Trigger immediate notifications via admin panel -> verify receipt (foreground, background, killed) & tap interaction.
    *   Trigger scheduled notifications -> verify receipt at the correct time.
    *   Check mobile app logs and Supabase function logs for errors.
    *   Verify `notifications` table status updates.
3.  **Staging/Production Testing:** Repeat end-to-end tests with builds pointing to the appropriate backend environment before final release.

---
