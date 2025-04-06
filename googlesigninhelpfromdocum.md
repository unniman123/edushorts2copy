Authentication is the process of verifying the identity of a user who is attempting to access a system, application, or online service. In this blog post, you will learn about React Native authentication, including native mobile specific login mechanisms like "Sign in with Apple" and "Google One Tap sign-in", as well as SMS & WhatsApp based authentication.

At the end of this blog post, you will have all the components needed to create the ideal authentication experience for your mobile app users.

Prerequisites#
This article assumes you are comfortable with writing a basic application in React Native. No knowledge of Supabase is required.

We will use the following tools

Expo - we used Expo SDK version 49.0.0 (React Native version 0.72)
Supabase - create your account here if you do not have one
IDE of your choosing
Note: We're using Expo as that's the recommended way of getting started with React Native. However, the fundamental approach here applies to bare React Native applications as well.

Set up supabase-js for React Native#
Using supabase-js is the most convenient way of leveraging the full power of the Supabase stack as it conveniently combines all the different services (database, auth, realtime, storage, edge functions) together.

Install supabase-js and dependencies#
After you have created your Expo project, you can install supabase-js and the required dependencies using the following command:

npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

Authentication storage#
By default, supabase-js uses the browser's localStorage mechanism to persist the user's session but can be extended with platform specific storage implementations. In React Native we can build native mobile and web applications with the same code base, so we need a storage implementation that works for all these platforms: react-native-async-storage.

We need to pass an instance of react-native-async-storage to supabase-js to make sure authentication works reliably across all react native platforms:

lib/supabase.ts

import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = YOUR_REACT_NATIVE_SUPABASE_URL
const supabaseAnonKey = YOUR_REACT_NATIVE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
You can find your URL and anon key in the API credentials section of the Supabase dashboard.

Encrypting the user session#
If you wish to encrypt the user's session information, you can use aes-js and store the encryption key in Expo SecureStore. The aes-js library is a reputable JavaScript-only implementation of the AES encryption algorithm in CTR mode. A new 256-bit encryption key is generated using the react-native-get-random-values library. This key is stored inside Expo's SecureStore, while the value is encrypted and placed inside AsyncStorage.

Please make sure that:

You keep the expo-secure-storage, aes-js and react-native-get-random-values libraries up-to-date.
Choose the correct SecureStoreOptions for your app's needs. E.g. SecureStore.WHEN_UNLOCKED regulates when the data can be accessed.
Carefully consider optimizations or other modifications to the above example, as those can lead to introducing subtle security vulnerabilities.
Install the necessary dependencies in the root of your Expo project:

npm install @supabase/supabase-js
npm install @rneui/themed @react-native-async-storage/async-storage react-native-url-polyfill
npm install aes-js react-native-get-random-values
npx expo install expo-secure-store

Implement a LargeSecureStore class to pass in as Auth storage for the supabase-js client:

lib/supabase.ts

import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import * as aesjs from 'aes-js'
import 'react-native-get-random-values'

// As Expo's SecureStore does not support values larger than 2048
// bytes, an AES-256 key is generated and stored in SecureStore, while
// it is used to encrypt/decrypt values stored in AsyncStorage.
class LargeSecureStore {
  private async _encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8))

    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1))
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value))

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey))

    return aesjs.utils.hex.fromBytes(encryptedBytes)
  }

  private async _decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key)
    if (!encryptionKeyHex) {
      return encryptionKeyHex
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    )
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value))

    return aesjs.utils.utf8.fromBytes(decryptedBytes)
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key)
    if (!encrypted) {
      return encrypted
    }

    return await this._decrypt(key, encrypted)
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key)
    await SecureStore.deleteItemAsync(key)
  }

  async setItem(key: string, value: string) {
    const encrypted = await this._encrypt(key, value)

    await AsyncStorage.setItem(key, encrypted)
  }
}

const supabaseUrl = YOUR_REACT_NATIVE_SUPABASE_URL
const supabaseAnonKey = YOUR_REACT_NATIVE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
Email and password authentication in React Native#
Once we've set up the storage mechanism, building an email and password sign in flow becomes pretty straight forward. Install @rneui/themed to get some nice cross platform button and input fields:

npm install @rneui/themed

Set up a simple email form component:

components/EmailForm.tsx

import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'

export default function EmailForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})
Note, by default Supabase Auth requires email verification before a session is created for the users. To support email verification you need to implement deep link handling which is outlined in the next section.

While testing, you can disable email confirmation in your project's email auth provider settings.

OAuth, magic links and deep-linking#
As you saw above, we specified detectSessionInUrl: false when initializing supabase-js. By default, in a web based environment, supabase-js will automatically detect OAuth and magic link redirects and create the user session.

In native mobile apps, however, OAuth callbacks require a bit more configuration and the setup of deep linking.

To link to your development build or standalone app, you need to specify a custom URL scheme for your app. You can register a scheme in your app config (app.json, app.config.js) by adding a string under the scheme key:

{
  "expo": {
    "scheme": "com.supabase"
  }
}

In your project's auth settings add the redirect URL, e.g. com.supabase://**.

Finally, implement the OAuth and linking handlers. See the supabase-js reference for instructions on initializing the supabase-js client in React Native.

./components/Auth.tsx

import { Button } from 'react-native'
import { makeRedirectUri } from 'expo-auth-session'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from 'app/utils/supabase'

WebBrowser.maybeCompleteAuthSession() // required for web only
const redirectTo = makeRedirectUri()

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url)

  if (errorCode) throw new Error(errorCode)
  const { access_token, refresh_token } = params

  if (!access_token) return

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) throw error
  return data.session
}

const performOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })
  if (error) throw error

  const res = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectTo)

  if (res.type === 'success') {
    const { url } = res
    await createSessionFromUrl(url)
  }
}

const sendMagicLink = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: 'example@email.com',
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) throw error
  // Email sent.
}

export default function Auth() {
  // Handle linking into app from email app.
  const url = Linking.useURL()
  if (url) createSessionFromUrl(url)

  return (
    <>
      <Button onPress={performOAuth} title="Sign in with Github" />
      <Button onPress={sendMagicLink} title="Send Magic Link" />
    </>
  )
}
For the best user experience, it is recommended to use universal links which require a more elaborate setup. You can find the detailed setup instructions in the Expo docs.

Native mobile login mechanisms#
Sign in with Apple Demo

Some native mobile operating systems, like iOS and Android, offer a built-in identity provider for convenient user authentication.

For iOS, apps that use a third-party or social login service to set up or authenticate the user’s primary account with the app must also offer Sign in with Apple as an equivalent option.

There are several benefits and reasons why you might want to add social login to your applications:

Improved user experience: Users can register and log in to your application using their existing app store accounts, which can be faster and more convenient than creating a new account from scratch. This makes it easier for users to access your application, improving their overall experience.

Better user engagement: You can access additional data and insights about your users, such as their interests, demographics, and social connections. This can help you tailor your content and marketing efforts to better engage with your users and provide a more personalized experience.

Increased security: Social login can improve the security of your application by leveraging the security measures and authentication protocols of the social media platforms that your users are logging in with. This can help protect against unauthorized access and account takeovers.

Sign in with Apple#
Supabase Auth supports using Sign in with Apple on the web and in native apps for iOS, macOS, watchOS, or tvOS.

For detailed setup and implementation instructions please refer to the docs and the video tutorial.

Sign in with Google#
Supabase Auth supports Sign in with Google on the web, native Android applications, and Chrome extensions.

For detailed set up and implementation instructions please refer to the docs and the video tutorial.

One time passwords#
Supabase supports various forms of passwordless authentication:

Email Magic Link
Email one-time password (OTP)
SMS & WhatsApp one-time password (OTP) (watch the video tutorial)
Passwordless login mechanisms have similar benefits as the native mobile login options mentioned above.

Conclusion#
In this post, we learned various authentication mechanisms we can use in React Native applications to provide a delightful experience for our users across native mobile and web.










_______________________________________________________________________________________________

react native googlesign in documentation 
Installation
There are two ways to consume the package: paid and free.

Why paid? According to the State of React Native Survey, unmaintained packages are the #1 pain point of the React Native ecosystem. Your purchase enables the module reliability, and contributions to upstream SDKs such as 1, 2, 3.

Universal Sign In (premium)
⭐️ Key Features:

Cross-Platform: Unified APIs which work on Android, iOS, Web, and macOS.

Android: Built with Credential Manager library
Web: Uses Sign In with Google for Web
iOS & macOS: Powered by the Google Sign-In SDK
Licensed: see pricing and license.

Trusted: A total of over 170k npm package downloads.

Faster Sign-Ups: Reduce sign-up and sign-in times on Android by up to 50%, according to Google.

See the UI: screenshots of the features.

🛡️ Advanced security features

🔧 Easier setup - Automatic detection of configuration parameters for faster integration.

📱 An example app - to showcase all features on native and web

Public version (free)
Available on the public npm registry under MIT license, this version:

Uses the functional, but deprecated legacy Android Google Sign-In which will be removed from the Google Play Services Auth SDK (com.google.android.gms:play-services-auth) later in 2025. The free package will continue to use a version where the deprecated SDK is present.
Has platform support limited to Android and iOS.
Contains none of the extra features listed above.
If you want to migrate from the public version to the Universal version, follow the migration guide.

Obtaining Universal Sign In
Universal sign in requires purchasing a license, after which you will be able to configure your (or your colleagues') access to the private npm package and to the private repo with the sources and examples.

Are you an EAS customer? You may be able to access the premium version for free, learn more.

Accessing the private npm package
The private npm package is like any other, but it's hosted on the GitHub npm packages registry, not the public npm registry. Therefore, a small bit of setup is needed:

Obtain here a Personal Access Token with packages:read permission.

Set up your package manager to fetch the package from the GH packages registry. In this example, we're using an NPM_TOKEN_GOOGLE_SIGN_IN environment variable.

yarn v3+
npm / yarn v1
create a .yarnrc.yml file in your project root with the following content:

.yarnrc.yml
npmScopes:
  react-native-google-signin:
    npmRegistryServer: https://npm.pkg.github.com
    npmAuthToken: '${NPM_TOKEN_GOOGLE_SIGN_IN}'

If you use another package manager (such as Bun), refer to its documentation setting up a custom registry.

Installing
yarn
npm
yarn add @react-native-google-signin/google-signin@latest

After installing: if you're using the Universal version, open the lockfile (yarn.lock / package-lock.json...) and verify that the package is fetched from the GitHub registry (the entry must point to npm.pkg.github.com, not registry.npmjs.org). If it does not, it means that your package manager is not configured correctly - try uninstalling and reinstalling the package.

There are several guides to follow now:

Expo guide for native mobile apps built with Expo
Web guide if you want to use the package on web
If you're not using Expo but plain React Native, follow Android guide and iOS guide
Requirements
The packages support last 3 stable releases of React Native. Unofficially, they may work with older versions too.

If you're using the New Architecture, it's strongly recommended to use the latest React Native version available.

------------------------------------

SETTING UP 
EXPO SETUP 
Prepare your Expo project
note
This package cannot be used in Expo Go because it requires custom native code. This applies to both the Original and Universal (one-tap) sign in methods.

However, you can add custom native code to an Expo app by using a development build. Using a development build is the recommended approach for production apps, and is documented in this guide.

info
With Expo SDK 50, minimum iOS version was bumped to 13.4. In case you get an error during pod install step, see these release notes to determine the right version of this package to install.

Add config plugin
After installing the npm package, add a config plugin (read more details below) to the plugins array of your app.json or app.config.js. There are 2 config plugins available: for projects with Firebase, and without Firebase.

Expo without Firebase
If you're not using Firebase, provide the iosUrlScheme option to the config plugin.

To obtain iosUrlScheme, follow the guide.

app.json | js
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps._some_id_here_"
        }
      ]
    ]
  }
}

Expo and Firebase Authentication
If you are using Firebase Authentication, obtain the 2 Firebase config files (google-services.json for Android and GoogleService-Info.plist for iOS) according to the guide and place them into your project. Then specify the paths to the files:

app.json | js
{
  "expo": {
    "plugins": ["@react-native-google-signin/google-signin"],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}

Rebuild the app
Then run the following to generate the native project directories. Run this command every time you add or update any dependency with native code.

npx expo prebuild --clean

Next, rebuild your app and you're good to go!

npx expo run:android && npx expo run:ios


-------------
ANDROID SETUP GUIDE 

Ensure compatibility
If you're using the paid package:

If you're using RN >= 0.73, you're good to go.

But if you're using RN 0.72 or older, you need to specify compileSdkVersion 34 in android/build.gradle of your project as highlighted below.

Google project configuration
Follow this guide to set up your project and get the configuration information which you'll need later.
Without Firebase Authentication
You don't need to do any more modifications.

With Firebase Authentication
1. Download the configuration file
Download the configuration file (google-services.json) from Firebase. Then, place it into your project according to these instructions.
2. Update gradle files
Update android/build.gradle with

android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "a.b.c"
        minSdkVersion = x
        compileSdkVersion = y
        targetSdkVersion = z
        googlePlayServicesAuthVersion = "20.7.0" // <--- use this version or newer
    }
// ...
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0' // <--- use this version or newer
    }
}

Update android/app/build.gradle with

android/app/build.gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"
apply plugin: 'com.google.gms.google-services'

This ends the setup for Firebase.

Rebuild the native project
Do not forget to rebuild the native app after the setup is done.

Choose Dependency versions (optional)
The library depends on com.google.android.gms:play-services-auth, as seen in build.gradle. If needed, you may control their versions by the ext closure, as seen in the code snippet above.

Edit this page


----- -
IOS SETUP GUIDE

warning
If you use Expo, follow this guide instead. This guide applies to vanilla React Native apps only.

Link the native module
run pod install in ios/ directory to install the module
Google project configuration
Follow this guide to get the configuration information which you need for the next steps.
Firebase Authentication
If you're using Firebase Authentication, download the GoogleService-Info.plist file and place it into your Xcode project.

Xcode configuration
Configure URL types in the Info panel (see screenshot)
add your "iOS URL scheme" (also known as reversed client id), which can be found in Google Cloud Console under your iOS client ID.
If you need to support Mac Catalyst, you will need to enable the Keychain Sharing capability on each build target. No keychain groups need to be added.
link config

Rebuild the native project
Do not forget to rebuild the native app after the setup is done.

Optional: modify your app to respond to the URL scheme
This is only required if you have multiple listeners for openURL - for instance if you have both Google and Facebook OAuth.

Because only one openURL method can be defined, if you have multiple listeners for openURL, you must combine them into a single function as shown below:

For AppDelegate written in Swift
If your AppDelegate a Swift file (the default in React Native 0.77.0 or higher), you'll need to:

Add the following import to your project's bridging header file (usually ios/YourProject-Bridging-Header.h):
// …

// ⬇️ Add this import
#import <GoogleSignIn/GoogleSignIn.h>

Modify your AppDelegate.swift file:
// …

@main
class AppDelegate: RCTAppDelegate {
  // …

  // ⬇️ Add this method
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    // Add any other URL handlers you're using (e.g. Facebook SDK)
    return ApplicationDelegate.shared.application(app, open: url, options: options) ||
           GIDSignIn.sharedInstance.handle(url)
  }

}


For AppDelegate written in Objective-C
For AppDelegate written in Objective-C (the default prior to React Native 0.77), modify your AppDelegate.m file:

#import "AppDelegate.h"
#import <GoogleSignIn/GoogleSignIn.h> // ⬅️ add the header import

// …

@implementation AppDelegate

// …

// ⬇️ Add this method before file @end
- (BOOL)application:(UIApplication *)application openURL:(nonnull NSURL *)url options:(nonnull NSDictionary<NSString *,id> *)options {
  // Add any other URL handlers you're using (e.g. Facebook SDK)
  return [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options] || [GIDSignIn.sharedInstance handleURL:url];
}

@end



------ 
WEB SETUP GUIDE 

On the web, there is one extra step necessary to use the library: you need to load the Google Client Library and make it available in the browser before calling any of the APIs exposed by this package.

tip
The functionality covered in this page is available in the licensed version. You can get a license here ⭐️.

There are different ways to load the client script. Some of them are:

Next.js
Simple html
useEffect
import Script from 'next/script';

<Script
  src="https://accounts.google.com/gsi/client"
  strategy="lazyOnload"
  onLoad={() => {
    // present the sign in popup
  }}
/>;

After the script is loaded, you can call the functions for signing in and render the WebGoogleSigninButton.

If you call any of the module functions before the client library is loaded, such calls trigger the onError callback with the PLAY_SERVICES_NOT_AVAILABLE error code.

You can read the official docs for loading the Client Library here.


----
OBTAINING CONFIGURATION INFORMATION

Before getting your hands dirty with code, some configuration needs to be taken care of. Be patient, this is the most complex part of the setup.

Configuration information obtained in this guide is used in later steps of the setup and in the configure() call: 1 or 2.

You do not need Firebase to configure Google Sign In. However, if you use it, it's a little easier to set up the sign in experience because Firebase gives you one file to download and put into your project.

Android
Follow the 2 steps below to set up Google Sign In for your Android app.

danger
Completing this guide is crucial for Google Sign-In to work on Android. If not done correctly, you will get the infamous DEVELOPER_ERROR error (how to troubleshoot it).

Step 1: Obtain SHA-1 certificate fingerprints
You probably use multiple signing configurations for your Android app - for example for building debug and release APKs locally or building on Expo EAS. Then there's the Play App Signing for store deployments - while the Google Play Store does not rebuild your app, it may re-sign it using one of its own signing configurations.

First, you need to obtain the SHA-1 certificate fingerprints for all of these signing configurations using the instructions below. Then, use all of those SHA-1 hashes in Step 2 below.

When releasing via Google Play Store
When using Expo EAS
When developing locally
Check if "Google Play App Signing" is enabled for your app in the console. If it is enabled, you need to take the following steps:

In Google Play Console, navigate to: <Your App> -> Release section (in the left sidebar) -> Setup -> App Signing.
Under the "App signing key certificate" and also "Upload key certificate", take note of SHA-1 certificate fingerprint. That's a total of two or more fingerprints (Play Store sometimes has more than one "App signing key certificate"!).


Step 2: Add SHA-1 hashes to Firebase or Google Cloud Console
Using all of the SHA-1 fingerprints obtained in the previous step, follow the instructions below.

When using Firebase
When not using Firebase
Sign in to Firebase Console and open your project.
Ensure that in the "Authentication" menu, "Google" is enabled as "Sign-in method".
Click the settings icon and go to "Project settings".
Scroll down to "Your apps" section, and select the app.
Click "Add fingerprint".
Check that "Package name" is correct.
Download the google-services.json file.
Firebase, add Android keystore&#39;s SHA-1 to your project

