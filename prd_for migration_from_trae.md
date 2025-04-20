1. Configure Branch Dashboard
Start by configuring the Branch Dashboard for your application:

iOS Branch Dashboard Configuration steps.

Android Branch Dashboard Configuration steps.

Make sure to configure your default link settings as part of the setup process.

2. Install Branch
Please choose one of the following integration methods to install the Branch React Native SDK into your app.

Pure React Native App
Use one of the following commands to install the module:

NPM
npm install react-native-branch
NpmCopy
Yarn
yarn add react-native-branch
YarnCopy
Note: The react-native-branch module requires your react-native version to be greater than or equal to 0.60.

Native iOS App With CocoaPods
Add the following code to your Podfile in order to install Branch using CocoaPods:

platform :ios, '11.0'

target 'APP_NAME' do
  # if swift
  use_frameworks!

  pod 'react-native-branch', path: '../node_modules/react-native-branch'
end
PodfileCopy
Run the pod install command to regenerate the Pods project with the new dependencies. Please note that the location of node_modules relative to your Podfile may vary.

Expo Framework
Branch does support applications that use Expo, but please note that we do not maintain the react-native-branch plugin for Expo. This means we cannot fix any issues that arise related to this plugin.

To learn more, visit Expo's react-native-branch plugin GitHub page.

3. Configure App
Complete the app configuration steps for the relevant platform(s) you are using.

iOS Configuration
To configure iOS:

Configure bundle identifier.

Configure associated domains.

Configure Info.plist file.

Add a branch.json file to your project, which you will use to access certain Branch configuration settings:

Create an empty file called branch.json.

Add the file to your project using Xcode. Within your project, navigate to File → Add Files.

Select the branch.json file and make sure every target in your project that uses Branch is selected.

Click Add.

Android Configuration
To configure Android:

Add dependencies.

Configure AndroidManifest.xml file.

Add a branch.json file to your project, which you will use to access certain Branch configuration settings.

Create an empty file called branch.json.

Place the file in the src/main/assets folder of your app.

4. Initialize Branch
Use the code samples in this section to initialize the SDK in your application(s).

Branch Initialization on iOS
To initialize Branch on iOS, add the following to your app's AppDelegate file:

Swift
Objective-C
#import "AppDelegate.h"
#import <RNBranch/RNBranch.h>
  
@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    // Optional: Uncomment next line to use test instead of live key
    // [RNBranch useTestInstance];
    [RNBranch initSessionWithLaunchOptions:launchOptions isReferrable:YES];
    NSURL *jsCodeLocation;
    //...
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  [RNBranch application:app openURL:url options:options];
  return YES;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  [RNBranch continueUserActivity:userActivity];
  return YES;
}

@end
Objective-C
Branch Initialization on Android
To initialize Branch on Android, you need to:

Add Branch to your MainApplication.java file or MainApplication.kt file:

Java
Kotlin
import io.branch.rnbranch.*

// ...

override fun onCreate() {
    super.onCreate()
    RNBranchModule.getAutoInstance(this)

    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        // If you opted-in for the New Architecture, we load the native entry point for this app
        load()
    }
  
    // Enable logging for debugging (remove in production)
    RNBranchModule.enableLogging();
  
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
}

// ...
Kotlin
Add Branch to your MainActivity.java file or MainActivity.kt file:

Java
Kotlin
import io.branch.rnbranch.*
import android.content.Intent

// ...

override fun onStart() {
    super.onStart()
    RNBranchModule.initSession(getIntent().getData(), this)
}

override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    RNBranchModule.reInitSession(this)
}

// ...
Kotlin
5. Validate Integration
Use the guides below to validate that your SDK integration(s) are properly configured:

iOS
iOS Validation

iOS Testing

iOS Troubleshooting

Android
Android Validation

Android Testing

Android Troubleshooting

Common Build Problems
Be sure to update from < 2.0.0 if your app used an earlier version of react-native-branch. In version 2.x, the native SDKs are embedded in the NPM module and must not also be added from elsewhere (Gradle, CocoaPods, etc.).

Note that when using the React pod in a native app, the name of the native SDK pod is Branch-SDK, not Branch, and it comes from node_modules, not the CocoaPods repo.

Starting with React Native 0.40, all external iOS headers in Objective-C must be imported as #import . This applies to React Native headers as well as the  header from this SDK.

If you upgraded from RN < 0.40 manually, without adjusting your Xcode project settings, you may still be importing headers with double quotes. This probably indicates a problem with your settings.

The react-native-git-upgrade tool from NPM may be used to update dependencies as well as project settings.

On Android, when using Proguard in release builds, depending on your build settings, it may be necessary to add one or both of these lines to your android/app/proguard-rules.pro file: