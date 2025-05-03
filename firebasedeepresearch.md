Perfect! I’ll create a complete, up-to-date, Expo SDK 52-specific Firebase integration guide for your React Native project using a custom dev client. It will cover Firebase Analytics, A/B Testing, In-App Messaging, Crashlytics, Remote Config, App Check, Performance Monitoring, and Cloud Messaging.

The guide will include step-by-step installation, setup instructions, copy-paste ready TypeScript code snippets, package versions, EAS build notes, common issues and troubleshooting steps, and clear tables where needed.

I'll get started and update you as soon as it's ready!

# Firebase Services Integration in Expo (SDK 52) with EAS Build

This guide shows how to integrate **Firebase Analytics**, **A/B Testing (via Remote Config)**, **In-App Messaging**, **Crashlytics**, **Remote Config**, **App Check**, **Performance Monitoring**, and **Cloud Messaging** into an Expo SDK 52 project (React Native 0.76.7) using a **custom dev client** and **EAS Build**. We assume **Firebase is initialized** (i.e. `GoogleService-Info.plist` and `google-services.json` are in place). The app uses Supabase for auth/DB and Expo Notifications for push, but we’ll add React Native Firebase for the above services.  

> **Prerequisites:**  
>- **Expo SDK 52 / RN 0.76.7** installed and configured (see [Expo docs](https://docs.expo.dev/versions/latest/)).  
>- **expo-dev-client**: Needed to use native code (install via `npx expo install expo-dev-client`) ([Using Firebase - Expo Documentation](https://docs.expo.dev/guides/using-firebase/#:~:text=Since%20React%20Native%20Firebase%20requires,without%20writing%20native%20code%20yourself)).  
>- **React Native Firebase App module**: Install core with `npx expo install @react-native-firebase/app` ([Using Firebase - Expo Documentation](https://docs.expo.dev/guides/using-firebase/#:~:text=)). This adds native dependencies via Expo config plugins.  
>- **EAS CLI**: Use for building custom development clients and production binaries.  
>- **Google service files**: Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are correctly referenced in `app.json` (see example below).  
>- **expo-build-properties** (optional): For iOS, enable `useFrameworks: "static"` to avoid Swift linking issues (particularly for Crashlytics) ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=%22plugins%22%3A%20%5B%20%22%40react,static)).  

After installing, use **EAS Build** to generate a custom dev client (no need to run locally on Expo Go). In your `app.json` (or `app.config.js`), configure the Google files and plugins. For example:  

```jsonc
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "sdkVersion": "52.0.0",
    "ios": {
      "bundleIdentifier": "com.example.myapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.example.myapp",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/analytics",
      "@react-native-firebase/remote-config",
      "@react-native-firebase/in-app-messaging",
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/app-check",
      "@react-native-firebase/perf",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

This example shows enabling the **App**, **Analytics**, **Remote Config**, **In-App Messaging**, **Crashlytics**, **App Check**, **Performance**, and **Messaging** modules via Expo config plugins ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=The%20following%20is%20an%20example,change%20to%20match%20your%20own)) ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=%22plugins%22%3A%20%5B%20%22%40react,static)). *Only list a module in `plugins` if it has native setup steps; others work out-of-the-box.* The `expo-build-properties` plugin ensures `use_frameworks` is set for iOS (needed by Firebase SDKs) ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=%22plugins%22%3A%20%5B%20%22%40react,static)).  

> **Dependency Versions:** The latest **React Native Firebase** modules (v22.x) are recommended. For Expo SDK 52 (RN 0.76.7), use packages: `@react-native-firebase/app@^22.0.0`, and similarly `analytics`, `remote-config`, `in-app-messaging`, `crashlytics`, `app-check`, `perf`, `messaging` all at `^22.0.0`. Ensure React Native CLI autolinking is supported (Expo 52 does).  

## 1. Firebase Analytics

**Purpose:** Track user behavior and custom events.  

**Installation:**  
- Run: `npx expo install @react-native-firebase/analytics` (after installing `@react-native-firebase/app`) ([Analytics | React Native Firebase](https://rnfirebase.io/analytics/usage#:~:text=,firebase%2Fapp)) ([Using Firebase - Expo Documentation](https://docs.expo.dev/guides/using-firebase/#:~:text=)).  
- In `app.json` plugins, include `"@react-native-firebase/analytics"` along with `@react-native-firebase/app` ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=The%20following%20is%20an%20example,change%20to%20match%20your%20own)).  

**Expo/EAS Notes:**  
- Analytics requires no extra native config beyond the plugin.  
- Ensure you have an [AsyncStorage](https://github.com/react-native-async-storage/async-storage) provider (e.g. `@react-native-async-storage/async-storage`) installed, because Analytics needs storage for the instance ID ([Analytics | React Native Firebase](https://rnfirebase.io/analytics/usage#:~:text=Ensure%20you%20have%20installed%20an,every%20time%20the%20application%20terminates)).  
- For iOS 14+ ad tracking, set `pod_inhibit_all_warnings!` or disable IDFA in Firebase settings if not using App Tracking Transparency.  
- After installation, rebuild your dev client with EAS (`eas build --profile development`) and install it on devices.  

**Firebase Console Setup:**  
- In Firebase console, under **Analytics**, enable Google Analytics for your app (usually automatic when adding the app).  
- Optionally link to BigQuery, configure data retention, etc.  

**Usage (TypeScript):** Import and use Analytics in your code:  
```ts
import analytics from '@react-native-firebase/analytics';

// Log a custom event
await analytics().logEvent('purchase', { item: 't-shirt', price: 29.99 });

// Use predefined events
await analytics().logScreenView({ screen_name: 'Home', screen_class: 'HomeScreen' });

// Get app instance ID (for debugging)
const instanceId = await analytics().getAppInstanceId();
```
Example snippet (in a component):  
```tsx
useEffect(() => {
  analytics().logEvent('screen_view', { screen: 'Home' });
}, []);
```
See [React Native Firebase Analytics documentation](https://rnfirebase.io/analytics/usage) for details (event limits, reserved names, etc.) ([Analytics | React Native Firebase](https://rnfirebase.io/analytics/usage#:~:text=import%20react%2C%20,firebase%2Fanalytics)) ([Screen Tracking | React Native Firebase](https://rnfirebase.io/analytics/screen-tracking#:~:text=if%20%28previousRouteName%20%21%3D%3D%20currentRouteName%29%20,current%20%3D%20currentRouteName%3B)).

**Troubleshooting / Tips:**  
- **No events showing?** Ensure your development build is on a device (not Expo Go). Data may take a few hours to appear.  
- **Reset instance ID:** Reinstalling the app resets the ID. Use AsyncStorage to persist if needed.  
- **Expo Go limitation:** Analytics won’t work in Expo Go (native code required) ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=NOTE%3A%20React%20Native%20Firebase%20cannot,not%20compiled%20into%20Expo%20Go)).  
- **Known issues:** See [Expo forums on analytics](https://forums.expo.dev/) if GA 4 vs GA3 issues arise.  

**Compatibility Table:**  

| Package                      | Version         | RN Compatibility    |
|------------------------------|-----------------|---------------------|
| `@react-native-firebase/app` | ^22.0.0         | RN 0.71+ / Expo 52  |
| `@react-native-firebase/analytics` | ^22.0.0 | RN 0.71+ / Expo 52  |

## 2. A/B Testing (via Remote Config)

**Purpose:** Run A/B experiments by varying Remote Config parameters and measuring effects via Analytics.

**Installation:**  
- Use Remote Config and Analytics modules:  
  ```bash
  npx expo install @react-native-firebase/remote-config
  npx expo install @react-native-firebase/analytics
  ```  
- Add `"@react-native-firebase/remote-config"` to `plugins` in `app.json` (and ensure Analytics is included as above).  

**Expo/EAS Notes:**  
- No special native steps beyond installing the module. Config plugin handles any gradle/pod changes.  
- If targeting **Android**, ensure the Gradle plugin in `android/build.gradle` includes Google’s remote config artifact (the plugin will do this).  
- Rebuild dev clients after adding.

**Firebase Console Setup:**  
1. **Remote Config:** In Firebase console, navigate to **Remote Config**. Create keys (parameters) and default values for your app (e.g. `welcome_message` with value “Hello!”). Publish the config.  
2. **A/B Testing:** Go to **Grow > A/B Testing**. Create a new experiment, choose **Remote Config** for variants. Select the parameter(s) and define variant values and distribution. Link to an Analytics conversion event (for measuring success).  
3. **Schedule and run** the experiment.  

**Usage:** Use Remote Config in code to fetch/activate values. Example:  
```ts
import remoteConfig from '@react-native-firebase/remote-config';

async function fetchAndUseConfig() {
  // Set default values (optional)
  await remoteConfig().setDefaults({ welcome_message: 'Hello!' });
  // Fetch and activate remote values
  const fetched = await remoteConfig().fetchAndActivate();
  if (fetched) {
    console.log('Remote configs fetched and activated');
  }
  // Read the parameter
  const welcome = remoteConfig().getValue('welcome_message').asString();
  console.log('Welcome message:', welcome);
}
```  
This example sets defaults, fetches new values, and reads `welcome_message`. Use the fetched values in your UI (e.g. different text or feature flag based on variant). No direct A/B API is needed; Firebase handles assignment.

**Troubleshooting / Tips:**  
- **Config not updating?** By default fetches are cached (12h). Use `fetch(0)` or `fetchAndActivate()` to force refresh ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=You%20can%20however%20specify%20your,to%20cache%20the%20values%20for)).  
- **Async errors:** Always catch errors on `fetchAndActivate()` (known “config_update_not_fetched” can occur under heavy load) ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=)).  
- **No data in variant?** Check that the experiment is active and targeting your app version.  
- **Compatibility:** Remote Config requires Analytics enabled (as per docs) ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=documentation)).

**Compatibility Table:**  

| Package                               | Version  | RN Compatibility |
|---------------------------------------|----------|------------------|
| `@react-native-firebase/remote-config`| ^22.0.0  | RN 0.71+ / Expo 52 |
| (`@react-native-firebase/analytics` – for events) | ^22.0.0 | RN 0.71+ / Expo 52 |

## 3. In-App Messaging

**Purpose:** Show targeted, contextual messages to active users (configured in Firebase Console).

**Installation:**  
- Install In-App Messaging: `npx expo install @react-native-firebase/in-app-messaging`.  
- Also include Analytics: it’s required by In-App Messaging ([In App Messaging | React Native Firebase](https://rnfirebase.io/in-app-messaging/usage#:~:text=This%20module%20requires%20that%20the,view%20the%20Getting%20Started%20documentation)).  
- Add `"@react-native-firebase/in-app-messaging"` to `app.json` plugins (with `@react-native-firebase/analytics`).  

**Expo/EAS Notes:**  
- No extra native config. Plugin handles iOS/Android setup.  
- Ensure your dev client is rebuilt; campaigns from console will work in production and development builds.

**Firebase Console Setup:**  
- In Firebase console **Engage > In-App Messaging**, create a campaign. Define the message type (banner, modal, etc.), target conditions (event triggers, user segments), and design.  
- Choose triggers based on Analytics events (e.g. an event name). Publish the campaign.  
- Firebase will deliver these messages automatically when conditions are met; **no additional client code** is needed to display them ([In App Messaging | React Native Firebase](https://rnfirebase.io/in-app-messaging/usage#:~:text=Most%20of%20the%20set%20up,displayed%20on%20your%20user%27s%20device)).

**Usage (Code):** The RN API allows controlling display behavior. For example, to suppress messages during a critical flow:
```ts
import inAppMessaging from '@react-native-firebase/in-app-messaging';

async function setupApp() {
  // Suppress all messages initially
  await inAppMessaging().setMessagesDisplaySuppressed(true);
  // ... user completes setup ...
  // Enable messages after setup
  await inAppMessaging().setMessagesDisplaySuppressed(false);
}
```
This example (from the docs) suppresses messages until the user is ready ([In App Messaging | React Native Firebase](https://rnfirebase.io/in-app-messaging/usage#:~:text=import%20inAppMessaging%20from%20%27%40react)). Adjust as needed.

**Troubleshooting / Tips:**  
- **No message display?** Check campaign start/end dates and trigger conditions.  
- **Limitations:** Firebase allows 1 in-app message per day per app in the foreground by default; use contextual triggers to bypass this ([In App Messaging | React Native Firebase](https://rnfirebase.io/in-app-messaging/usage#:~:text=According%20to%20github%20issue%20https%3A%2F%2Fgithub.com%2Ffirebase%2Ffirebase,is%20no%20daily%20rate%20limit)).  
- **Data collection:** To comply with privacy (GDPR), you can disable auto data collection via `firebase.json` (see [Firebase docs](https://rnfirebase.io/in-app-messaging/usage) on auto collection) ([In App Messaging | React Native Firebase](https://rnfirebase.io/in-app-messaging/usage#:~:text=firebase)).  
- **Compatibility:** Only works in built apps (dev-client or standalone). Not available in Expo Go.  

**Compatibility Table:**  

| Package                                       | Version  | RN Compatibility |
|-----------------------------------------------|----------|------------------|
| `@react-native-firebase/in-app-messaging`     | ^22.0.0  | RN 0.71+ / Expo 52 |
| (`@react-native-firebase/analytics` – requirement) | ^22.0.0 | RN 0.71+ / Expo 52 |

## 4. Crashlytics

**Purpose:** Track crashes and non-fatal errors in production.

**Installation:**  
- Run: `npx expo install @react-native-firebase/crashlytics`.  
- Add `"@react-native-firebase/crashlytics"` to `app.json` plugins. This adds necessary Android Gradle plugin steps for you ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#:~:text=)).  
- For iOS, ensure `use_frameworks`: “static” is set (via `expo-build-properties`) ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=%22plugins%22%3A%20%5B%20%22%40react,static)).  
- Rebuild with EAS so native Crashlytics is configured.

**Expo/EAS Notes:**  
- **Debug Builds:** By default, Crashlytics is disabled in debug mode. To test in dev, use `firebase.json` to set `crashlytics_debug_enabled: true` ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#enable-debug-crash-logs#:~:text=Enable%20debug%20crash%20logs)).  
- **Symbols (iOS):** Ensure dSYM upload. In Xcode build phase, Fabric script should already be linked. For Expo, this is usually automated by the plugin.  

**Firebase Console Setup:**  
- In Firebase console, go to **Quality > Crashlytics**. If first time, it may ask to enable and set up (uploading a build).  
- **Android:** The plugin added in `app.json` handles adding `com.google.firebase:firebase-crashlytics` Gradle plugin and manifests.  
- **iOS:** The config plugin adds required pods. Ensure your bundle ID matches and build/Run an iOS dev build. Crashlytics will create a *“missing dSYM”* error if symbols aren’t uploaded; follow the [official docs](https://firebase.google.com/docs/crashlytics/get-deobfuscated-reports?platform=ios) if needed.  

**Usage (Code):** Use the API to log context and force crashes. Example:  
```tsx
import crashlytics from '@react-native-firebase/crashlytics';
function App() {
  useEffect(() => {
    crashlytics().log('App mounted.');
  }, []);
  
  async function onSignIn(user: User) {
    crashlytics().log('User signed in.');
    await crashlytics().setUserId(user.uid);
    await crashlytics().setAttributes({
      role: user.role,
      followers: String(user.followers),
    });
  }

  // Test a crash:
  function causeCrash() {
    crashlytics().crash(); // Forces a crash (for testing only)
  }
  
  // Catch and report a JS error:
  try {
    // ... code that may throw ...
  } catch (error) {
    crashlytics().recordError(error as Error);
  }
  
  // Opt-out/in example:
  async function toggleCrashlytics(enabled: boolean) {
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
  }
}
```
This follows the [Crashlytics docs](https://rnfirebase.io/crashlytics/usage) ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#:~:text=import%20React%2C%20,firebase%2Fcrashlytics)) ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#enable-debug-crash-logs#:~:text=async%20function%20toggleCrashlytics%28%29%20,setEnabled%28crashlytics%28%29.isCrashlyticsCollectionEnabled%29%29%3B)). The `.log()`, `.setUserId()`, `.setAttribute()` methods add context to crash reports. Use `.crash()` or catch errors with `.recordError()`.  

**Troubleshooting / Tips:**  
- **No crashes in console?** After forcing a crash, relaunch the app so Crashlytics can send the report. It can take a few minutes to appear.  
- **Debug Logging:** In development, enable debug logging by setting `"crashlytics_debug_enabled": true` in `firebase.json` ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#enable-debug-crash-logs#:~:text=Enable%20debug%20crash%20logs)).  
- **Opt-in Collection:** By default, Crashlytics auto-collection is on. Use `crashlytics().setCrashlyticsCollectionEnabled(false)` if you want users to opt-in ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#enable-debug-crash-logs#:~:text=As%20Crashlytics%20will%20be%20sending,setCrashlyticsCollectionEnabled)).  
- **iOS Setup:** If Xcode builds fail, ensure CocoaPods are updated and iOS 11+ is set (App Check notes also apply).  
- **NDK (Android):** RN Firebase supports capturing native (NDK) crashes. For pure JS apps, ignore.  

**Compatibility Table:**  

| Package                               | Version  | RN Compatibility |
|---------------------------------------|----------|------------------|
| `@react-native-firebase/crashlytics`  | ^22.0.0  | RN 0.71+ / Expo 52 |

## 5. Remote Config

**Purpose:** Dynamically change app behavior or appearance via key-value parameters.

**Installation:**  
- `npx expo install @react-native-firebase/remote-config` (app module is required already).  
- Add `"@react-native-firebase/remote-config"` to `plugins` (with Analytics) in `app.json`.  

**Expo/EAS Notes:**  
- The plugin automatically links native libraries.  
- No further manual steps; just rebuild.  
- Ensure internet permission on Android (automatic).  

**Firebase Console Setup:**  
- In **Remote Config** (Firebase console), define parameters and default values per platform (e.g. `show_promo: true` for Android). Publish the config template.  
- You can organize parameters in “conditions” (e.g. target only Android or users matching a user property).  

**Usage (Code):** Fetch and activate values, then use them. Example:  
```ts
import remoteConfig from '@react-native-firebase/remote-config';

useEffect(() => {
  async function loadConfig() {
    // Set defaults in code (optional but recommended)
    await remoteConfig().setDefaults({
      show_promo: false,
      theme_color: 'blue',
    });
    // Fetch new values (only updates if cache expired)
    const updated = await remoteConfig().fetchAndActivate();
    if (updated) {
      console.log('Remote config values were fetched and activated.');
    }
    const showPromo = remoteConfig().getValue('show_promo').asBoolean();
    console.log('Show promo:', showPromo);
  }
  loadConfig();
}, []);
```
Remote Config provides `.getValue(key).asString()`/`.asBoolean()` to read values. You can also listen to real-time updates via `onValueChanged` listeners ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=Remote%20Config%20has%20the%20ability,or%20more%20listeners%20for%20them)) (advanced).

**Troubleshooting / Tips:**  
- **Fetch frequency:** Default cache is 12h. Use `remoteConfig().fetch(0)` to force fetch (be cautious of rate limits) ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=You%20can%20however%20specify%20your,to%20cache%20the%20values%20for)).  
- **Default vs Remote:** Use `getSource()` to check if a value came from remote or default ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=When%20a%20value%20is%20read%2C,method%20can%20be%20conditionally%20checked)).  
- **Network errors:** Ensure device has network. Always use `try/catch` around fetch calls.  
- **Complex values:** Remote Config only handles basic types. For JSON, consider storing JSON strings or use separate flags.  
- **Compatibility:** Remote Config automatically requires Analytics (to fetch from correct project) ([Remote Config | React Native Firebase](https://rnfirebase.io/remote-config/usage#:~:text=documentation)).  

**Compatibility Table:**  

| Package                               | Version  | RN Compatibility |
|---------------------------------------|----------|------------------|
| `@react-native-firebase/remote-config`| ^22.0.0  | RN 0.71+ / Expo 52 |

## 6. App Check

**Purpose:** Protect Firebase backend resources by ensuring requests come from your authentic app.

**Installation:**  
- `npx expo install @react-native-firebase/app-check`.  
- Add `"@react-native-firebase/app-check"` to `plugins` in `app.json`.  

**Expo/EAS Notes:**  
- **iOS:** App Check requires initializing the native SDK in AppDelegate. The config plugin for `app-check` handles this automatically for you, so no manual code needed in most cases. (If not using the plugin, you would import `RNFBAppCheckModule` in AppDelegate per [docs](https://rnfirebase.io/app-check/usage)) ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=Initialize)) ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=Any%5D%3F%20%3D%20nil%29%20,From%20App%2FCore%20integration)).  
- **Android:** No extra code; the plugin configures Android to use Play Integrity or SafetyNet as chosen.  
- For testing, use the **Debug** provider: generate a debug token (via logcat) and add it in Firebase console under App Check settings ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=The%20react,CI%20environments%20or%20iOS%20Simulators)). You can disable App Check during development with `firebase.json` or via the debug provider.  

**Firebase Console Setup:**  
- In Firebase console, go to **Build > App Check**. Register each app for App Check:  
  - **iOS:** Choose DeviceCheck or App Attest, generate a key, and register.  
  - **Android:** Choose Play Integrity (preferred) or SafetyNet. For Play Integrity, you must distribute via Google Play (for token generation) or use the debug provider.  
  - Enable App Check enforcement on the products you use (e.g. Firestore, Storage, Functions) once you’re ready.  

**Usage (Code):** Initialize App Check with a provider. Example (using the default provider):  
```ts
import { initializeAppCheck, ReCaptchaV3Provider } from '@react-native-firebase/app-check';

// Initialize with a provider (e.g., Firebase ReCAPTCHA v3 for web-like, or custom)
initializeAppCheck(undefined, {
  provider: new ReCaptchaV3Provider('<YOUR_RECAPTCHA_SITE_KEY>'),
  isTokenAutoRefreshEnabled: true,
});
```
_For Expo_, often the default behavior is to use debug provider in development. See [docs](https://rnfirebase.io/app-check/usage) for advanced custom providers and debug tokens ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=import%20,check)) ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=The%20react,CI%20environments%20or%20iOS%20Simulators)).

**Troubleshooting / Tips:**  
- **Cannot connect?** Ensure your App Check configuration in console matches. Debug tokens or certificates must be correct.  
- **Expo SDK:** App Check uses `RNFBAppCheckModule`; make sure `expo-build-properties` is set to iOS 11+ (Podfile minimum).  
- **CI/Development:** Use the debug provider (see docs on generating tokens via logcat/console) ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=The%20react,CI%20environments%20or%20iOS%20Simulators)).  
- **Automatic Refresh:** You can configure token auto-refresh via `firebase.json` or code if needed ([App Check | React Native Firebase](https://rnfirebase.io/app-check/usage#:~:text=Automatic%20Data%20Collection)).  

**Compatibility Table:**  

| Package                              | Version  | RN Compatibility |
|--------------------------------------|----------|------------------|
| `@react-native-firebase/app-check`   | ^22.0.0  | RN 0.71+ / Expo 52 |

## 7. Performance Monitoring

**Purpose:** Measure app performance (startup time, HTTP requests, custom traces).

**Installation:**  
- `npx expo install @react-native-firebase/perf`.  
- Add `"@react-native-firebase/perf"` to `plugins`.  

**Expo/EAS Notes:**  
- **Android Setup:** Performance Monitoring requires adding the Firebase Perf Gradle plugin. The `@react-native-firebase/perf` config plugin automatically updates your `build.gradle` files. Specifically, it adds `classpath 'com.google.firebase:perf-plugin:1.x.x'` and applies `com.google.firebase.firebase-perf` ([Performance Monitoring | React Native Firebase](https://rnfirebase.io/perf/usage#:~:text=Add%20the%20Performance%20Monitoring%20Plugin)).  
- No manual steps needed for iOS beyond adding the pod.  
- Rebuild with EAS after installation.  

**Firebase Console Setup:**  
- In Firebase console, go to **Performance**. The service is enabled automatically once the SDK reports data.  
- You can name your app’s performance traces and HTTP metrics, which will appear under the Performance dashboard.  

**Usage (Code):** Track custom traces or HTTP requests:  
```ts
import perf from '@react-native-firebase/perf';

// Custom trace example
async function doSomeWork() {
  const trace = await perf().startTrace('load_profile');
  // ... perform tasks ...
  await trace.putAttribute('user', 'user123');
  await trace.putMetric('queries', 5);
  await trace.stop();
}

// HTTP metric example
async function fetchUserData(url: string) {
  const metric = await perf().newHttpMetric(url, 'GET');
  metric.putAttribute('userId', 'user123');
  await metric.start();
  const response = await fetch(url);
  metric.setHttpResponseCode(response.status);
  metric.setResponsePayloadSize(response.headers.get('content-length'));
  await metric.stop();
  return response.json();
}
```
These examples come from the [Perf docs](https://rnfirebase.io/perf/usage) ([Performance Monitoring | React Native Firebase](https://rnfirebase.io/perf/usage#:~:text=Below%20is%20how%20you%20would,task%20in%20your%20app%20code)) ([Performance Monitoring | React Native Firebase](https://rnfirebase.io/perf/usage#:~:text=async%20function%20getRequest%28url%29%20,newHttpMetric%28url%2C%20%27GET)). The first measures a code block; the second measures an HTTP fetch.

**Troubleshooting / Tips:**  
- **Auto-collection:** By default, Performance Monitoring auto-collects certain traces (app startup, screen rendering). To disable this (e.g. for consent), set `"perf_auto_collection_enabled": false` in `firebase.json` ([Performance Monitoring | React Native Firebase](https://rnfirebase.io/perf/usage#:~:text=Disable%20Auto)) and manually re-enable with `perf().setPerformanceCollectionEnabled(true)`.  
- **Network issues:** On Android API < 23, the HTTP metric may require enabling `android:usesCleartextTraffic="true"` if testing against non-HTTPS.  
- **Compatibility:** The Android plugin version (`com.google.firebase:perf-plugin`) must match Firebase SDK version. The RN firebase plugin typically selects a compatible version.  

**Compatibility Table:**  

| Package                               | Version  | RN Compatibility |
|---------------------------------------|----------|------------------|
| `@react-native-firebase/perf`         | ^22.0.0  | RN 0.71+ / Expo 52 |

## 8. Cloud Messaging (FCM)

**Purpose:** Receive and handle push notifications (via FCM tokens and messages).

**Installation:**  
- `npx expo install @react-native-firebase/messaging`.  
- Add `"@react-native-firebase/messaging"` to `plugins` in `app.json`.  

**Expo/EAS Notes:**  
- **iOS Entitlements:** Since Expo SDK 51, you must explicitly add Push Notification entitlements in `app.json`. For example:  
  ```jsonc
  {
    "expo": {
      "ios": {
        "entitlements": {
          "aps-environment": "production"
        },
        "infoPlist": {
          "UIBackgroundModes": ["remote-notification"]
        }
      }
    }
  }
  ```  
  (These ensure the app can receive remote notifications in background/terminated state) ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=iOS%20)) ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=iOS%20)).  
- **Android:** No extra manifest edits are needed; the plugin handles necessary changes.  
- **Notification Delegation:** By default, react-native-firebase disables Android Notification Delegation for FCM to allow JS handling ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=Android%20,Delegation)). You can re-enable it via `firebase.json` if needed.  

**Firebase Console Setup:**  
- In Firebase, under **Cloud Messaging**, ensure you have set up your APNs keys/certificates for iOS apps, and that `google-services.json` has your app’s project details.  
- For Android, ensure your package name and SHA-1 (if needed) are correct.  
- Use Firebase Admin SDK or FCM API to send messages to your device tokens.  

**Usage (Code):** Handle permissions and messages:  
```ts
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// Request permission on iOS
async function requestPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  console.log('FCM Auth status:', enabled);
}

// Get FCM token
async function getToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
}

// Foreground message handler
useEffect(() => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    Alert.alert('FCM Message', JSON.stringify(remoteMessage));
  });
  return unsubscribe;
}, []);

