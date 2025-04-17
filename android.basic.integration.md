Android Basic Integration 
Updated on Mar 12, 2025
Published on Feb 11, 2025
This page outlines the steps required to integrate the Branch Android SDK.

At the end, you will be ready to do things like send Branch Events and use Branch Deep Links.

Please note that some Branch Android SDK features require a Branch Growth Platform package. See our packaging page for details.

GitHub

SDK Size

Speed

Min. OS Version

Repo

~187kb for all features

Median 80ms to 250ms

API Level 21+

Older Versions
If you'd like to support down to Android API version 9, please pin to version 1.14.5 of the Branch Android SDK.

If you'd like to support Android API version 15, please pin to a 2.x version of the Branch Android SDK.

The minimum version we support for Branch Android SDK 3.x is Android version 16.

1. Configure Branch Dashboard
Start by configuring the Branch Dashboard for your application.

Configure the default link settings for your app within the Configuration page of the Branch Dashboard.

On the same page, confirm the "I have an Android App" and "Enable App Links" options are both selected. Fill in the values for "Android URI Scheme" and "Custom URL" based on your app.

Also enter your SHA256 Cert Fingerprint, using all caps for the characters.

2. Install Branch
To install Branch, import the Branch Android SDK into your app-level build.gradle (Groovy) or build.gradle.kts (Kotlin), noting the REPLACE code comments where you need to add your app's values:

Groovy
Kotlin
apply plugin: 'com.android.application'

android {
    compileSdkVersion 25
    buildToolsVersion "25.0.2"
    defaultConfig {
        applicationId "com.example.android" // REPLACE with your app ID
        minSdkVersion 16
        targetSdkVersion 25
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
	// Required for all Android apps:
	implementation 'io.branch.sdk.android:library:5.8.0' // Check for latest version before hard-coding
  
	implementation 'store.galaxy.samsung.installreferrer:samsung_galaxystore_install_referrer:4.0.0'
      
	// Required if your app is in the Google Play Store (tip: avoid using bundled play services libs):
	implementation 'com.google.android.gms:play-services-ads-identifier:18.0.1'
	// Alternatively, use the following lib for getting the AAID:
	// implementation 'com.google.android.gms:play-services-ads:17.2.0'
}
Groovy
Make sure you are using the latest version of io.branch.sdk.android:library by checking the version here.

3. Add Dependencies
At this stage, you can add certain dependencies to your Android app that will enable additional Branch Android SDK functionality.

Note: Some of these dependencies are already bundled into the Branch Android SDK.

Dependency

Description

Signature

Library Repository

Android Advertising ID (AAID)

In order for Branch to properly access the GAID value of a device, apps targeting Android 13+ will need to use the latest version
of the play-services-ads-identifier dependency or explicitly declare within the app's manifest file.

implementation "com.google.android.gms:play-services-ads-identifier:18.0.1"

maven { url 'https://maven.google.com/' }

Play Install Referrer Library

As of version 4.3.0, Google's Play Install Referrer Library is bundled into Branch Android SDK.
If you are using a version below 4.3.0, you must update your app's dependencies to include the Play Install Referrer Library.

implementation "com.android.installreferrer:installreferrer:2.2"

maven { url 'https://maven.google.com/' }

Huawei Mobile Services & Ads Kit

The Branch SDK supports Huawei devices without Google Mobile Services. This dependency will add Install Referrer support on the Huawei AppGallery store and attribution using OAID.
Ensure proguard rules are set.

implementation "com.huawei.hms:ads-identifier:3.4.39.302"

maven { url 'http://developer.huawei.com/repo/' }

Xiaomi GetApps Store Referrer

This dependency will add Install Referrer support on the Xiaomi GetApps store.
Please reach out to your Xiaomi representative for additional details.

implementation "com.miui.referrer:homereferrer:1.0.0.6"

maven { url 'https://repos.xiaomi.com/maven/‘ }

Samsung Galaxy Store Referrer

This dependency will add Install Referrer support on the Samsung Galaxy store
Please reach out to your Samsung representative for additional details.

implementation "store.galaxy.samsung.installreferrer:samsung_galaxystore_install_referrer:4.0.0"

Please reach out to your Samsung representative for the maven repo to add to your project level build.gradle

4. Configure App
To configure your app to use the Branch Android SDK, you will need to update your AndroidManifest.xml file.

To populate the file with the correct values, you will need to gather your:

App package name

Android URI scheme

The app.link domain associated with your app

The -alternate.app.link domain associated with your app

Branch Live Key

Branch Test Key

You can find these values for your app in your Branch Dashboard App Settings and Link Settings.

Use the sample code below for your AndroidManifest.xml file, making sure to replace every value that has a REPLACE comment associated with it:

<?xml version="1.0" encoding="utf-8"?>
<manifest
	xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.android">
	<uses-permission android:name="android.permission.INTERNET" />
	<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>

	<!-- REPLACE `android:name` with your app's package name -->
	<application
      		android:allowBackup="true"
      		android:name="com.example.android.CustomApplicationClass" 
      		android:icon="@mipmap/ic_launcher"
      		android:label="@string/app_name"
      		android:supportsRtl="true"
      		android:theme="@style/AppTheme">

		<!-- Launcher Activity to handle incoming Branch intents -->
		<activity
        		android:name=".LauncherActivity"
        		android:launchMode="singleTask"
        		android:label="@string/app_name"
        		android:theme="@style/AppTheme.NoActionBar"
        		android:exported="true">

			<intent-filter>
				<action android:name="android.intent.action.MAIN" />
				<category android:name="android.intent.category.LAUNCHER" />
			</intent-filter>

			<!-- Branch URI Scheme -->
			<intent-filter>
				<!-- If utilizing $deeplink_path please explicitly declare your hosts, or utilize a wildcard(*) -->
				<!-- REPLACE `android:scheme` with your Android URI scheme -->
				<data android:scheme="yourapp" android:host="open" />
				<action android:name="android.intent.action.VIEW" />
				<category android:name="android.intent.category.DEFAULT" />
				<category android:name="android.intent.category.BROWSABLE" />
			</intent-filter>

			<!-- Branch App Links - Live App -->
			<intent-filter android:autoVerify="true">
				<action android:name="android.intent.action.VIEW" />
				<category android:name="android.intent.category.DEFAULT" />
				<category android:name="android.intent.category.BROWSABLE" />
				<!-- REPLACE `android:host` with your `app.link` domain -->
				<data android:scheme="https" android:host="example.app.link" />
				<!-- REPLACE `android:host` with your `-alternate` domain (required for proper functioning of App Links and Deepviews) -->
				<data android:scheme="https" android:host="example-alternate.app.link" />
			</intent-filter>

			<!-- Branch App Links - Test App -->
			<intent-filter android:autoVerify="true">
				<action android:name="android.intent.action.VIEW" />
				<category android:name="android.intent.category.DEFAULT" />
				<category android:name="android.intent.category.BROWSABLE" />
				<data android:scheme="https" android:host="example.test-app.link" />
				<!-- REPLACE `android:host` with your `-alternate` domain (required for proper functioning of App Links and Deepviews) -->
				<data android:scheme="https" android:host="example-alternate.test-app.link" />
			</intent-filter>
		</activity>

		<!-- Branch init -->
		<!-- REPLACE `BranchKey` with the value from your Branch Dashboard -->
		<meta-data android:name="io.branch.sdk.BranchKey" android:value="key_live_XXX" />
		<!-- REPLACE `BranchKey.test` with the value from your Branch Dashboard -->
		<meta-data android:name="io.branch.sdk.BranchKey.test" android:value="key_test_XXX" />
		<!-- Set to `true` to use `BranchKey.test` -->
		<meta-data android:name="io.branch.sdk.TestMode" android:value="false" />

	</application>
	<queries>
		<intent>
			<action android:name="android.intent.action.SEND" />
			<data android:mimeType="text/plain" />
		</intent>
	</queries>
</manifest>
XMLCopy
Single Task Launch Mode & Activities

The Single Task mode instantiates the Main/Splash Activity only if it does not exist in the Activity Stack.

If the Activity exists in the background, every subsequent intent to the Activity just brings it to the foreground. You can read more about Single Task mode here.

If your app has multiple activities triggered by multiple intent filters with the same scheme, your app may run into a race condition when clicking on links that open the app (ex. Branch Links and custom deep links). To prevent this, make sure to implement the Branch Android SDK in the LauncherActivity.

5. Load Branch
To load Branch, import io.branch.referral.Branch and use the getAutoInstance() method in your CustomApplicationClass:

Java
Kotlin
package com.example.android;

import android.app.Application;
import io.branch.referral.Branch;

public class CustomApplicationClass extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // Branch logging for debugging
        Branch.enableLogging();

        // Branch object initialization
        Branch.getAutoInstance(this);
    }
}
Java
To learn more about the getAutoInstance() and getInstance() methods, visit our Android SDK Full Reference guide.