iOS
Read below on how to set up Google Sign In for your iOS app.

When using Firebase
When not using Firebase
Sign in to Firebase Console and open your project.
Ensure that in the "Authentication" menu, "Google" is enabled as "Sign-in method".
Click the settings icon and go to "Project settings".
Scroll down to "Your apps" section, and select the app.
Check that "Bundle ID" is correct.
Download the GoogleService-Info.plist file.
Web Client ID
For some use cases, a Web Client ID is needed (provided to the configure() call). To obtain a Web Client ID, go to Google Cloud Console and find an existing one (it may have been already created by Firebase) or create a new OAuth Client ID of type Web.

Summary
At the end of this guide, regardless of whether you use Firebase, when you visit Google Cloud Console, you should have in the "OAuth 2.0 Client IDs" section:

Android OAuth Client ID(s) with SHA-1 fingerprints
iOS OAuth Client ID(s) with iOS URL scheme
Web Client ID


---- 
Universal Google sign in
This is Google's recommended way to implement Google Sign In. This API is available on Android, iOS, macOS and web (with a little extra work described below). It is a replacement for the Original Google sign in. The module APIs are named GoogleOneTapSignIn for historical reasons.

tip
The functionality covered in this page is available in the licensed version. You can get a license here ⭐️.

On Android, it is built on top of the new Credential Manager APIs.

On Apple (iOS and macOS), it is built on top of the Google Sign In SDK for iOS and macOS.

On the web, it covers both the One-tap flow and the Google Sign-In button.

Note that on Apple and Android, you can combine the Universal sign in methods with those one from the Original Google Sign In. To do that, use the Universal sign in to sign in the user. Then call signInSilently() and then (for example) getCurrentUser() to get the current user's information. However, this shouldn't be necessary because this module should cover all your needs. Please open an issue if that's not the case.

example of importing the module
import {
  GoogleOneTapSignIn,
  statusCodes,
  type OneTapUser,
} from '@react-native-google-signin/google-signin';

configure
signature: (params: OneTapConfigureParams) => void

It is mandatory to call configure before attempting to call any of the sign-in methods. This method is synchronous, meaning you can call e.g. signIn right after it. Typically, you would call configure only once, soon after your app starts.

webClientId is a required parameter. Use "autoDetect" for automatic webClientId detection.

If you're using neither Expo nor Firebase, you also need to provide the iosClientId parameter. All other parameters are optional.

Example of calling the configure() method
GoogleOneTapSignIn.configure({
  webClientId: 'autoDetect',
});

checkPlayServices
✨since v17.3.0

signature: (showErrorResolutionDialog?: boolean): Promise<PlayServicesInfo>

The behavior of checkPlayServices varies across platforms:

Android: The function resolves if the device has Play Services installed and their version is >= the minimum required version. Otherwise, it rejects with statusCodes.PLAY_SERVICES_NOT_AVAILABLE error code, and more information in userInfo field (see below).
On Android, presence of up-to-date Google Play Services is required to call any of the provided authentication and authorization methods. It is therefore necessary to call checkPlayServices any time prior to calling the authentication / authorization methods and only call those if checkPlayServices is successful.

The showErrorResolutionDialog parameter (default true) controls whether a dialog that helps to resolve an error is shown (only in case the error is user-resolvable).

Some errors are user-resolvable (e.g. when Play Services are outdated, or disabled) while other errors cannot be resolved (e.g. when the phone doesn't ship Play Services at all - which is the case with some device vendors).

Dialog screenshots
Apple: Play Services are an Android-only concept and are not needed on Apple. Hence, the method always resolves with:
{
  minRequiredVersion: -1,
  installedVersion: -1,
}

Web: resolves (with the same value as on Apple) when the Google Client Library is loaded, rejects otherwise.
Example of showPlayServicesUpdateDialog() method
await GoogleOneTapSignIn.showPlayServicesUpdateDialog();

signIn
signature: (params?: OneTapSignInParams) => Promise<OneTapResponse>

Platform	Behavior
Android	Attempts to sign in user automatically, without interaction. Docs.
Apple	Attempts to restore a previous user sign-in without interaction. Docs.
Web	Attempts to sign in user automatically, without interaction. Docs. If none is found, presents a sign-in UI. Read below for web support.
Returns a Promise that resolves with OneTapResponse or rejects in case of error.

If there is no user that was previously signed in, the promise resolves with NoSavedCredentialFound object. In that case, you can call createAccount to start a flow to create a new account. You don't need to call signIn as a response to a user action - you can call it when your app starts or when suitable.

UI screenshots
Example code snippet
Example of calling the signIn() method
import {
  GoogleOneTapSignIn,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
} from '@react-native-google-signin/google-signin';

// Somewhere in your code
const signIn = async () => {
  try {
    await GoogleOneTapSignIn.checkPlayServices();
    const response = await GoogleOneTapSignIn.signIn();

    if (isSuccessResponse(response)) {
      // read user's info
      console.log(response.data);
    } else if (isNoSavedCredentialFoundResponse(response)) {
      // Android and Apple only.
      // No saved credential found (user has not signed in yet, or they revoked access)
      // call `createAccount()`
    }
  } catch (error) {
    console.error(error);
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.ONE_TAP_START_FAILED:
          // Android-only, you probably have hit rate limiting.
          // You can still call `presentExplicitSignIn` in this case.
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // Android: play services not available or outdated.
          // Get more details from `error.userInfo`.
          // Web: when calling an unimplemented api (requestAuthorization)
          // or when the Google Client Library is not loaded yet.
          break;
        default:
        // something else happened
      }
    } else {
      // an error that's not related to google sign in occurred
    }
  }
};

Utility Functions
tip
There are 4 helper functions available:

isErrorWithCode for processing errors
isSuccessResponse for checking if a response represents a successful operation. Same as checking response.type === 'success'.
isNoSavedCredentialFoundResponse for checking if a response represents no saved credentials case. Same as checking response.type === 'noSavedCredentialFound'.
isCancelledResponse for checking if a response represents user cancellation case. Same as checking response.type === 'cancelled'.
createAccount
signature: (params?: OneTapCreateAccountParams) => Promise<OneTapResponse>

Platform	Behavior
Android	Starts a flow to sign in with your app for the first time (to create a user account). It offers a list of user accounts to choose from (multiple Google accounts can be logged in on the device).
Apple	Starts an interactive sign-in flow. Docs. It offers a list of user accounts to choose from (multiple Google accounts can be logged in on the device).
Web	Presents a one-tap prompt and waits for user interaction (it will not sign in automatically). The prompt has a slightly different styling than with signIn (configrable via the context param). Read below for web support.
You don't need to call createAccount as a response to a user action - you can call it some time after your app starts (Though keep in mind the way the dialog is presented on iOS might be inconvenient to users if they didn't ask for it) or when suitable.

Use createAccount if signIn resolved with NoSavedCredentialFound result, as indicated in the code snippet above.

Returns a Promise that resolves with OneTapResponse or rejects in case of error.

UI screenshots
await GoogleOneTapSignIn.createAccount({
  nonce: 'your_nonce', // nonce is supported on all platforms!
});

presentExplicitSignIn
✨since v14.2.0

signature: (params?: OneTapExplicitSignInParams) => Promise<OneTapExplicitSignInResponse>

Platform	Behavior
Android	Presents the sign in dialog explicitly. This is useful when the user has hit rate limiting (ONE_TAP_START_FAILED) and the one-tap flow is thus not available, or if both signIn and createAccount resolve with NoSavedCredentialFound object - which happens (in the unlikely case) when no Google account is present on the device. This will prompt the user to add a Google account.
Apple	Starts an interactive sign-in flow. Same as createAccount.
Web	Presents a one-tap prompt. Same as createAccount.
Preferably, call this method only as a reaction to when user taps a "sign in with Google" button.

UI screenshots
await GoogleOneTapSignIn.presentExplicitSignIn({
  nonce: 'your_nonce', // nonce is supported on all platforms!
});

signOut
signature: (emailOrUniqueId: string) => Promise<null>

Signs out the current user. On the web, you need to provide the id or email of the user. On Android and Apple, this parameter does not have any effect.

Returns a Promise that resolves with null or rejects in case of error.

await GoogleOneTapSignIn.signOut(user.id);

requestAuthorization
✨since v15.0.0

signature: (params: RequestAuthorizationParams) => Promise<AuthorizationResponse>

The underlying Android SDK separates authentication and authorization - that means that on Android you can request an access token and call Google APIs on behalf of the user without previously signing the user in.

This method is used to request extra authorization from the user. Use this on Android to obtain server-side access (offline access) to the user's data or for requesting an access token that has access to additional scopes.

Platform	Behavior
Android	Presents a modal that asks user for additional access to their Google account. Uses AuthorizationRequest.Builder.
Apple	Calls addScopes. The resulting accessToken has access to the requested scopes. Use this if you want to read more user metadata than just the basic info.
Web	Not implemented at the moment.
There are minor differences between the Android and Apple implementations stemming from the underlying Google SDKs. For example, Apple returns all granted scopes, while Android may only return the scopes that were requested.

UI screenshots
Automatic webClientId & iosClientId detection
✨since v15.2.0 for webClientId, 18.2.0 for iosClientId

If you use Expo (with the config plugin and prebuild), or if you're using Firebase, you don't need to provide the iosClientId parameter to the configure method.

Additionally, this module can automatically detect the webClientId from Firebase's configuration file (does not work on web where you need to provide it explicitly).

This is useful if you're using Firebase and want to avoid manually setting the webClientId in your code, especially if you have multiple environments (e.g. staging, production).

To use this feature:

Add WEB_CLIENT_ID entry to the GoogleService-Info.plist file.
On Android, the google-services.json file already contains the web client ID information. Unfortunately, it's not the case on iOS, so we need to add it ourselves.

Open the GoogleService-Info.plist in your favorite text editor and add the following:

<key>WEB_CLIENT_ID</key>
<string>your-web-client-id.apps.googleusercontent.com</string>

pass "autoDetect" as the webClientId parameter.
tip
As explained above, iosClientId can also be detected automatically - simply do not pass any iosClientId value. The reason webClientId is a required parameter is API uniformity across all platforms.

Web support
Providing a unified API across all platforms is a bit more tricky than it may seem. The web experience is different from the mobile one, and so are the underlying APIs.

On the web, the GoogleOneTapSignIn sign in functions are not Promise-based but callback-based as seen below. That means they return void and you need to provide callbacks for success and error handling.

Still, the parameter and result types are the same as for native, allowing to reuse the logic for both success and error handling across all platforms.

note
The implementation has been migrated to FedCM though you can disable this via use_fedcm_for_prompt parameter.

To implement web support, follow these steps:

Call GoogleOneTapSignIn.signIn upon page load. This attempts to present the One-tap UI. It also sets up a listener for authentication events and calls the onSuccess callback when the user signs in (either with the One-tap flow or the Sign-In button).
If you do not want to present the one-tap UI, pass skipPrompt: true in the OneTapSignInParams object. This only sets up the listener for authentication events, and then relies on the user signing in via the WebGoogleSigninButton.

warning
You should display the One Tap UI on page load or other window events, instead of it being displayed by a user action (e.g. a button press). Otherwise, you may get a broken UX. Users may not see any UI after a user action, due to globally opt-out, cool-down, or no Google session.

useEffect(() => {
  GoogleOneTapSignIn.configure({
    webClientId,
    iosClientId: config.iosClientId,
  });
  if (Platform.OS === 'web') {
    GoogleOneTapSignIn.signIn(
      {
        ux_mode: 'popup',
      },
      {
        onResponse: (response) => {
          if (response.type === 'success') {
            console.log(response.data);
          }
        },
        onError: (error) => {
          // handle error
        },
        momentListener: (moment) => {
          console.log('moment', moment);
        },
      },
    );
  }
}, []);

Optionally, you can provide a momentListener callback function. The callback is called when important events take place. See reference.

Render the WebGoogleSigninButton component
One-tap UI may not always be available: This happens if you disable it (skipPrompt), when user has opted out or when they cancel the prompt several times in a row, entering the cooldown period.

WebGoogleSigninButton serves as a fallback. Tapping it opens the regular Google Sign-In dialog (or redirect, based on ux_mode param). When user signs in, the onResponse callback is called.

info
The reason the GoogleOneTapSignIn.signIn api is callback-based rather than promise-based is that it's possible to get into an "error" state (when one-tap is not available) and later get a successful sign in from the button flow. Because of how the Google Sign In for web SDK is done, modeling this with a promise-based api is not possible.