// Background message handler (in index.js)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});
```
The above is adapted from the [FCM docs](https://rnfirebase.io/messaging/usage) ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=import%20messaging%20from%20%27%40react)) ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=function%20App%28%29%20%7B%20useEffect%28%28%29%20%3D,stringify%28remoteMessage%29%29%3B)). iOS simulators do not receive real FCM; test on devices or Android emulators. 

**Troubleshooting / Tips:**  
- **No notifications on iOS?** Check APNs setup and that `aps-environment` is set. For local testing, using the debug build on a device with a valid APNs key is required.  
- **Foreground vs. background:** In foreground, `onMessage` receives messages (you must display notifications manually). In background/quit, OS displays notifications and `setBackgroundMessageHandler` handles data-only payloads ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=)) ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=messaging%28%29.setBackgroundMessageHandler%28async%20remoteMessage%20%3D,)).  
- **Notification Delegation (Android Q+):** If using FCM REST v1, disable notification delegation as above or use the legacy API.  
- **Expo Notifications:** If you use `expo-notifications`, note that it can interoperate with FCM on Android. Avoid duplicate handlers. Use either FCM listeners (as above) or Expo’s API, not both.  

**Compatibility Table:**  

| Package                               | Version  | RN Compatibility |
|---------------------------------------|----------|------------------|
| `@react-native-firebase/messaging`    | ^22.0.0  | RN 0.71+ / Expo 52 |

## Summary

By following the above steps for **installation**, **Expo/EAS configuration**, **Firebase console setup**, and **code usage**, you can fully integrate Firebase’s native services into your Expo SDK 52 app with a custom dev client. Always rebuild your development client or production binaries with EAS after adding any native module or changing `app.json`. 

**Best Practices:**  
- Enable only needed Crashlytics and Performance collection (disable auto-collection if requiring user consent) ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#enable-debug-crash-logs#:~:text=Because%20you%20have%20stack%20traces,firebase.json)) ([Performance Monitoring | React Native Firebase](https://rnfirebase.io/perf/usage#:~:text=Disable%20Auto)).  
- Use environment-specific Firebase projects or analytic streams if you have staging vs production.  
- Test each integration on real devices (especially iOS for APNs/App Check).  
- Keep Firebase SDKs updated via React Native Firebase releases (e.g. v22.x) that match your RN version. Use `expo install` or pinned versions in `package.json` to avoid mismatches ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=The%20following%20is%20an%20example,change%20to%20match%20your%20own)).  

**References:** Official React Native Firebase documentation and Expo guides were used extensively (see citations) to ensure compatibility and best practices for Expo SDK 52 ([React Native Firebase | React Native Firebase](https://rnfirebase.io/#expo#:~:text=The%20following%20is%20an%20example,change%20to%20match%20your%20own)) ([Using Firebase - Expo Documentation](https://docs.expo.dev/guides/using-firebase/#:~:text=Since%20React%20Native%20Firebase%20requires,without%20writing%20native%20code%20yourself)) ([Crashlytics | React Native Firebase](https://rnfirebase.io/crashlytics/usage#:~:text=)) ([Performance Monitoring | React Native Firebase](https://rnfirebase.io/perf/usage#:~:text=Add%20the%20Performance%20Monitoring%20Plugin)) ([Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage#:~:text=function%20App%28%29%20%7B%20useEffect%28%28%29%20%3D,stringify%28remoteMessage%29%29%3B)). These cover installation, config plugin usage, and code examples for each Firebase service.