6. Initialize Branch
To initialize Branch, add the following code to your LauncherActivity:

Java
Kotlin
package com.example.android;

import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;

import org.json.JSONObject;

import io.branch.indexing.BranchUniversalObject;
import io.branch.referral.Branch;
import io.branch.referral.BranchError;
import io.branch.referral.util.LinkProperties;

public class LauncherActivity extends AppCompatActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_launcher);
	}

	@Override
	protected void onStart() {
		super.onStart();
		Branch.sessionBuilder(this).withCallback(new Branch.BranchUniversalReferralInitListener() {
			@Override
			public void onInitFinished(BranchUniversalObject branchUniversalObject, LinkProperties linkProperties, BranchError error) {
				if (error != null) {
					Log.e("BranchSDK_Tester", "branch init failed. Caused by -" + error.getMessage());
				} else {
					Log.i("BranchSDK_Tester", "branch init complete!");
					if (branchUniversalObject != null) {
						Log.i("BranchSDK_Tester", "title " + branchUniversalObject.getTitle());
						Log.i("BranchSDK_Tester", "CanonicalIdentifier " + branchUniversalObject.getCanonicalIdentifier());
						Log.i("BranchSDK_Tester", "metadata " + branchUniversalObject.getContentMetadata().convertToJson());
					}

					if (linkProperties != null) {
						Log.i("BranchSDK_Tester", "Channel " + linkProperties.getChannel());
						Log.i("BranchSDK_Tester", "control params " + linkProperties.getControlParams());
					}
				}
			}
		}).withData(this.getIntent().getData()).init();
	}

	@Override
	public void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		this.setIntent(intent);
		if (intent != null && intent.hasExtra("branch_force_new_session") && intent.getBooleanExtra("branch_force_new_session",false)) {
			Branch.sessionBuilder(this).withCallback(new BranchReferralInitListener() {
				@Override
				public void onInitFinished(JSONObject referringParams, BranchError error) {
					if (error != null) {
						Log.e("BranchSDK_Tester", error.getMessage());
					} else if (referringParams != null) {
						Log.i("BranchSDK_Tester", referringParams.toString());
					}
				}
			}).reInit();
		}
	}
}
Java
LauncherActivity vs Other Activities

Branch recommends initializing the session inside the LauncherActivity. This is the Activity that contains the intent filter android.intent.category.LAUNCHER in your AndroidManifest.xml file.

However, if your app requires it, session initialization can happen in a different Activity too, as long as that Activity is the one configured to open Branch Links using the intent filters in AndroidManifest.xml.

Note that in this case, if the app is opened organically, Branch will auto-initialize behind the scenes and calling sessionBuilder()…init() will return an error. This is because the SDK will already be initialized. The main exceptions are push notifications and intra-app linking.

Always Initialize Branch in onStart()

Initializing Branch in other Android lifecycle methods, like onCreate() or onResume(), will lead to unintended behavior. The onStart() method is what makes the Activity visible to the user, as the app prepares for the Activity to enter the foreground and become interactive.

To learn more, visit:

Branch FAQ

Android Developer Docs

If your app requires a different session initialization setup, please see the Delay Branch Initialization section of our Android Advanced Features guide.

7. Configure ProGuard
To collect the Google Advertising ID, you must ensure that ProGuard doesn't remove the necessary Google Ads class.

The surest way to do this is add it to your ProGuard rules. If your Application is enabled with ProGuard, add the following instruction to your proguard.cfg or proguard-rules.pro file:

-keep class com.google.android.gms.** { *; }
BashCopy
If you are adding support for Huawei devices without Google Mobile Services, please make sure to add the following to your ProGuard rules:

-keep class com.huawei.hms.ads.** { *; }
-keep interface com.huawei.hms.ads.** { *; }
BashCopy
8. Validate Integration
It's important to validate your Branch Android SDK integration after you've set it up, to make sure that data flows properly to the Branch Dashboard and you're able to start configuring Branch Deep Links and sending Branch Events.

Validation methods:

The Integration Status tab in the Branch Dashboard.

The Branch Android SDK's Integration Validation method.

The Branch Android SDK's Enable Logging method.

Branch's Link Debugger tool, which helps you confirm Branch Deep Link configuration, data, and routing.

For additional testing scenarios and tools, visit the Android Testing page.

If you're running into issues with your Branch Android SDK integration, start by looking at the Android Troubleshooting page.




Android Advanced Features 
Updated on Feb 18, 2025
Published on Feb 11, 2025
Overview
The Branch Android SDK exposes a set of methods specifically made for Android apps, which you can call using Kotlin or Java.

Prerequisites
Before you get started implementing the features on this page, you first need to:

Create a Branch Dashboard.

Integrate the Branch Android SDK into your mobile app.

Validate your Branch Android SDK integration.

Generate Signing Certificate
A signing certificate is required to use Android App Links with Branch.

To generate and use a signing certificate:

Navigate to your keystore file.

Run keytool -list -v -keystore my-release-key.keystore in the same directory as your keystore file.

This will generate a value that will look like AA:00:BB:11:CC:22.....

Copy the value and add it to your Branch Dashboard.

Set Initialization Metadata
Some third-party Data Integration Partners require setting certain identifiers before initializing the Branch Android SDK.

Do this using the setRequestMetadata() method.

Java
Kotlin
Branch.getInstance().setRequestMetadata("$analytics_visitor_id", "000001");
Java
Delay Branch Initialization
There are certain cases when you may want to delay the initialization of a Branch session. An example would be making an async call to retrieve data that needs to be passed to Branch as request metadata.

Warning: When you try to do this, you may run into an error that reads SDK already initialized. This happens because Branch is self-initializing the session when the Activity enters a RESUMED state. To avoid this, manually disable auto session initialization and initialize the session yourself after the async call finishes.

Note: The expectDelayedSessionInitialization() method must be called before establishing the Branch singleton within your application class's onCreate().

Java
Kotlin
package com.example.android;

import android.app.Application;
import io.branch.referral.Branch;

public class CustomApplicationClass extends Application {
	@Override
	public void onCreate() {
		super.onCreate();

		// Delay session initialization 
		Branch.expectDelayedSessionInitialization();

		// Branch object initialization
		Branch.getAutoInstance(this.getApplicationContext);
	}
}
Java
Use bnc.lt or Custom Domain
To use bnc.lt, add the following block to your AndroidManifest.xml file:

<activity android:name="com.yourapp.your_activity">
    <!-- App Link your activity to Branch links-->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
         <data android:scheme="https" android:host="bnc.lt" />
         <data android:scheme="http" android:host="bnc.lt" />
    </intent-filter>
</activity>
XMLCopy
To use a custom domain, add the following block to your AndroidManifest.xml file:

<activity android:name="com.yourapp.your_activity">
    <!-- App Link your activity to Branch links -->
  	<!-- Update with your own app name, which should match Branch Dashboard settings -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
         <data android:scheme="https" android:host="<YOUR.APP.COM>" />
         <data android:scheme="http" android:host="<YOUR.APP.COM>" />
    </intent-filter>
</activity>
XMLCopy
General Deep Linking
Branch Deep Links point to specific content that exists inside your app.

If a user clicks a Branch Deep Link and they have your app installed, the Branch Deep Link will take them directly to your app and the specific content featured in your ad.

If the user does not have your app installed, they will be routed to the fallback URL you specified in your Branch Dashboard.

Deep Link Prerequisites
Before you can create a Branch Deep Link, you first need to:

Create a BranchUniversalObject instance that will represent a unique piece of content:

Java
Kotlin
BranchUniversalObject buo = new BranchUniversalObject()
  .setCanonicalIdentifier("content/12345")
  .setTitle("My Content Title")
  .setContentDescription("My Content Description")
  .setContentImageUrl("https://lorempixel.com/400/400")
  .setContentIndexingMode(BranchUniversalObject.CONTENT_INDEX_MODE.PUBLIC)
  .setLocalIndexMode(BranchUniversalObject.CONTENT_INDEX_MODE.PUBLIC)
  .setContentMetadata(new ContentMetadata().addCustomMetadata("key1", "value1"));
Java
Create a BranchLinkProperties instance that will contain info about the URL associated with the content:

Java
Kotlin
LinkProperties lp = new LinkProperties()
  .setChannel("facebook")
  .setFeature("sharing")
  .setCampaign("content 123 launch")
  .setStage("new user")
  .addControlParameter("$desktop_url", "https://example.com/home")
  .addControlParameter("custom", "data")
  .addControlParameter("custom_random", Long.toString(Calendar.getInstance().getTimeInMillis()));
Java
Create Deep Links
Once you have a BranchUniversalObject and a BranchLinkProperties instance, you can use the getShortUrl() method to create a Branch Deep Link.

Java
Kotlin
BranchUniversalObject buo = new BranchUniversalObject().setCanonicalIdentifier("content/12345");
LinkProperties lp = new LinkProperties().setCampaign("content 123 launch");

// Generate a short URL for the Branch Universal Object
String url = buo.getShortUrl(this.getApplicationContext, lp);
Java

For more about the getShortUrl() method, visit the Android Full Reference guide.

Read Deep Links
You can read a Branch Deep Link to retrieve data from it. This must happen after Branch initialization.

The best practice is to get the data from the listener, since this will prevent a possible race condition.

Java
Kotlin
// Listener within Main Activity's `onStart`
Branch.sessionBuilder(this).withCallback(new Branch.BranchReferralInitListener() {
	@Override
	public void onInitFinished(JSONObject referringParams, BranchError error) {
		if (error == null) {
			Log.i("BRANCH SDK", referringParams.toString());
		} else {
			Log.i("BRANCH SDK", error.getMessage());
		}
	}
}).withData(this.getIntent().getData()).init();

// Latest params
JSONObject sessionParams = Branch.getInstance().getLatestReferringParams();
Java
The getLatestReferringParams() method returns Branch Deep Link properties.

Navigate to Content
Using data you've retrieved from a Branch Deep Link, you can navigate the user to specific content. Alternatively, you can log data, display data, or save data to be used later.

Java
Kotlin
// Within Main Activity's `onStart`
Branch.sessionBuilder(this).withCallback(new Branch.BranchReferralInitListener() {
	@Override
	public void onInitFinished(JSONObject referringParams, BranchError error) {
		if (error == null) {
			// Option 1: log data
			Log.i("BRANCH SDK", referringParams.toString());

			// Option 2: save data to be used later
			SharedPreferences preferences = MainActivity.this.getSharedPreferences("MyPreferences", Context.MODE_PRIVATE);
			preferences.edit().putString("branchData", referringParams.toString()).apply();

 			// Option 3: navigate to page
			Intent intent = new Intent(MainActivity.this, OtherActivity.class);
			startActivity(intent);

			// Option 4: display data
			Toast.makeText(MainActivity.this, referringParams.toString(), Toast.LENGTH_LONG).show();
		} else {
			Log.i("BRANCH SDK", error.getMessage());
		}
	}
}).withData(this.getIntent().getData()).init();
Java
Deep Link Routing
Warning: This approach is not recommended. Branch recommends using the methods in the "Navigate to Content" section instead.

You can add the code below to your AndroidManifest.xml file to load a specific URI Scheme path:

<meta-data android:name="io.branch.sdk.auto_link_path" android:value="content/123/, another/path/, another/path/*" />
XMLCopy
Deep Link Routing in App
WebView
Branch Deep Links within the WebView will route internally within your app, while other content will continue to route externally.

To launch Branch Deep Links with WebView:

Java
Kotlin
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
    WebView webView = (WebView) findViewById(R.id.webView);
    webView.setWebViewClient(new BranchWebViewController(YOUR_DOMAIN, MainActivity.class)); //YOUR_DOMAIN example: appname.app.link
    webView.loadUrl(URL_TO_LOAD);
}

public class BranchWebViewController extends WebViewClient {

    private String myDomain_;
    private Class activityToLaunch_;