Original Google sign in

This module exposes

Legacy Google Sign-In for Android. The underlying SDK is deprecated but remains functional.
Google Sign-In SDK for iOS and macOS (macOS support is only available to in the paid version).
imports example
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

configure
signature: (options: ConfigureParams) => void

It is mandatory to call this method before attempting to call signIn() and signInSilently(). This method is synchronous, meaning you can call signIn / signInSilently right after it. Typically, you would call configure only once, soon after your app starts. All parameters are optional.

Example usage with default options: you'll get user email and basic profile info.

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure();

An example with all options enumerated:

GoogleSignin.configure({
  webClientId: '<FROM DEVELOPER CONSOLE>', // client ID of type WEB for your server. Required to get the `idToken` on the user object, and for offline access.
  scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  hostedDomain: '', // specifies a hosted domain restriction
  forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
  accountName: '', // [Android] specifies an account name on the device that should be used
  iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. "GoogleService-Info-Staging"
  openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
  profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
});


* forceCodeForRefreshToken docs

signIn
signature: (options: SignInParams) => Promise<SignInResponse>

Prompts a modal to let the user sign in into your application. Resolved promise returns an SignInResponse object. Rejects with an error otherwise.

signIn example
// import statusCodes along with GoogleSignin
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Somewhere in your code
const signIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response)) {
      setState({ userInfo: response.data });
    } else {
      // sign in was cancelled by user
    }
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          // operation (eg. sign in) already in progress
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // Android only, play services not available or outdated
          break;
        default:
        // some other error happened
      }
    } else {
      // an error that's not related to google sign in occurred
    }
  }
};

Utility Functions
tip
There are 4 helper functions available:

isErrorWithCode for processing errors
isSuccessResponse for checking if a response represents a successful operation. Same as checking response.type === 'success'.
isNoSavedCredentialFoundResponse for checking if a response represents no saved credentials case. Same as checking response.type === 'noSavedCredentialFound'.
isCancelledResponse for checking if a response represents user cancellation case. Same as checking response.type === 'cancelled'.
addScopes
signature: (options: AddScopesParams) => Promise<SignInResponse | null>

This method resolves with SignInResponse object or with null if no user is currently logged in.

You may not need this call: you can supply required scopes to the configure call. However, if you want to gain access to more scopes later, use this call.

Example:

const response = await GoogleSignin.addScopes({
  scopes: ['https://www.googleapis.com/auth/user.gender.read'],
});

signInSilently
signature: () => Promise<SignInSilentlyResponse>

May be called e.g. after of your main component mounts. This method returns a Promise that resolves with the SignInSilentlyResponse object and rejects with an error otherwise.

To see how to handle errors read signIn() method

const getCurrentUser = async () => {
  try {
    const response = await GoogleSignin.signInSilently();
    if (isSuccessResponse(response)) {
      setState({ userInfo: response.data });
    } else if (isNoSavedCredentialFoundResponse(response)) {
      // user has not signed in yet, or they have revoked access
    }
  } catch (error) {
    // handle errror
  }
};

hasPreviousSignIn
signature: () => boolean

This synchronous method may be used to find out whether some user previously signed in.

Note that hasPreviousSignIn() can return true but getCurrentUser() can return null, in which case you can call signInSilently() to recover the user. However, it may happen that calling signInSilently() rejects with an error (e.g. due to a network issue).

const hasPreviousSignIn = async () => {
  const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
  setState({ hasPreviousSignIn });
};

getCurrentUser
signature: () => User | null

This is a synchronous method that returns null or User object of the currently signed-in user.

const getCurrentUser = async () => {
  const currentUser = GoogleSignin.getCurrentUser();
  setState({ currentUser });
};

clearCachedAccessToken
signature: (accessTokenString: string) => Promise<null>

This method only has an effect on Android. You may run into a 401 Unauthorized error when a token is invalid. Call this method to remove the token from local cache and then call getTokens() to get fresh tokens. Calling this method on iOS does nothing and always resolves. This is because on iOS, getTokens() always returns valid tokens, refreshing them first if they have expired or are about to expire (see docs).

getTokens
signature: () => Promise<GetTokensResponse>

Resolves with an object containing { idToken: string, accessToken: string, } or rejects with an error. Note that using accessToken for identity assertion on your backend server is discouraged.

signOut
signature: () => Promise<null>

Signs out the current user.

const signOut = async () => {
  try {
    await GoogleSignin.signOut();
    setState({ user: null }); // Remember to remove the user from your app's state as well
  } catch (error) {
    console.error(error);
  }
};

revokeAccess
signature: () => Promise<null>

Removes your application from the user authorized applications. Read more about it here and here.

const revokeAccess = async () => {
  try {
    await GoogleSignin.revokeAccess();
    // Google Account disconnected from your app.
    // Perform clean-up actions, such as deleting data associated with the disconnected account.
  } catch (error) {
    console.error(error);
  }
};

hasPlayServices
signature: (options: HasPlayServicesParams) => Promise<boolean>

Checks if device has Google Play Services installed. Always resolves to true on iOS.

Presence of up-to-date Google Play Services is required to show the sign in modal, but it is not required to perform calls to configure and signInSilently. Therefore, we recommend to call hasPlayServices directly before signIn.

try {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // google services are available
} catch (err) {
  console.error('play services are not available');
}

hasPlayServices accepts one parameter, an object which contains a single key: showPlayServicesUpdateDialog (defaults to true). When showPlayServicesUpdateDialog is set to true the library will prompt the user to take action to solve the issue, as seen in the figure below.

You may also use this call at any time to find out if Google Play Services are available and react to the result as necessary.

prompt install


--- 
Advanced security
✨since v18.2.0

There are 2 security-related features available:

Custom nonce (on all platforms)
App Check for iOS
Custom nonce
Nonce (number used once) is a security measure used to mitigate replay attacks and to associate a Client session with an ID Token.

The authorization APIs in Universal Google Sign-In for Apple, Android and web allow you to specify a nonce.

Example usage:

const response = await GoogleOneTapSignIn.createAccount({
  nonce: getUrlSafeNonce(),
});

getUrlSafeNonce() generates a URL-safe nonce. It can be implemented using expo-crypto or react-native-get-random-values:

expo-crypto
react-native-get-random-values
import * as Crypto from 'expo-crypto';

