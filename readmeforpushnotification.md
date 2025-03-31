# README: Push Notification Implementation

## 1. Goal

The objective of this task is to implement a complete, end-to-end push notification system for the EduShorts application. This will allow notifications created via the external admin panel to be delivered to users of the React Native mobile app (`c:/a0 edushorts/a0-project`) using the Expo Push Notification service, triggered by Supabase backend logic.

## 2. Current System Status & Findings (Summary)

Our investigation revealed the following about the current state:

*   **External Admin Panel:** Successfully creates and schedules notification *records* in the Supabase `notifications` table. However, it lacks the logic to actually *send* push notifications.
*   **Supabase Database (`public` schema):**
    *   The `notifications` table exists to log notification content, scheduling, and status (like `sent_at`), but **does not** store device-specific push tokens (`ExpoPushToken`).
    *   The `profiles` table stores user information and preferences but also **does not** currently have a column to store the `ExpoPushToken`.
    *   Row Level Security (RLS) policies on `profiles` allow users to update their own profiles, which *should* be sufficient for saving the push token once the column is added. The backend function, using `service_role`, will bypass RLS for reading tokens.
*   **React Native Mobile App (`c:/a0 edushorts/a0-project`):**
    *   The core application structure (`App.tsx`) **does not** currently include the necessary code from `expo-notifications` to:
        *   Request push notification permissions from the user.
        *   Retrieve the unique `ExpoPushToken` for the device.
        *   Send this token to the backend to be stored.
        *   Handle incoming notifications (displaying them or reacting to user taps).
*   **Conclusion:** The push notification system is currently **incomplete**. While the admin panel can create notification entries, the mobile app isn't set up to register for or receive notifications, and the backend lacks the mechanism to store tokens and send messages via Expo's service.

## 3. Chosen Approach: Expo Push Notifications

We will use the **Expo Push Notification** service (`expo-notifications` library) for implementation. This approach was chosen because:

*   It integrates well with the existing Expo project structure and EAS (Expo Application Services).
*   EAS simplifies the management of platform credentials (FCM for Android, APNS for iOS).
*   It provides a unified API for cross-platform development.
*   The core sending service provided by Expo (relaying to FCM/APNS) is free.

## 4. Implementation Plan Overview

A detailed, phased implementation plan is documented in `tasks.md`. The key phases involve:

1.  **Database Modification:** Adding a `push_token` column to the `public.profiles` table.
2.  **Mobile App Implementation:** Adding permissions requests, token retrieval/storage, and notification handlers using `expo-notifications` (on a dedicated Git branch).
3.  **Backend Sending Logic:** Creating a Supabase Edge Function triggered by database webhooks and/or cron jobs to fetch tokens and send notifications via the Expo Push API.
4.  **Configuration & Testing:** Verifying Expo/EAS settings and performing thorough end-to-end testing.

**Refer to `tasks.md` for the complete step-by-step plan, including potential problems, solutions, verification steps, and rollback procedures for each phase.**

## 5. Critical Considerations & Caution

*   **Extreme Caution Required:** Implementing changes, especially to the database and backend, requires careful execution. Proceed step-by-step.
*   **No Automated Backups:** We are operating on the Supabase free tier, which does not include automated point-in-time recovery backups. While the planned database change (adding one column) is minimal and reversible, any unforeseen issues could be harder to recover from. Manual schema snapshots are recommended but do not back up data.
*   **Verify Each Step:** Do not proceed to the next step until the current one is confirmed successful and working as expected. Check logs, database state, and app behavior frequently during development and testing.

## 6. Safety Measures & Rollback Plan

To mitigate risks, the following safety measures are integrated into the plan (`tasks.md` has specifics):

*   **Git Branching (Mobile App):** All mobile app code changes will occur on a separate branch (`feature/push-notifications`). This allows easy reversion by simply discarding the branch.
*   **Manual Schema Snapshot:** Manually save the `profiles` table definition before modification.
*   **Minimal Database Change:** The only direct database schema change is adding one nullable `TEXT` column, which is easily reversible (`DROP COLUMN`).
*   **Additive Backend Logic:** The Supabase Function and triggers are new additions and can be deleted without affecting existing functionality if issues arise.
*   **Phased Rollback:** Each phase in `tasks.md` includes specific instructions on how to undo the changes made in that phase.

By following the plan cautiously and verifying each step, we aim to implement this feature safely and effectively.