    BranchWebViewController(@NonNull String myDomain, Class activityToLaunch) {
        myDomain_ = myDomain;
        activityToLaunch_ = activityToLaunch;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();

        if (url.contains(myDomain_)) {
            Intent i = new Intent(view.getContext(), activityToLaunch_);
            i.putExtra("branch", url);
            i.putExtra("branch_force_new_session", true);
            startActivity(i);
            //finish(); if launching same activity
        } else {
            view.loadUrl(url);
        }

        return true;
Java
Chrome Tabs
Launch Branch Deep Links with Chrome Tabs:

Java
Kotlin
CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
CustomTabsIntent customTabsIntent = builder.build();
customTabsIntent.intent.putExtra("branch", BRANCH_LINK_TO_LOAD);
customTabsIntent.intent.putExtra("branch_force_new_session", true);
customTabsIntent.launchUrl(MainActivity.this, Uri.parse(BRANCH_LINK_TO_LOAD));
//finish(); if launching same activity
Java
Deep Link Activity Finished Notification
To be notified when a Branch Deep Link activity finishes, add the following to your AndroidManifest.xml file:

<meta-data android:name="io.branch.sdk.auto_link_request_code" android:value="@integer/AutoDeeplinkRequestCode" />
XMLCopy
Also, add the following to your app:

Java
Kotlin
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    // Checking if the previous activity is launched on Branch auto deep link
    if(requestCode == getResources().getInteger(R.integer.AutoDeeplinkRequestCode)){
        // Decide where to navigate when an auto deep linked activity finishes
        // For example, navigate to HomeActivity or a SignUp Activity
        Intent i = new Intent(getApplicationContext(), CreditHistoryActivity.class);
        startActivity(i);
    }
}
Java
Event Tracking
General Event Tracking
By default, the Branch Android SDK tracks clicks, opens, installs, reinstalls and impressions automatically (out-of-the-box).

You can also use the BranchEvent class to track special user actions or application-specific events. For example, you can track when a user adds an item to a shopping cart or searches for a keyword.

In short, a BranchEvent instance corresponds to an in-app event that you want to log with Branch.

You can use a BranchUniversalObject (BUO) instance to populate the contentItems field of the BranchEvent class. This is how you associate BUO data with a specific event.

Learn more about tracking events and the logEvent() method in our respective guides.

Content Tracking
To track how many times a piece of content is viewed, use the addContentItems() and logEvent() methods together.

Java
Kotlin
new BranchEvent(BRANCH_STANDARD_EVENT.VIEW_ITEM).addContentItems(buo).logEvent(this.getApplicationContext);
Java
Sharing
Android Native Sharesheet
Use the share() method to create a Branch Deep Link that has Android Native Sharesheet behavior associated with it.

Java
Kotllin
   private void  shareBranchLink(){
        // Create a Branch Universal Object
        BranchUniversalObject buo = new BranchUniversalObject()
                .setCanonicalIdentifier("content/12345");

        // Create a Link Properties instance
        LinkProperties lp = new LinkProperties()
                .setChannel("facebook")
                .setFeature("sharing")
                .setCampaign("content 123 launch")
                .setStage("new user")
                .addControlParameter("$desktop_url", "https://example.com/home")
                .addControlParameter("custom", "data")
                .addControlParameter("custom_random", Long.toString(Calendar.getInstance().getTimeInMillis()));
        
        // Show Sharesheet
       Branch.getInstance().share(MainActivity.this, branchUniversalObject, lp, new Branch.BranchNativeLinkShareListener() {
                    @Override
                    public void onLinkShareResponse(String sharedLink, BranchError error) {}
                    @Override
                    public void onChannelSelected(String channelName) { }
                },
                "Sharing Branch Short URL",
                "Using Native Chooser Dialog");
    }
Java
Note:   If you are using the BranchNativeLinkShareListener  object when calling the share() method, make sure to add  the SharingBroadcastReceiver class to your AndroidManifest.xml  file:

<receiver android:name="io.branch.receivers.SharingBroadcastReceiver" android:exported="true">
           <intent-filter>
               <action android:name="EXTRA_CHOSEN_COMPONENT" />
           </intent-filter>
</receiver>
XMLCopy
Learn more about share() in our Android Full Reference guide.

Handle Links in Your Own App
Use the code below to deep link into your own app from within the app itself. This is done by launching a Chrome intent.

Note: Handling a new Branch Deep Link in your app will clear the current session data and a new referred OPEN will be attributed.

Note: Linking to the currently open activity or an activity that is in the backstack and partially visible must be handled via sessionBuilder()...reInit().

Java
Kotlin
Intent intent = new Intent(this, ActivityToLaunch.class);

// Replace with your own link URL
intent.putExtra("branch","https://xxxx.app.link/testlink");

intent.putExtra("branch_force_new_session",true);
startActivity(intent);
Java
Push Notifications
Handle push notifications by adding a Branch Deep Link to your result intent.

Java
Kotlin
Intent resultIntent = new Intent(this, TargetActivity.class);
resultIntent.putExtra("branch","https://xxxx.app.link/testlink");
resultIntent.putExtra("branch_force_new_session",true);
PendingIntent resultPendingIntent =  PendingIntent.getActivity(this, 0, resultIntent, PendingIntent.FLAG_UPDATE_CURRENT);
Java
To handle situations where TargetActivity is in the foreground when a push notification is clicked, don't forget to call sessionBuilder()...reInit() from onNewIntent inside TargetActivity.

Java
Kotlin
@Override
protected void onNewIntent(Intent intent) {
	super.onNewIntent(intent);
	setIntent(intent);
  
	// If activity is in foreground (or in backstack but partially visible) launching the same
	// activity will skip `onStart` (handle this case with `reInitSession`)
	if (intent != null &&
		intent.hasExtra("branch_force_new_session") && 
		intent.getBooleanExtra("branch_force_new_session")) {
		Branch.sessionBuilder(this).withCallback(branchReferralInitListener).reInit();
	}
}
Java
QR Codes
To use a Branch QR Code, first create a BranchQRCode object. Fill out relevant properties for that object, then use getQRCodeAsImage() or getQRCodeAsData() to retrieve and use the Branch QR Code.

Java
Kotlin
BranchQRCode qrCode = new BranchQRCode() //All QR code settings are optional
	.setCodeColor("#a4c639")
	.setBackgroundColor(Color.WHITE)
	.setMargin(1)
	.setWidth(512)
	.setImageFormat(BranchQRCode.BranchImageFormat.PNG)
	.setCenterLogo("https://cdn.branch.io/branch-assets/1598575682753-og_image.png");

BranchUniversalObject buo = new BranchUniversalObject()
	.setCanonicalIdentifier("content/12345")
	.setTitle("My QR Code");

LinkProperties lp = new LinkProperties()
	.setChannel("facebook")
	.setFeature("qrCode")
	.setCampaign("content 123 launch");

qrCode.getQRCodeAsImage(MainActivity.this, buo, lp, new BranchQRCode.BranchQRCodeImageHandler() {
	@Override
	public void onSuccess(Bitmap qrCodeImage) {
		// Do something with the QR code here
	}

	@Override
	public void onFailure(Exception e) {
		Log.d("Failed to get QR code", String.valueOf(e));
	}
});
Java
Learn more about getting your Branch QR Code as an image or as data in our Android Full Reference guide.

Access
Basic Branch QR Codes are included in the free tier of the Branch Growth Platform.

For more advanced QR Code capabilities, see our Engagement Pro package, which includes access to the QR Code API as well as the ability to create custom QR Codes in the Branch Dashboard.

User Data
Google DMA Compliance
In response to the European Union's enactment of the Digital Markets Act (DMA), the Branch Android SDK includes the setDMAParamsForEEA() method to help you pass consent information from your user to Google.

The setDMAParamsForEEA() method takes 3 parameters:

Parameter Name

Type

Description

When true

When false

eeaRegion

Boolean

Whether European regulations, including the DMA, apply to this user and conversion.

User is included in European Union regulations. For example, if the user is located within the EEA, they are within the scope of DMA.

User is considered excluded from European Union regulations.

adPersonalizationConsent

Boolean

Whether end user has granted or denied ads personalization consent.

User has granted consent for ads personalization.

User has denied consent for ads personalization.

adUserDataUsageConsent

Boolean

Whether end user has granted or denied consent for 3P transmission of user level data for ads.

User has granted consent for 3P transmission of user-level data for ads.

User has denied consent for 3P transmission of user-level data for ads.

Default Behavior
When eeaRegion is set to true, the parameters adPersonalizationConsent and adUserDataUsageConsent must also be set.

When parameters are successfully set using setDMAParamsForEEA(), they will be sent along with every future request to the following Branch endpoints:

/v1/install

/v1/open

/v2/event

Warning: NULL by Default

Please note that the 3 parameters passed to setDMAParamsForEEA() are all NULL by default.

Failure to include user consent signals may result in attribution or campaign performance degradation. For additional information, please reach out to your Google AM.

Example Usage
Java
Kotlin
// Example for an EEA resident who has denied both ad personalization and data usage consent
Branch.getInstance.setDMAParamsForEEA(true,false,false);
Java
Java
Kotlin
// Example for an EEA resident who has consented to ad personalization but denied data usage consent
Branch.getInstance.setDMAParamsForEEA(true,true,false);
Java
Java
Kotlin
// Example for an EEA resident who has denied ad personalization but granted data usage consent
Branch.getInstance.setDMAParamsForEEA(true,false,true);
Java
Set User Identity
An "identity" is a unique alias attributed to a specific user in the Branch system.

Some scenarios which could leverage the setIdentity() function:

You have your own user IDs that you want to see reflected in the Branch system.

You want referral and event data to persist across platforms so you can see how your users access your service from different devices.

You want referral and event data to persist across uninstall/reinstall events.

Sending PII

Be sure to not send any PII through the setIdentity() method. For additional details, please view our guide on Best Practices to Avoid Sending PII to Branch.

To confirm that user identities are being set as expected, use the Liveview section of the Branch Dashboard.

Java
Kotlin
Branch branch = Branch.getAutoInstance(this.getApplicationContext);

public void onClick(View v) {
	branch.setIdentity("unique_user_id", new BranchReferralInitListener() {
		@Override
		public void onInitFinished(JSONObject referringParams, BranchError error) {
			Log.i("Test", "install params = " + referringParams.toString());
		}
	});
}

Branch.getInstance().logout();
Java
Learn more about the setIdentity method in our Android Full Reference guide.

Attribution Through Install Listener
It is possible to pass the link_click_id from Google Play to Branch. This will increase attribution and deferred deep linking accuracy.

By default, Branch waits 1.5 seconds for Google Play analytics. You can change this based on your needs.

To use this approach, add the following to your application class before the getAutoInstance() method:

Java
Kotlin
Branch.setPlayStoreReferrerCheckTimeout(5000);
Java
To test this setup, run the following command:

adb shell am broadcast -a com.android.vending.INSTALL_REFERRER -n io.branch.androidexampledemo/io.branch.referral.InstallListener --es "referrer" "link_click_id=123"



Android Testing 
Updated on Feb 18, 2025
Published on Feb 11, 2025
Documentation
Branch SDKs
Android SDK
Android Testing
Overview
The test scenarios, tools, and resources in this guide help make sure you've integrated the Branch Android SDK correctly.

To integrate the Branch Android SDK, follow the steps in our Android SDK Basic Integration guide.

Test Scenarios
Test Deep Linking
To test whether you can successfully use Branch Deep Links:

Create a deep link using the Branch Dashboard.

Make sure your test device is ready to use.

Remove the app from your device and reset your advertising ID.

Compile and re-install your app on the device.

Paste the deep link in a different app on the device - somewhere that you'll be able to click the link from.

Click the deep link. Your app should open and route you to the proper screen.

Please note that you must have our Engagement product to have access to Branch Deep Linking.

Test Deep Link Routing
To test deep link routing for your app:

Append ?bnc_validate=true to a Branch Deep Link.

Click on this deep link from your mobile device (not the Simulator).

An example link would look like: "https://.app.link ndj6nfzrbk?bnc_validate="">.app.link>

Test Install
To ensure the SDK is setup correctly, you no longer need to simulate an install via the SDK itself.

Instead, you can test functionality end to end by completing the following:

Add a test device to your Branch account.

Test your campaign setup.

Testing Tools
Integration Status Tab
For a quick approach to checking your Branch Android SDK integration status and progress, you can use the Integration Status tab of the Branch Dashboard.



Integration Validator Method
Another simple way to test the status of your Branch Android SDK integration is using the built-in IntegrationValidator.validate() method.

To use this method, add the following code to your MainActivity's onStart():

Java
Kotlin
IntegrationValidator.validate(MainActivity.this);
Java
This method will check to ensure that the Branch keys, package name, URI schemes, and link domain settings from the Branch Dashboard match those in the build.

Check your ADB Logcat to make sure all the SDK integration tests pass.

Make sure to comment out or remove IntegrationValidator.validate() in your production build.

For more about the IntegrationValidator.validate() method, visit our blog.

Branch Test Key
For testing purposes, you can use your Branch test key instead of your live key.

To use your test key:

Add your test key to your AndroidManifest.xml file.

Use the sample code below to update your app, noting the enableTestMode() method:

Java
Kotlin
package com.example.android;

import android.app.Application;
import io.branch.referral.Branch;

public class CustomApplicationClass extends Application {
	@Override
	public void onCreate() {
		super.onCreate();

		// Branch logging for debugging
		Branch.enableTestMode();

		// Branch object initialization
		Branch.getAutoInstance(this);
	}
}
Java
Make sure the test key of your app matches the test key in the deep link, and that you remove the enableTestMode() method before releasing to production.

Enable Logging
Enable logging in your app to catch errors and other useful information coming from Branch. Make sure to only do this for testing, and that you remove the logging code before releasing to production.

Use the sample code below to update your app with any of the enableLogging() methods:

Java
Kotlin
package com.example.android;

import android.app.Application;
import io.branch.referral.Branch;

public class CustomApplicationClass extends Application {
	@Override
	public void onCreate() {
		super.onCreate();

		// Branch logging for debugging
		Branch.enableLogging();

    // Adjust the desired log level (Android SDK versions v5.12.0+ only)
    Branch.enableLogging(BranchLogger.BranchLogLevel.VERBOSE);
		
    // Create a custom callback to forward log messages to
    IBranchLoggingCallbacks loggingCallbacks = new IBranchLoggingCallbacks() {
      @Override
      public void onBranchLog(String logMessage, String severityConstantName) {
        // Handle the log messages  
        Log.v( "CustomTag", logMessage);
      }
    };
    Branch.enableLogging(loggingCallbacks);

		// Branch object initialization
		Branch.getAutoInstance(this);
	}
}
Java
Link Debugger
You can make sure your Branch Link is properly configured by using Branch's Link Debugger tool. It can help you determine whether the link was properly configured and passed the correct data when it was created.

To use Branch's Link Debugger:

Sign in to your Branch Dashboard.

Make sure you are in the proper environment for the link you want to debug (live or test).

Copy the Branch Link, and append ?debug=1 to the end of it.

For example, the Branch Link https://branchster.app.link/3vqEJflHrGb would become https://branchster.app.link/3vqEJflHrGb?debug=1

Paste this link, including the ?debug=1 flag, into your browser. This will open the Link Debugger view:


This tool includes the Link Routing Debugger, which allows you to view the expected behavior for each operating system and click location.

To use the Link Routing Debugger:

Select an operating system and location using the dropdown menus.


View the redirect results table for the link.


Based on the operating system and click location you have selected, you’ll see the click redirect outcome for when a user does and does not have the app installed.



Android Troubleshooting 
Updated on Feb 18, 2025
Published on Feb 11, 2025
Documentation
Branch SDKs
Android SDK
Android Troubleshooting
Overview
This guide covers some common challenges we see when trying to integrate the Branch Android SDK.

To integrate the Branch Android SDK, follow the steps in our Android SDK Basic Integration guide.

Scenarios
Using Older Android API Versions
If you need to use an Android API version older than version 15:

Use Branch Android SDK version 1.14.5

Add the onStart() and onStop() methods to your app:

Java
Kotlin
@Override
protected void onStart() {
    super.onStart();
    Branch.getInstance(getApplicationContext()).initSession();
}

@Override
protected void onStop() {
    super.onStop();
    branch.closeSession();
}
Java
App Has No Application Class
If your app does not have an application class, add the following to your AndroidManifest.xml file:

<application android:name="io.branch.referral.BranchApp">
XMLCopy
Overrunning Dex Limit
Adding additional dependencies may overrun the dex limit.

This can lead to a NoClassDefFoundError or a ClassNotFoundException.

To fix this, add the following to your build.gradle:

Java
Kotlin
defaultConfig {
    multiDexEnabled true
}
Java
Then, add the following to your Application class and make sure it extends MultiDexApplication:

Java
Kotlin
@Override
protected void attachBaseContext(Context base) {
    super.attachBaseContext(base);
    MultiDex.install(this);
}
Java
Proguard
InvalidClassException, ClassLoadingError, or VerificationError
InvalidClassException, ClassLoadingError, and VerificationError are often caused by a Proguard bug.

To fix this, try using the latest Proguard version.

You can also disable Proguard optimization by using the -dontoptimize flag.

Answers Shim Module
Warnings or errors may occur if you exclude the answers-shim module.

Try adding -dontwarn com.crashlytics.android.answers.shim.** to your Proguard file.

Play Services Ads Module
The Branch Android SDK has an optional dependency on Play Services Ads for GAID matching.

Using Proguard without using this library can create issues in fetching the GAID, which happens when initializing a Branch session or Branch Events.

Try adding the following to your Proguard file to solve this issue:

-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient {
com.google.android.gms.ads.identifier.AdvertisingIdClient$Info getAdvertisingIdInfo(android.content.Context);
}

-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient$Info {
java.lang.String getId();
boolean isLimitAdTrackingEnabled();
}
ProguardCopy
Link Open Error
An "Unable to open this link" error happens whenever URI Scheme redirection fails.

Make sure you do not have $deeplink_path set, or you have a $deeplink_path which your AndroidManifest.xml can accept

Stuck State
You may notice your Branch initialization get stuck in the following state: initState_ == SESSION_STATE.INITIALISING

This is often caused by Branch not having the right application context from your activity.

To avoid this, make sure you pass in your application context:

Java
Kotlin
protected static final String branchKey = "branch_key_here";

public class CustomApplicationClass extends Application {
	@Override
	public void onCreate() {
		super.onCreate();

		// Branch object initialization
		Branch.getAutoInstance(this.getApplicationContext, branchKey);
	}
}
Java
Automatic Initialization
One possible error you may run into is BranchError.ERR_BRANCH_ALREADY_INITIALIZED.

Context
The Branch Android SDK will automatically initialize when the app comes to the foreground, and the first activity to show enters the RESUMED lifecycle state. This is done as a failsafe not to miss tracking sessions.

Therefore, if you delay Branch initialization, never attempt to initialize Branch, or have the app open to activities other than the launcher activity, then the Branch Android SDK will automatically initialize.

At this point, if the app's code tries to initialize Branch (again), then the SDK will throw an error. This prevents initializing over and over again, or other potentially unexpected states.

Error Handling
If you want to delay initialization without having the Branch Android SDK self-initialize, you can do so using the approach outlined in our Advanced Features guide.

Alternatively, you can ignore the error and add the following code snippet to your callback:

Java
Kotlin
if(error.getErrorCode() == BranchError.ERR_BRANCH_ALREADY_INITIALIZED) {
   branchReferringParams_ = Branch.getLatestReferringParams();
}




APIs Overview 
Updated on Mar 6, 2025
Published on Feb 21, 2025
Documentation
APIs
APIs Overview
API Descriptions
The following Branch APIs can help you query and export data, create Branch Deep Links, make your own custom Branch QR codes, and much more.

Data APIs
API

Purpose

Type of Data

Timing

Export Window

Daily Exports

Export all device-level data in batches on a daily basis.

Log

Delayed & batched

Rolling 7 day window

Custom Exports

Export select device-level data using your own filters.

Log

Delayed & batched

Rolling 120 day window

Scheduled Log Exports

Set up a recurring export of select device-level data.

Log

Delayed & batched (hourly or daily cadence)

N/A

Cross-Events Export

Query and compare large pools of data across multiple sources.

Aggregate

Delayed & batched

Rolling 2 year window

Unified Analytics Export

Get unified analytics data into your data warehouse.

Aggregate

Delayed & batched

Rolling 2 year window

Aggregate

Pull aggregate Branch data filtered for limited-access users.

Aggregate

Delayed & batched

Rolling 2 year window

Cohort

Pull cohort Branch data to understand user behavior and performance over time.

Aggregate

Delayed & batched

Rolling 2 year window

Query

Export select campaign-
level data.

Aggregate

Real Time

Rolling 2 year window

Functional APIs
API

Purpose

Deep Linking

Create, read, update, and delete your Branch Links.

Events

Track all of your events/conversions for your app.

QR Code

Programmatically generate and customize Branch-powered QR codes.

Attribution

Attribute your app sessions to your active campaigns.

App

View and make updates to an existing Branch app configuration to better support workflows.

Data Subject Request

GDPR and CCPA related uses for accessing and erasing user/device data from Branch.

Quick Links

Programmatically generate Branch Deep Links that surface on the Branch Dashboard.

API Access
Some Branch APIs are included with the Branch Growth Platform, while others require specific Branch packages.

Included
APIs included with the Branch Growth Platform:

Daily Exports API

Custom Exports API

Aggregate API

Cohort API

Query API

Events API

Attribution API

App API

Data Subject Request API

Limited Access
APIs that require Branch's Engagement Pro product:

Deep Linking API

Quick Links API

QR Code API

APIs that require the Advanced Data Feeds add-on:

Scheduled Log Exports API

Cross-Events Export API

Unified Analytics Export API


APIs Overview 
Updated on Mar 21, 2025
Published on Mar 4, 2025
API Documentation
Branch APIs
APIs Overview
API Descriptions
The following Branch APIs can help you query and export data, create Branch Deep Links, make your own custom Branch QR codes, and much more.

Data APIs
API

Purpose

Type of Data

Timing

Export Window

Daily Exports

Export all device-level data in batches on a daily basis.

Log

Delayed & batched

Rolling 7 day window

Custom Exports

Export select device-level data using your own filters.

Log

Delayed & batched

Rolling 120 day window

Scheduled Log Exports

Set up a recurring export of select device-level data.

Log

Delayed & batched (hourly or daily cadence)

N/A

Cross-Events Export

Query and compare large pools of data across multiple sources.

Aggregate

Delayed & batched

Rolling 2 year window

Aggregate

Pull aggregate Branch data filtered for limited-access users.

Aggregate

Delayed & batched

Rolling 2 year window

Cohort

Pull cohort Branch data to understand user behavior and performance over time.

Aggregate

Delayed & batched

Rolling 2 year window

Query

Export select campaign-
level data.

Aggregate

Real Time

Rolling 2 year window

Functional APIs
API

Purpose

Deep Linking

Create, read, update, and delete your Branch Links.

Events

Track all of your events/conversions for your app.

QR Code

Programmatically generate and customize Branch-powered QR codes.

Attribution

Attribute your app sessions to your active campaigns.

App

View and make updates to an existing Branch app configuration to better support workflows.

Data Subject Request

GDPR and CCPA related uses for accessing and erasing user/device data from Branch.

Quick Links

Programmatically generate Branch Deep Links that surface on the Branch Dashboard.

API Access
Some Branch APIs are included with the Branch Growth Platform, while others require specific Branch packages.

Included
APIs included with the Branch Growth Platform:

Daily Exports API

Custom Exports API

Aggregate API

Cohort API

Query API

Events API

Attribution API

App API

Data Subject Request API

Limited
APIs that require the Engagement Essentials package:

Deep Linking API

APIs that require the Engagement Pro package:

Quick Links API

QR Code API

APIs that require the Advanced Data Feeds add-on:

Scheduled Log Exports API

Cross-Events Export API

Unified Analytics Exports API

Quick Links API Overview 
Published on Mar 20, 2025
API Documentation
Quick Links API
Quick Links API Overview
Overview
Branch's Quick Links API is a useful tool for programmatically generating Branch Deep Links that surface on the Branch Dashboard. You can create Deep Links at scale to support all of your campaigns while tagging the links appropriately based on channel and other analytics tags.

Important: URLs created via this API will not automatically show up in the Branch Dashboard. To make sure a URL appears in the Branch Dashboard, set "$marketing_title": "mytitle" ($marketing_title is part of the data object) and type: 2 in your request. Both parameters need to be properly filled out to see the Deep Link in the Dashboard.

Limits
Limitation

Details

Rate Limits

100 requests per second
5,500 requests per minute
300,000 requests per hour

Please note that 300,000 requests per hour equates to 83 requests per second.

Getting Started
Prerequisites
In order to access the Quick Links API, you first need to:

Create a Branch Dashboard.

Set appropriate user permissions in your Branch account.

Access
Access to the Quick Links API requires our Engagement Pro package.

Learn more on our packaging page.

Authentication
Calls to the Quick Links API require both your Branch Key and (sometimes) Branch Secret parameter to be passed with each request. This can be obtained through the Branch Dashboard Account Settings.



Learn more about your Branch Account Profile here.

For some calls, you will also need your Branch Access Token. This can be obtained from your Branch Dashboard User Settings.

Learn more on retrieving your Access Token here.

API Usage
Create a Quick Link URL
Endpoint
POST /v1/url
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
Request Headers
Header

Value

Required

Content-Type

application/json

Yes

Request Body Parameters:
Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

data

The dictionary to embed with the link. Accessed as session or install parameters from the SDK. Use the data dictionary for all link control parameters that you'll find here.

The key $marketing_title is part of the data object and must be set in order to see the Deep Link in the Branch Dashboard. The type parameter (not part of the data object) must also be set to 2 for this to happen.

Yes

alias

Instead of Branch's standard encoded short URL, you can specify a vanity alias. For example, instead of a random string of characters/integers, you can set the vanity alias as .app.link/devonaustin. Aliases are enforced to be unique and immutable per domain, and per link - they cannot be reused unless deleted.

Max 128 characters.

NOTE: If you POST to the this endpoint with the same alias, and a matching set of other POST parameters to an existing aliased link, the original will be returned to you. If it clashes and you don't specify a match, will return a HTTP 409 error.

No

type

Set type to 2 if you would like to see the URL in the Branch Dashboard. You must also set $marketing_title (which is part of the data object) to a string value.

Yes

duration

In seconds. Only set this key if you want to override the match duration for Branch Deep Link matching. This is the time that Branch allows a click to remain outstanding and be eligible to be matched with a new app session. This is default set to 7200 (2 hours).

No

Branch analytics parameters

It's important to tag your links with an organized structure of analytics labels so that the data appears consistent and readable in the dashboard.

No

Response Body Parameters
Parameter

Description

url

The URL created by this endpoint.

Example Request/Response
Example Request (cURL)
Example Response (JSON)
curl -XPOST https://api2.branch.io/v1/url -H "Content-Type: application/json" \
  -d '{
  "branch_key": "key_live_kaFuWw8WvY7yn1d9yYiP8gokwqjV0Swt",
  "channel": "facebook",
  "feature": "onboarding",
  "campaign": "new product",
  "stage": "new user",
  "tags": ["one", "two", "three"],
  "type": 2,
  "data": {
		"$marketing_title": "mytitle"
		"$canonical_identifier": "content/123",
		"$og_title": "Title from Deep Link",
		"$og_description": "Description from Deep Link",
		"$og_image_url": "http://www.lorempixel.com/400/400/",
		"$desktop_url": "http://www.example.com",
		"custom_boolean": true,
		"custom_integer": 1243,
		"custom_string": "everything",
		"custom_array": [1,2,3,4,5,6],
		"custom_object": { "random": "dictionary" }
  }
}'
Curl
Bulk Create Quick Link URLs
Endpoint
POST /v1/url/bulk/{branch_key}
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
For more details on how to create Branch Deep Links, see the Branch guide for creating Deep Links.