export function getUrlSafeNonce(byteLength = 32) {
  if (byteLength < 1) {
    throw new Error('Byte length must be positive');
  }

  const randomBytes = Crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]/g, '');
}

Usage with Supabase
Auth providers such as Supabase require passing SHA-256 hash (digest) of the nonce (source). This can be done as follows:

import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';

export const getNonce = async () => {
  // `rawNonce` goes to Supabase's signInWithIdToken().
  // Supabase makes a hash of `rawNonce` and compares it with the `nonceDigest`
  // which is included in the ID token from RN-google-signin.
  const rawNonce = getUrlSafeNonce();
  // `nonceDigest` goes to the `nonce` parameter in RN-google-signin APIs
  const nonceDigest = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  return { rawNonce, nonceDigest };
};

App Check for iOS (advanced)
App Check helps protect your apps from abuse by preventing unauthorized clients from authenticating using Google Sign-in: only the apps you've authorized can acquire access tokens and ID tokens from Google's OAuth 2.0 and OpenID Connect endpoint.

Read more about App Check to understand it.

Setup
To set up App Check:

Set up Google API Console / Firebase console by following "1. Set up your project". Do not follow step 2.

Add App Attest capability to your app (as in here). If you're using Expo, the capability can be added according to the iOS capabilities documentation.

(skip if you use Expo): Ensure that GIDClientID (the iOS client ID) is set in your Info.plist. Expo config plugin does this for you.

Usage
Call GoogleOneTapSignIn.enableAppCheck() as shown below. Do this early, before invoking any authentication apis. The call either resolves when it succeeds or rejects with an error. On platforms other than iOS, the method is a no-op and resolves.

Production environment
Debug provider (recommended)
Debug provider (alternative)
await GoogleOneTapSignIn.enableAppCheck();

Enable App Check enforcement
Read the official documentation to understand how to enforce App Check.

-------- 
Migration guides
There are 2 migrations described here: from Original to Universal Sign In and from the old JS API to the new JS API.

Migrating from Original to Universal Sign In
Migrating from Original to Universal module is mostly about changing the method names: the table summarizes the mapping from Original module's calls to the Universal (OneTap) module's calls:

Original Method	Universal (OneTap) Method	Notes
configure	configure	Same functionality.
signInSilently	signIn	Universal's signIn attempts sign in without user interaction.
signIn	createAccount	Universal's createAccount is for first-time sign in (but can be used for existing users too).
addScopes	requestAuthorization	Similar functionality, different parameters. On Android, you can call requestAuthorization without being signed in!
hasPlayServices	checkPlayServices	Same functionality, different name.
getCurrentUser	Use signIn response	Manage the current user state yourself, or through libraries like Firebase Auth or Supabase Auth.
getTokens	Use signIn or requestAuthorization	Tokens are included in the response object.
signOut	signOut	Universal requires email/id parameter on web.
revokeAccess	Not yet provided by Google.	See here.
hasPreviousSignIn	Use signIn response	Check for noSavedCredentialFound response type.
clearCachedAccessToken	Not provided, presumably not needed.	-
Migrating to new JS API
Version 13 introduced a new JS API, which changes some method response signatures and makes minor changes to error handling (details here). If you're upgrading from version 12 or earlier, you'll need to make some minor adjustments.

Universal Sign In
Add the configure method to your code. This method is required to be called to configure the module.

Change the signIn, createAccount, presentExplicitSignIn, and requestAuthorization methods to use the new apis: That means that the data you previously accessed directly on userInfo (see below - for example userInfo.name) will now be nested in userInfo.data (e.g. userInfo.data.name). See OneTapResponse type:

const signIn = async () => {
  try {
-    const userInfo = await GoogleOneTapSignIn.signIn({
-      webClientId: `autoDetect`, // works only if you use Firebase
-      iosClientId: config.iosClientId, // only needed if you're not using Firebase
-    });
-    setState({ userInfo }); // use e.g. `userInfo.name`
+    const response = await GoogleOneTapSignIn.signIn();
+
+    if (response.type === 'success') {
+      setState({ userInfo: response.data });
+    } else if (response.type === 'noSavedCredentialFound') {
+      // Android and Apple only. No saved credential found, call `createAccount`
+    }

  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
-        case statusCodes.NO_SAVED_CREDENTIAL_FOUND:
-          // Android and Apple only. No saved credential found, call `createAccount`
-          break;
-        case statusCodes.SIGN_IN_CANCELLED:
-          // sign in was cancelled
-          break;
        case statusCodes.ONE_TAP_START_FAILED:
          // Android-only, you probably have hit rate limiting.
          // On Android, you can still call `presentExplicitSignIn` in this case.
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          // Android-only: play services not available or outdated
          // Web: when calling an unimplemented api (requestAuthorization)
          break;
        default:
        // something else happened
      }
    } else {
      // an error that's not related to google sign in occurred
    }
  }
};

If requesting offline access in requestAuthorization on Android, add enabled: true:
await GoogleOneTapSignIn.requestAuthorization({
  offlineAccess: {
+      enabled: true,
  },
});

Original Sign In
Follow step 2. from above for signIn, addScopes and signInSilently methods.
remove SIGN_IN_REQUIRED mentions. This case is now handled with NoSavedCredentialFound object:
const getCurrentUserInfo = async () => {
  try {
    const response = await GoogleSignin.signInSilently();
+    if (isSuccessResponse(response)) {
+        setState({ userInfo: response.data })
+    } else if (isNoSavedCredentialFoundResponse(response)) {
+        // user has not signed in yet
+    }
-    setState({ userInfo: response });
  } catch (error) {
-    if (error.code === statusCodes.SIGN_IN_REQUIRED) {
-      // user has not signed in yet
-    } else {
-      // some other error
-    }
  }
};


----------------------


Testing
Setting up the mock
If you want to write JS-level tests that depend on Google Sign In, you need to mock the functionality of the native module - this is because the native code cannot run in Node environment.

This library ships with a Jest mock that you can add to the setupFiles array in your Jest config.

By default, the mock behaves as if the calls were successful and returns mock user data.

jest.config.js|ts|mjs|cjs|json
{
  "setupFiles": [
    "./node_modules/@react-native-google-signin/google-signin/jest/build/jest/setup.js"
  ]
}

Writing tests
You can use @testing-library/react-native to write tests for React components that use React Native Google Sign In. Minimal example (make sure to set up the mock first):