Request Headers
Header

Value

Required

Content-Type

application/json

Yes

Request Body Parameters
A JSON array of parameters from Creating a Deep Linking URL.

Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

Branch Parameters

A JSON array of parameters from Creating a Deep Linking URL.
You're free to add any of your own key-value parameters to a Branch Deep Link. These parameters will be passed to your app via the Branch SDK you are using.


The key $marketing_title is part of the data object and must be set in order to see the Deep Link in the Branch Dashboard. The type parameter (not part of the data object) must also be set to 2 for this to happen.

No

Note

There is a 100KB limit on the request payload size.

Response Parameters
Parameter

Description

url

An array of Branch Deep Link URLs.

error

Error(s) if there are invalid params.

Example Request/Response
Example Request (cURL)
Example Response (JSON)
curl -XPOST https://api2.branch.io/v1/url/bulk/key_live_kaFuWw8WvY7yn1d9yYiP8gokwqjV0Swt -H "Content-Type: application/json" \
  -d '[
    {
      "channel": "facebook",
      "feature": "onboarding",
      "campaign": "new product",
      "stage": "new user",
      "tags": ["one", "two", "three"],
      "type": 2,
      "data": {
      	"$marketing_title": "mytitle"
        "$canonical_identifier": "content/123",
        "$og_title": "Title from Deep Link",
        "$og_description": "Description from Deep Link",
        "$og_image_url": "http://www.lorempixel.com/400/400/",
        "$desktop_url": "http://www.example.com",
        "custom_boolean": true,
        "custom_integer": 1243,
        "custom_string": "everything",
        "custom_array": [1,2,3,4,5,6],
        "custom_object": { "random": "dictionary" }
      }
    },
    {
      "channel": "facebook",
      "feature": "onboarding",
      "campaign": "new product",
      "stage": "new user",
      "tags": ["one", "two", "three"],
      "type": 2,
      "data": {
      	"$marketing_title": "mysecondtitle"
        "$canonical_identifier": "content/123",
        "$og_title": "Title from Deep Link",
        "$og_description": "Description from Deep Link",
        "$og_image_url": "http://www.lorempixel.com/400/400/",
        "$desktop_url": "http://www.example.com"
      }
    }
  ]'
Curl
Update Existing Quick Link
Link Update Tips

A Branch Deep Link's data object is overwritten entirely by this API call, so make sure to include all of the Branch Deep Link's data when updating it and not just the data you're changing.

To update Branch Deep Links in bulk, combine the update and read methods when creating a script.

If you want to add custom key/value pairs to the data object, you will need to do it outside of the API Reference.

Link Update Restrictions

There are certain restrictions when attempting to update Deep Links:

Not all links can be updated, namely links with the structure of bnc.lt/c/ or bnc.lt/d/.

The following fields cannot be updated:

alias

For example, you cannot change https://bnc.lt/test to https://bnc.lt/test1.

identity

type

This means if you want to see Branch Deep Links in the Dashboard, you need to have set type to 2 during creation.

app_id

randomized_bundle_token

domain

state

creation_source

app_short_identifier

Endpoint
PUT /v1/url
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
Request Headers
Header

Value

Required

Content-Type

application/json

Yes

Request Body Parameters
Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

branch_secret

The Branch Secret of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

url

The Branch Quick Link URL you want updated.

Yes

Example Request/Response
Example Request (cURL)
Example Response (JSON)
curl -XPUT 'https://api2.branch.io/v1/url?url=https%3A%2F%2Fexample.app.link%2F5IULiLcpqF' -H "Content-Type: application/json" \
  -d '{
  "branch_key": "key_live_kaFuWw8WvY7yn1d9yYiP8gokwqjV0Swt",
  "branch_secret": "secret_live_RrrsLqpzVcoVWf5t4ncQVpzlg2pRpGH9",
  "channel": "twitter",
  "type": 2,
  "data": {
		"$marketing_title": "mynewtitle",
		"name": "alex",
		"user_id": "12346"
  }
}'
Curl
The sample Python script below reads a 2-column CSV file, and updates a key specified in the script for all links listed in column A, with the values in column B:

import requests
import csv
import sys
import urllib
import json

def BranchUpdateModule(KeyV, SecretV, UpdateV, File):
    # Insert API key & App Secret from the Branch dashboard, and the Link data key you want to change in each link **
    branch_key = KeyV
    branch_secret = SecretV
    key_to_update = UpdateV


    # Insert filename for CSV containing links to update in first column, and values to add in second column **
    ifile = open(File, "r", encoding="utf-8")

    # Constants
    branchendpoint = "https://api2.branch.io/v1/url?url="
    reader = csv.reader(ifile, delimiter=',')


    # Uncomment the next line if you want the script to skip the first line of the CSV
    next(reader)

    # Loop through CSV
    for row in reader:

        # Retrieve link data for link being updated
        url = urllib.parse.quote_plus(row[0])
        getrequest = branchendpoint + url +"&branch_key=" + branch_key
        linkdata = requests.get(getrequest)
        jsonData = json.loads(linkdata.text)

        if linkdata.status_code != 200:
            print('Failed: {}'.format( getrequest))
            continue

        # Set credentials for update API
        jsonData["branch_key"] = branch_key
        jsonData["branch_secret"] = branch_secret

        #TODO for editing new value
        newValue = row[1]
        if key_to_update in jsonData:
            jsonData[key_to_update] = newValue
        if key_to_update in jsonData["data"]:
            jsonData["data"][key_to_update] = newValue

        if jsonData.get('type', None) is not None:
            del jsonData['type']
        if jsonData.get('alias', None):
            del jsonData['alias']
        payload = json.dumps(jsonData)
        print("\n \n payload")
        print(payload)
        putrequest = branchendpoint + url

        print(putrequest)
        r = requests.put(putrequest, json=jsonData)
        print(r.url)
        print(r)
        
    ifile.close()


Deep Linking API Overview 
Published on Mar 20, 2025
API Documentation
Deep Linking API
Deep Linking API Overview
Overview
Branch's Deep Linking API is a powerful tool for all things Branch Links. With the Deep Linking API, you can generate links in bulk while also tagging them appropriately based on channel, or other analytics tags.

Benefits
With the Deep Linking API, you can both create and update Branch Deep Links in bulk. You can also read information from previously created Deep Links, as well as delete Deep Links.

Limitations
Request Type

Max Requests Per Second

Max Requests Per Minute

Max Requests Per Hour

PUT

100

1,000

10,000

POST

200

12,000

300,000

Please note this equates to ~83 requests per second.

GET

100

5,500

100,000

Try It!
Try out the Deep Linking API in your browser, using your Branch data:

Create a Deep Link URL

Create Deep Link URLs in Bulk

Delete Existing Deep Link URL

Read Existing Deep Link URL

Update Existing Deep Link URL

Getting Started
Prerequisites
In order to use the Deep Linking API, you first need to:

Create a Branch Dashboard.

Set appropriate user permissions in your Branch account. If you want to access the DELETE method for this endpoint, you will need both App-Level and Sensitive Data permissions.

Access
Access to the Deep Linking API requires our Engagement product.

Learn more on our packaging page.

Authentication
Calls to the Deep Linking API require your Branch Key.

Sometimes, your Branch Secret is also required.

Both your Branch Key and your Branch Secret can be obtained through your Branch Dashboard Account Settings.



NOTE: If you want to access the DELETE method for this endpoint, you will need both App-Level and Sensitive Data permissions. Learn more in the Authentication section.

Learn more about your Branch Account Profile here.

Delete Functionality
To use the DELETE request associated with this API, you also need to pass an API key (also called Access Token). API keys are generated on a per-user basis and are permanent.

Learn more about retrieving your API key here.

Usage
Create a Deep Link URL
Request Info
Export Request

POST /v1/url
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
Request Headers

Header

Value

Required

content-type

application/json

Yes

accept

application/json

Yes

Request Body Parameters

Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

data

The dictionary to embed with the link. Accessed as session or install parameters from the SDK.
Use the data dictionary for all link control parameters.
You can also use it for additional link data keys. Note that you can set campaign, tags, channel, feature, and stage as top level parameters, or you can set them inside the data object using the ~prefix. Preference is given to the top level parameter setting.

No

campaign

The name of the campaign associated with your link.

No

tags

A free form entry with unlimited values of type string. Use it to organize your link data with labels that don't fit under other keys.

No

channel

The route that your link reaches your users by.
For example, tag links with "Facebook" or "LinkedIn" to help track clicks and installs through those paths separately.

No

feature

The feature of your app associated with the link.
For example, if you built a referral program, you would label links with the feature "referral".

No

stage

The progress or category of a user when the link was generated.
For example, if you had an invite system accessible on "level 1", "level 3", and "level 5", you could differentiate links generated at each level with this parameter.

No

alias

Instead of Branch's standard encoded short URL, you can specify a vanity alias. For example, instead of a random string of characters/integers, you can set the vanity alias as .app.link/example.
NOTE: If you send a POST request to this endpoint with the same alias, and a matching set of other POST parameters to an existing aliased link, the original will be returned to you. If it clashes and you don't specify a match, a HTTP 400 error will be returned.
WARNING: Non-letter characters should not be used in the alias, with the exception of forward slashes /, underscores _, and hyphens -. The max limit for a vanity alias is 128 characters.

No

type

Set to 0 by default, which represents standard Branch Links created via the Branch SDK.

No

duration

Match duration in seconds. Default is set to 7200 (2 hours).
This is the time that Branch allows a click to remain outstanding and be eligible to be matched with a new app session.
Only set this key if you want to override the match duration for Branch Deep Link matching.

No

Response Info
Response Body Parameters

Parameter

Description

url

The URL created by this endpoint.

Example Request & Response
Example Request (cURL)
Example Response (JSON)
curl -XPOST https://api2.branch.io/v1/url -H "Content-Type: application/json" \
  -d '{
  "branch_key": "key_live_00000000000000",
  "channel": "top_level_channel",
  "data": {
    "~creative_id": "data_creative_0000",
    "~campaign": "winter_product_launch",
		"$canonical_url": "https://www.example.com",
		"$og_title": "Title from Deep Link",
		"$og_description": "Description from Deep Link",
		"$og_image_url": "https://www.lorempixel.com/400/400/",
		"$desktop_url": "https://www.desktop-example.com",
		"custom_boolean": true,
		"custom_integer": 1243,
		"custom_string": "everything",
		"custom_array": [1,2,3,4,5,6],
		"custom_object": { "random": "dictionary" }
  }
}'
Curl
Bulk Create Deep Link URLs
Request Info
Export Request

POST /v1/url/bulk/{branch_key}
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
For more details on how to create Branch Deep Links, see our guide .

Request Headers

Header

Value

Required

content-type

application/json

Yes

accept

application/json

Yes

Request Path Parameters

Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

Request Body Parameter

Parameter

Description

Required

Branch Parameters

A JSON array of objects. Each object represents a Branch Deep Link (see Create a Deep Link URL for structure).
Learn more about configuring Branch Deep Links here .

No

Limitations

Please note that there is a 100KB limit on request payload size for bulk Deep Link creation.

Response Info
Response Parameters

Parameter

Description

url

An array of Branch Deep Link URLs.

error

Error(s) if there are invalid params.

Example Request & Response
Example Request (cURL)
Example Response (JSON)
curl -XPOST https://api2.branch.io/v1/url/bulk/key_live_XXX -H "Content-Type: application/json" \
-d '[
  {
    "channel": "facebook",
    "feature": "onboarding",
    "campaign": "new product",
    "stage": "new user",
    "tags": ["one", "two", "three"],
    "data": {
    "$canonical_url": "https://www.example.com",
    "$og_title": "Title from Deep Link",
    "$og_description": "Description from Deep Link",
    "$og_image_url": "https://www.lorempixel.com/400/400/",
    "$desktop_url": "https://www.desktop-example.com",
    "custom_boolean": true,
    "custom_integer": 1243,
    "custom_string": "everything",
    "custom_array": [1,2,3,4,5,6],
    "custom_object": { "random": "dictionary" }
    }
  },
  {
    "channel": "linkedin",
    "data": {
    "~creative_id": "data_creative_0001",
    "~campaign": "fall_feature_launch",
    "$canonical_url": "https://www.example.com",
    "$og_title": "Title from Deep Link",
    "$og_description": "Description from Deep Link",
    "$og_image_url": "https://www.lorempixel.com/400/400/",
    "$desktop_url": "https://www.desktop-example.com",
    "custom_boolean": true,
    "custom_integer": 1243,
    "custom_string": "everything",
    "custom_array": [1,2,3,4,5,6],
    "custom_object": { "random": "dictionary" }
    }
  }
]'
Curl
Delete Existing Deep Link
Request Info
Export Request

DELETE /v1/url
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
Request Headers

Header

Value