App.test.js
import {
  GoogleOneTapSignIn,
  OneTapResponse,
} from '@react-native-google-signin/google-signin';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button, Text } from 'react-native';
import { useState } from 'react';

function GoogleSignInComponent() {
  const [userInfo, setUserInfo] = useState<OneTapResponse | undefined>();

  return (
    <>
      <Button
        title="Sign in with Google"
        onPress={async () => {
          GoogleOneTapSignIn.configure({
            webClientId: 'autoDetect',
          });
          const userInfo = await GoogleOneTapSignIn.signIn();
          setUserInfo(userInfo);
        }}
      />
      {userInfo && <Text>{userInfo.data?.user.name}</Text>}
    </>
  );
}

it('GoogleSignInComponent should display user name after signing in', async () => {
  // Render the component
  render(<GoogleSignInComponent />);

  const expectedUserName = 'mockFullName';
  // Verify user name is not displayed initially
  expect(screen.queryByText(expectedUserName)).toBeNull();

  // Find and press the sign-in button
  const signInButton = screen.getByText('Sign in with Google');
  fireEvent.press(signInButton);

  // verify the user name is displayed
  const userName = await screen.findByText(expectedUserName);
  expect(userName).toBeTruthy();
});

Edit this page



----------------


Integration notes
Calling the methods exposed by this package may involve remote network calls and you should thus take into account that such calls may take a long time to complete (e.g. in case of poor network connection).

idToken Note: idToken is not null only if you specify a valid webClientId. webClientId corresponds to your server clientID on the developers console. It HAS TO BE of type WEB

Read iOS documentation and Android documentation for more information

serverAuthCode Note: serverAuthCode is not null only if you specify a valid webClientId and set offlineAccess to true. Once you get the auth code, you can send it to your backend server and exchange the code for an access token. Only with this freshly acquired token can you access user data.

Read iOS documentation and Android documentation for more information.

Additional scopes
The default requested scopes are email and profile.

If you want to manage other data from your application (for example access user agenda or upload a file to drive) you need to request additional permissions. This can be accomplished by adding the necessary scopes when configuring the GoogleSignin instance.

Visit https://developers.google.com/identity/protocols/googlescopes or https://developers.google.com/oauthplayground/ for a list of available scopes.




-----------------


ERROR HANDLING 
When catching errors thrown by the library, it's strongly recommended not to immediately present them using the Alert module. This is because on Android, when transitioning from the Google Sign-In flow to your app, the current Activity may be null which would cause the alert call to be a noop. You can work around this by presenting the alert after a delay, or handling the error differently.

isErrorWithCode(value)
TypeScript helper to check if the passed parameter is an instance of Error which has the code property. All errors thrown by this library have the code property, which contains a value from statusCodes or some other string for the less-usual errors.

isErrorWithCode can be used to avoid as casting when you want to access the code property on errors returned by the module.

import {
  isErrorWithCode,
  GoogleSignin,
} from '@react-native-google-signin/google-signin';

try {
  const userInfo = await GoogleSignin.signIn();
  // do something with userInfo
} catch (error) {
  if (isErrorWithCode(error)) {
    // here you can safely read `error.code` and TypeScript will know that it has a value
  } else {
    // this error does not have a `code`, and does not come from the Google Sign in module
  }
}

Status Codes
import { statusCodes } from '@react-native-google-signin/google-signin';

Status codes are useful when determining which kind of error has occurred during the sign-in process. Under the hood, these constants are derived from native GoogleSignIn error codes and are platform-specific. Always compare error.code to statusCodes.* and do not rely on the raw value of error.code.

See example usage.

Name	Description
IN_PROGRESS	Trying to invoke another operation (e.g. signInSilently) when previous one has not yet finished. If you call e.g. signInSilently twice, two calls to signInSilently in the native module will be done. The promise from the first call to signInSilently will be rejected with this error, and the second will resolve / reject with the result of the native call.
PLAY_SERVICES_NOT_AVAILABLE	Play services are not available or outdated. This happens on Android, or on the web when you're calling the exposed APIs before the Client library is loaded.
Status codes specific to Universal sign in
Name	Description
ONE_TAP_START_FAILED	Thrown only on Android when the Universal sign in UI cannot be presented. This happens during the cooldown period. You can still call presentExplicitSignIn in that case.
See example usage.


----------------
FAQ / Troubleshooting
Android
Login does not work when downloading from the Play Store.
See the next paragraph.

DEVELOPER_ERROR or code: 10 or Developer console is not set up correctly error message
This is always (!always!) a configuration mismatch between your app and the server-side setup (in Firebase or Google Cloud console).

Follow these pointers:

Make sure that your SHA-1 (NOT SHA-256!) certificate fingerprints and Android package name you entered in Firebase Console / Google Cloud Console are correct.
Add the SHA-1 from the output of this command to your Firebase / Google Cloud Console. You should be able to recognize the SHA-1 - do not add a hash if you're not sure of its origin.
Follow the setup guide and perform its steps once again.
Search the issue tracker for old reports of the error.
If you're passing webClientId in the configuration object to GoogleSignin.configure(), make sure it's correct and that it is of type web (NOT Android!). You can get your webClientId from Google Developer Console. It is listed under "OAuth 2.0 client IDs".
If you are using Firebase, you need to add Google as a Sign-in method in Firebase itself (Build -> Authentication -> Sign-in method). If you have already created an app, you will be prompted for fingerprints and then you will get a new google-services.json which you need to use in your app instead of the old one.
Login does not work when using Internal App Sharing.
If you get a DEVELOPER_ERROR when using Internal App Sharing, it is because Google resigns your application with its own key.

See the previous paragraph.

"A non-recoverable sign in failure occurred"
See this comment. Or this SO question.

Changing play-services-auth version
See "Choose Dependency versions" above.

Package name !== application id
When adding a new oauth client, google asks you to add your package name. In some cases your package name is not equal to your application id. Check if your package name in the AndroidManifest.xml is the same as your application/bundle id. Find your application id in the play console or android/app/build.gradle. The format looks like com.yourapp.id.

iOS
On iOS the app crashes when tapping Sign In button
Along with "Your app is missing support for the following URL schemes" error in console.

Your Url Schemes configuration is incorrect.

If you use Expo, make sure that the config plugin is configured correctly.

In vanilla React Native projects, add URL type like this.


---------

END