Required

Access-Token

Key that encapsulates the user's permission with regards to an organization. Obtained from the Branch Dashboard. Needed for authentication .

Yes

accept

application/json

Yes

content-type

application/json

Yes

Request Body Parameters

Parameter

Description

Required

url

The Branch Deep Link URL to be deleted.

Yes

app_id

The Branch app_id associated with the Branch Deep Link URL to be deleted.

Yes

Limitations

Please note that this endpoint is not available in test environments.

Response Info
Response Parameters

Parameter

Description

url

The relevant Branch Deep Link URL.

deleted

Returns true if the URL has been successfully deleted, false if not.

Example Request & Response
cURL
Example Response (JSON)
curl -X DELETE \
'https://api2.branch.io/v1/url?url=https://example.app.link/ABCD&app_id=YOUR_APP_ID' \
  -H "Access-Token: YOUR_ACCESS_TOKEN"
Curl
Read Existing Deep Link
Request Info
Export Request

GET /v1/url
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
Request Headers

Header

Value

Required

content-type

application/json

Yes

accept

application/json

Yes

Request Query Parameters

Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

url

The Branch Deep Link URL you want read.

Yes

Response Info
Response Parameters

Parameter

Description

A JSON Object

A JSON object containing Deep Link properties .

Example Request & Response
Example Request (cURL)
Example Response (JSON)
curl -XGET 'https://api2.branch.io/v1/url?url=https://example.app.link/WgiqvsepqF&branch_key=key_live_kaFuWw8WvY7yn1d9yYiP8gokwqjV0Swt'
Curl
Update Existing Deep Link
Link Update Restrictions

There are certain restrictions when attempting to update links:

Not all links can be updated, namely links with the structure of bnc.lt/c/ or bnc.lt/d/.

The following fields cannot be updated:

alias (for example, you cannot change https://bnc.lt/test to https://bnc.lt/test1)

identity

type

app_id

randomized_bundle_token

domain

state

creation_source

app_short_identifier

Request Info
Endpoint

PUT /v1/url
Content-Type: application/json
Body: JSON parameters
Host: api2.branch.io
HTTPCopy
Request Headers

Header

Value

Required

content-type

application/json

Yes

accept

application/json

Yes

Request Query Parameters

Parameter

Description

Required

url

The Branch Deep Link URL you want updated.

Yes

Request Body Parameters

Data Object Override

Make sure to include all of the Deep Link's data when making this request, not just the data you are changing. This is because the Branch Deep Link's data object is overwritten entirely by this API call.

Parameter

Description

Required

branch_key

The Branch Key of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

branch_secret

The Branch Secret of the originating app, found in the Settings tab of your Branch Dashboard.

Yes

data

The dictionary to embed with the link. Accessed as session or install parameters from the SDK.
Use the data dictionary for all link control parameters.
You can also use it for additional link data keys. Note that you can set campaign, tags, channel, feature, and stage as top level parameters, or you can set them inside the data object using the ~prefix. Preference is given to the top level parameter setting.

No

campaign

The name of the campaign associated with your link.

No

tags

A free form entry with unlimited values of type string. Use it to organize your link data with labels that don't fit under other keys.

No

channel

The route that your link reaches your users by.
For example, tag links with "Facebook" or "LinkedIn" to help track clicks and installs through those paths separately.

No

feature

The feature of your app associated with the link.
For example, if you built a referral program, you would label links with the feature "referral".

No

stage

The progress or category of a user when the link was generated.
For example, if you had an invite system accessible on "level 1", "level 3", and "level 5", you could differentiate links generated at each level with this parameter.

No

alias

Instead of Branch's standard encoded short URL, you can specify a vanity alias. For example, instead of a random string of characters/integers, you can set the vanity alias as .app.link/example.
NOTE: If you send a POST request to this endpoint with the same alias, and a matching set of other POST parameters to an existing aliased link, the original will be returned to you. If it clashes and you don't specify a match, a HTTP 400 error will be returned.
WARNING: Non-letter characters should not be used in the alias, with the exception of forward slashes /, underscores _, and hyphens -. The max limit for a vanity alias is 128 characters.

No

type

Set to 0 by default, which represents standard Branch Links created via the Branch SDK.

No

duration

Match duration in seconds. Default is set to 7200 (2 hours).
This is the time that Branch allows a click to remain outstanding and be eligible to be matched with a new app session.
Only set this key if you want to override the match duration for Branch Deep Link matching.

No

Response Info
Response Parameters

Parameter

Description

data

An object containing data about the Branch Deep Link.

type

An integer, usually 0, that reflects the type of the Branch Deep Link.

Example Request & Response
Example Request (cURL)
Example Response (JSON)
curl -XPUT 'https://api2.branch.io/v1/url?url=https%3A%2F%2Fexample.app.link%2F5IULiLcpqF' -H "Content-Type: application/json" \
  -d '{
  "branch_key": "key_live_000000000",
  "branch_secret": "secret_live_00000000000",
  "channel": "twitter",
  "data":{
    "name":"alex",
    "user_id":"12346"
  }
}'
Curl
Appendix
Link Data Keys
You can include these keys as part of the data object in your API requests.

Key

Usage

~id

The unique ID for the link.

~creation_source

The source where the Branch Deep Link was created, represented by a number (passed as a string).
"0" = API
"1" = Branch Quick Link
"2" = SDK
"3" = iOS SDK
"4" = Android SDK
"5" = Web SDK
"6" = Dynamic
"7" = Third party

~tags

A free form entry with unlimited values of type string. Use it to organize your link data with labels that don't fit under other keys.

~campaign

The name of the campaign associated with your link.

~campaign_id

The ID for the campaign associated with your link.

~channel

The route that your link reaches your users by.
For example, tag links with "Facebook" or "LinkedIn" to help track clicks and installs through those paths separately.

~feature

The feature of your app associated with the link.
For example, if you built a referral program, you would label links with the feature "referral".

~stage

The progress or category of a user when the link was generated.
For example, if you had an invite system accessible on "level 1", "level 3", and "level 5", you could differentiate links generated at each level with this parameter.

~marketing

Pass "true" to indicate this is a Quick Link.

~link_type

The Branch link type (Deep, Quick, or Ad).

~agency_id

The ID of the relevant agency.

~quick_link_template_id

The ID of the Branch Quick Link template you are using.

~ad_link_template_id

The ID of the ad link template you are using.

~advertising_partner_name

The name of the relevant advertising partner, such as "Facebook".

~creative_name

The creative name specified for the last attributed touch.

~customer_placement

The customer specified placement of the last touch. This is the actual app or website that the ad appears on display campaigns.

~ad_set_name

The ad set name specified for the last attributed touch.

~ad_set_id

The ad set ID specified for the last attributed touch.

~branch_ad_format

Possible values:
"Cross-Platform Display"
"App Only"

~secondary_ad_format

Specify an ad format to help organize your analytics and make it faster to set up web fallbacks for your link.

Example Automation Script
If you would like to update Branch Deep Links in bulk, combine the PUT and GET methods when creating a script.

The sample Python script below reads a 2-column CSV file, and updates a key specified in the script for all links listed in column A, with the values in column B:

import requests
import csv
import sys
import urllib
import json

def BranchUpdateModule(KeyV, SecretV, UpdateV, File):
    # Insert API key & App Secret from the Branch dashboard, and the Link data key you want to change in each link **
    branch_key = KeyV
    branch_secret = SecretV
    key_to_update = UpdateV


    # Insert filename for CSV containing links to update in first column, and values to add in second column **
    ifile = open(File, "r", encoding="utf-8")

    # Constants
    branchendpoint = "https://api2.branch.io/v1/url?url="
    reader = csv.reader(ifile, delimiter=',')


    # Uncomment the next line if you want the script to skip the first line of the CSV
    next(reader)

    # Loop through CSV
    for row in reader:

        # Retrieve link data for link being updated
        url = urllib.parse.quote_plus(row[0])
        getrequest = branchendpoint + url +"&branch_key=" + branch_key
        linkdata = requests.get(getrequest)
        jsonData = json.loads(linkdata.text)

        if linkdata.status_code != 200:
            print('Failed: {}'.format( getrequest))
            continue

        # Set credentials for update API
        jsonData["branch_key"] = branch_key
        jsonData["branch_secret"] = branch_secret

        #TODO for editing new value
        newValue = row[1]
        if key_to_update in jsonData:
            jsonData[key_to_update] = newValue
        if key_to_update in jsonData["data"]:
            jsonData["data"][key_to_update] = newValue

        if jsonData.get('type', None) is not None:
            del jsonData['type']
        if jsonData.get('alias', None):
            del jsonData['alias']
        payload = json.dumps(jsonData)
        print("\n \n payload")
        print(payload)
        putrequest = branchendpoint + url

        print(putrequest)
        r = requests.put(putrequest, json=jsonData)
        print(r.url)
        print(r)
        
    ifile.close()