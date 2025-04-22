Handling Android App Links 

bookmark_border
Deep links handle content URIs. Web links handle the
         HTTP and HTTPS schemes. Android App Links handle the autoVerify
         attribute.
Figure 1. Capabilities of deep links, web links, and Android App Links.
Users following links on devices have one goal in mind: to get to the content they want to see. As a developer, you can set up Android App Links to take users to a link's specific content directly in your app, bypassing the app-selection dialog, also known as the disambiguation dialog. Because Android App Links leverage HTTP URLs and association with a website, users who don't have your app installed go directly to content on your site.


Understand the different types of links
Before you implement Android App Links, it's important to understand the different types of links you can create in your Android app: deep links, web links, and Android App Links. Figure 1 shows the relationship among these types of links, and the following sections describe each type of link in more detail.

Deep links
Deep links are URIs of any scheme that take users directly to a specific part of your app. To create deep links, add intent filters to drive users to the right activity in your app, as shown in the following code snippet:


<activity
    android:name=".MyMapActivity"
    android:exported="true"
    ...>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="geo" />
    </intent-filter>
</activity>
When the user clicks a deep link, a disambiguation dialog might appear. This dialog allows the user to select one of multiple apps, including your app, that can handle the given deep link. Figure 2 shows the dialog after the user clicks a map link, asking whether to open the link in Maps or Chrome.



Figure 2. The disambiguation dialog

Web links
Web links are deep links that use the HTTP and HTTPS schemes. On Android 12 and higher, clicking a web link (that is not an Android App Link) always shows content in a web browser. On devices running previous versions of Android, if your app or other apps installed on a user's device can also handle the web link, users might not go directly to the browser. Instead, they'll see a disambiguation dialog similar to the one that appears in figure 2.

The following code snippet shows an example of a web link filter:


<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data android:scheme="http" />
    <data android:host="myownpersonaldomain.com" />
</intent-filter>
Android App Links
Android App Links, available on Android 6.0 (API level 23) and higher, are web links that use the HTTP and HTTPS schemes and contain the autoVerify attribute. This attribute allows your app to designate itself as the default handler of a given type of link. So when the user clicks on an Android App Link, your app opens immediately if it's installed—the disambiguation dialog doesn't appear.

If the user doesn't want your app to be the default handler, they can override this behavior from the app's settings.

The following code snippet shows an example of an Android App Link filter:


<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <!-- Do not include other schemes. -->
    <data android:scheme="http" />
    <data android:scheme="https" />

    <data android:host="myownpersonaldomain.com" />
</intent-filter>
Android App Links offer the following benefits:

Secure and specific: Android App Links use HTTP URLs that link to a website domain you own, so no other app can use your links. One of the requirements for Android App Links is that you verify ownership of your domain through one of our website association methods.
Seamless user experience: Since Android App Links use a single HTTP URL for the same content on your website and in your app, users who don’t have the app installed simply go to your website instead of the app — no 404s, no errors.
Android Instant Apps support: With Android Instant Apps, your users can run your Android app without installing it. To add Instant App support to your Android app, set up Android App Links and visit g.co/InstantApps.
Engage users from Google Search: Users directly open specific content in your app by clicking a URL from Google in a mobile browser, in the Google Search app, in screen search on Android, or through Google Assistant.
Add Android App Links
The general steps for creating Android App Links are as follows:

Create deep links to specific content in your app: In your app manifest, create intent filters for your website URIs and configure your app to use data from the intents to send users to the right content in your app. Learn more in Create Deep Links to App Content.
Add verification for your deep links: Configure your app to request verification of app links. Then, publish a Digital Asset Links JSON file on your websites to verify ownership through Google Search Console. Learn more in Verify App Links.
As an alternative to the documentation linked above, the Android App Links Assistant is a tool in Android Studio that guides you through each of the steps required to create Android App Links.

For additional information, see the following resources:

Add Android App Links in Android Studio
Creating a Statement List
Manage and verify Android App Links
You can manage and verify deep links through the Play Console. Once an app has been successfully uploaded the dashboard (located under Grow > Deep links) displays an overview of deep links and configuration errors.



Figure 3. Deep links Play Console dashboard

The dashboard offers the following sections:

Highlights of the overall deep links configuration
All the domains declared in the manifest file
Web links which are grouped by path
Links which have custom schemes
Each one of these sections displays the deep link status and a way to fix them in case of an error.
Please refer to this guide for more information on the dashboard.

Create Deep Links to App Content 

bookmark_border
When a clicked link or programmatic request invokes a web URI intent, the Android system tries each of the following actions, in sequential order, until the request succeeds:

Open the user's preferred app that can handle the URI, if one is designated.
Open the only available app that can handle the URI.
Allow the user to select an app from a dialog.
Follow the steps below to create and test links to your content. You can also use the App Links Assistant in Android Studio to add Android App Links.

Note: Starting in Android 12 (API level 31), a generic web intent resolves to an activity in your app only if your app is approved for the specific domain contained in that web intent. If your app isn't approved for the domain, the web intent resolves to the user's default browser app instead.

Add intent filters for incoming links
To create a link to your app content, add an intent filter that contains these elements and attribute values in your manifest:

<action>
Specify the ACTION_VIEW intent action so that the intent filter can be reached from Google Search.
<data>
Add one or more <data> tags, each of which represents a URI format that resolves to the activity. At minimum, the <data> tag must include the android:scheme attribute.
You can add more attributes to further refine the type of URI that the activity accepts. For example, you might have multiple activities that accept similar URIs, but which differ simply based on the path name. In this case, use the android:path attribute or its pathPattern or pathPrefix variants to differentiate which activity the system should open for different URI paths.

<category>
Include the BROWSABLE category. It is required in order for the intent filter to be accessible from a web browser. Without it, clicking a link in a browser cannot resolve to your app.
Also include the DEFAULT category. This allows your app to respond to implicit intents. Without this, the activity can be started only if the intent specifies your app component name.

The following XML snippet shows how you might specify an intent filter in your manifest for deep linking. The URIs “example://gizmos” and “http://www.example.com/gizmos” both resolve to this activity.


<activity
    android:name="com.example.android.GizmosActivity"
    android:label="@string/title_gizmos" >
    <intent-filter android:label="@string/filter_view_http_gizmos">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- Accepts URIs that begin with "http://www.example.com/gizmos” -->
        <data android:scheme="http"
              android:host="www.example.com"
              android:pathPrefix="/gizmos" />
        <!-- note that the leading "/" is required for pathPrefix-->
    </intent-filter>
    <intent-filter android:label="@string/filter_view_example_gizmos">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- Accepts URIs that begin with "example://gizmos” -->
        <data android:scheme="example"
              android:host="gizmos" />
    </intent-filter>
</activity>
Notice that the two intent filters only differ by the <data> element. Although it's possible to include multiple <data> elements in the same filter, it's important that you create separate filters when your intention is to declare unique URLs (such as a specific combination of scheme and host), because multiple <data> elements in the same intent filter are actually merged together to account for all variations of their combined attributes. For example, consider the following:


<intent-filter>
  ...
  <data android:scheme="https" android:host="www.example.com" />
  <data android:scheme="app" android:host="open.my.app" />
</intent-filter>
It might seem as though this supports only https://www.example.com and app://open.my.app. However, it actually supports those two, plus these: app://www.example.com and https://open.my.app.

Caution: If multiple activities contain intent filters that resolve to the same verified Android App Link, then there's no guarantee as to which activity handles the link.

Once you've added intent filters with URIs for activity content to your app manifest, Android is able to route any Intent that has matching URIs to your app at runtime.

To learn more about defining intent filters, see Allow Other Apps to Start Your Activity.

Read data from incoming intents
Once the system starts your activity through an intent filter, you can use data provided by the Intent to determine what you need to render. Call the getData() and getAction() methods to retrieve the data and action associated with the incoming Intent. You can call these methods at any time during the lifecycle of the activity, but you should generally do so during early callbacks such as onCreate() or onStart().

Here’s a snippet that shows how to retrieve data from an Intent:

Kotlin
Java

@Override
public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.main);

    Intent intent = getIntent();
    String action = intent.getAction();
    Uri data = intent.getData();
}
Follow these best practices to improve the user's experience:

The deep link should take users directly to the content, without any prompts, interstitial pages, or logins. Make sure that users can see the app content even if they never previously opened the application. It is okay to prompt users on subsequent interactions or when they open the app from the Launcher.
Follow the design guidance described in Navigation with Back and Up so that your app matches users' expectations for backward navigation after they enter your app through a deep link.
Test your deep links
You can use the Android Debug Bridge with the activity manager (am) tool to test that the intent filter URIs you specified for deep linking resolve to the correct app activity. You can run the adb command against a device or an emulator.

The general syntax for testing an intent filter URI with adb is:


$ adb shell am start
        -W -a android.intent.action.VIEW
        -d <URI> <PACKAGE>
For example, the command below tries to view a target app activity that is associated with the specified URI.


$ adb shell am start
        -W -a android.intent.action.VIEW
        -d "example://gizmos" com.example.android
Note: When defining a collection of primitive types in a route, such as @Serializable data class Product(val colors: List), the automatically generated deep link URL format is basePath?colors={value}. If you attempt to specify a URI with multiple query params (for example, basepath?colors=red&colors=blue), you must escape the ampersand (for example, basepath?colors=red\&colors=blue).
The manifest declaration and intent handler you set above define the connection between your app and a website and what to do with incoming links. However, in order to have the system treat your app as the default handler for a set of URIs, you must also request that the system verify this connection. The next lesson explains how to implement this verification.

To learn more about intents and app links, see the following resources:


Verify Android App Links 

bookmark_border
An Android App Link is a special type of deep link that allows your website URLs to immediately open the corresponding content in your Android app, without requiring the user to select the app. Android App Links use the Digital Asset Links API to establish trust that your app has been approved by the website to automatically open links for that domain. If the system successfully verifies that you own the URLs, the system automatically routes those URL intents to your app.

To verify that you own both your app and the website URLs, complete the following steps:

Add intent filters that contain the autoVerify attribute. This attribute signals to the system that it should verify whether your app belongs to the URL domains used in your intent filters.

Note: Starting in Android 12 (API level 31), you can manually verify how the system resolves your Android App Links.
Declare the association between your website and your intent filters by hosting a Digital Asset Links JSON file at the following location:


https://domain.name/.well-known/assetlinks.json
You can find related information in the following resources:

Supporting URLs and App Indexing in Android Studio
Creating a Statement List

Add intent filters for app links verification
To enable link handling verification for your app, add intent filters that match the following format:


<!-- Make sure you explicitly set android:autoVerify to "true". -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <!-- If a user clicks on a shared link that uses the "http" scheme, your
         app should be able to delegate that traffic to "https". -->
    <!-- Do not include other schemes. -->
    <data android:scheme="http" />
    <data android:scheme="https" />

    <!-- Include one or more domains that should be verified. -->
    <data android:host="..." />
</intent-filter>
Although it's sufficient to include autoVerify in only one <intent-filter> declaration for each host, even if that host is used across other unmarked declarations, it's recommended that you add autoVerify to each <intent-filter> element for consistency. This also ensures that, after your remove or refactor elements in your manifest file, your app remains associated with all the domains that you still define.

The domain verification process requires an internet connection and could take some time to complete. To help improve the efficiency of the process, the system verifies a domain for an app that targets Android 12 or higher only if that domain is inside an <intent-filter> element that contains the exact format specified in the preceding code snippet. For example, schemes other than "http" and "https", such as <data android:scheme="custom" />, will prevent an <intent-filter> from triggering domain verification.

Note: On apps that target Android 12, the system makes several changes to how Android App Links are verified. These changes improve the reliability of the app-linking experience and provide more control to app developers and end users. You can manually invoke domain verification to test the reliability of your declarations.
Supporting app linking for multiple hosts
The system must be able to verify the host specified in the app’s URL intent filters’ data elements against the Digital Asset Links files hosted on the respective web domains in that intent filter. If the verification fails, the system then defaults to its standard behavior to resolve the intent, as described in Create Deep Links to App Content. However, the app can still be verified as a default handler for any of the URL patterns defined in the app's other intent filters.

Note: On Android 11 (API level 30) and lower, the system doesn't verify your app as a default handler unless it finds a matching Digital Asset Links file for all hosts that you define in the manifest.

For example, an app with the following intent filters would pass verification only for https://www.example.com if an assetlinks.json file were found at https://www.example.com/.well-known/assetlinks.json but not https://www.example.net/.well-known/assetlinks.json:


<application>

  <activity android:name=”MainActivity”>
    <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="http" />
      <data android:scheme="https" />
      <data android:host="www.example.com" />
    </intent-filter>
  </activity>
  <activity android:name=”SecondActivity”>
    <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" />
     <data android:host="www.example.net" />
    </intent-filter>
  </activity>

</application>
Note: All <data> elements in the same intent filter are merged together to account for all variations of their combined attributes. For example, the first intent filter above includes a <data> element that only declares the HTTPS scheme. But it is combined with the other <data> element so that the intent filter supports both http://www.example.com and https://www.example.com. As such, you must create separate intent filters when you want to define specific combinations of URI schemes and domains.

Supporting app linking for multiple subdomains
The Digital Asset Links protocol treats subdomains in your intent filters as unique, separate hosts. So if your intent filter lists multiple hosts with different subdomains, you must publish a valid assetlinks.json on each domain. For example, the following intent filter includes www.example.com and mobile.example.com as accepted intent URL hosts. So a valid assetlinks.json must be published at both https://www.example.com/.well-known/assetlinks.json and https://mobile.example.com/.well-known/assetlinks.json.


<application>
  <activity android:name=”MainActivity”>
    <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" />
      <data android:scheme="https" />
      <data android:host="www.example.com" />
      <data android:host="mobile.example.com" />
    </intent-filter>
  </activity>
</application>
Alternatively, if you declare your hostname with a wildcard (such as *.example.com), you must publish your assetlinks.json file at the root hostname (example.com). For example, an app with the following intent filter will pass verification for any sub-name of example.com (such as foo.example.com) as long as the assetlinks.json file is published at https://example.com/.well-known/assetlinks.json:


<application>
  <activity android:name=”MainActivity”>
    <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" />
      <data android:host="*.example.com" />
    </intent-filter>
  </activity>
</application>
Check for multiple apps associated with the same domain
If you publish multiple apps that are each associated with the same domain, they can each be successfully verified. However, if the apps can resolve the exact same domain host and path, as might be the case with lite and full versions of an app, only the app that was installed most recently can resolve web intents for that domain.

In a case like this, check for possible conflicting apps on the user's device, provided that you have the necessary package visibility. Then, in your app, show a custom chooser dialog that contains the results from calling queryIntentActivities(). The user can select their preferred app from the list of matching apps that appear in the dialog.

Note: Consider storing the matching path so that the user doesn't have to re-select if a similar web intent is launched later.
Declare website associations
A Digital Asset Links JSON file must be published on your website to indicate the Android apps that are associated with the website and verify the app's URL intents. The JSON file uses the following fields to identify associated apps:

package_name: The application ID declared in the app's build.gradle file.
sha256_cert_fingerprints: The SHA256 fingerprints of your app’s signing certificate. You can use the following command to generate the fingerprint via the Java keytool:

keytool -list -v -keystore my-release-key.keystore
This field supports multiple fingerprints, which can be used to support different versions of your app, such as debug and production builds.
If you're using Play App Signing for your app, then the certificate fingerprint produced by running keytool locally will usually not match the one on users' devices. You can verify whether you're using Play App Signing for your app in your Play Console developer account under Release > Setup > App signing; if you do, then you'll also find the correct Digital Asset Links JSON snippet for your app on the same page.

The following example assetlinks.json file grants link-opening rights to a com.example Android app:


[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example",
    "sha256_cert_fingerprints":
    ["14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"]
  }
}]
Associating a website with multiple apps
A website can declare associations with multiple apps within the same assetlinks.json file. The following file listing shows an example of a statement file that declares association with two apps, separately, and resides at https://www.example.com/.well-known/assetlinks.json:


[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example.puppies.app",
    "sha256_cert_fingerprints":
    ["14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"]
  }
  },
  {
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example.monkeys.app",
    "sha256_cert_fingerprints":
    ["14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"]
  }
}]
Different apps may handle links for different resources under the same web host. For example, app1 may declare an intent filter for https://example.com/articles, and app2 may declare an intent filter for https://example.com/videos.

Note: Multiple apps associated with a domain may be signed with the same or different certificates.

Associating multiple websites with a single app
Multiple websites can declare associations with the same app in their respective assetlinks.json files. The following file listings show an example of how to declare the association of example.com and example.net with app1. The first listing shows the association of example.com with app1:

https://www.example.com/.well-known/assetlinks.json


[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mycompany.app1",
    "sha256_cert_fingerprints":
    ["14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"]
  }
}]
The next listing shows the association of example.net with app1. Only the location where these files are hosted is different (.com and .net):

https://www.example.net/.well-known/assetlinks.json


[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mycompany.app1",
    "sha256_cert_fingerprints":
    ["14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"]
  }
}]
Publishing the JSON verification file
You must publish your JSON verification file at the following location:


https://domain.name/.well-known/assetlinks.json
Be sure of the following:

The assetlinks.json file is served with content-type application/json.
The assetlinks.json file must be accessible over an HTTPS connection, regardless of whether your app's intent filters declare HTTPS as the data scheme.
The assetlinks.json file must be accessible without any redirects (no 301 or 302 redirects).
If your app links support multiple host domains, then you must publish the assetlinks.json file on each domain. See Supporting app linking for multiple hosts.
Do not publish your app with dev/test URLs in the manifest file that may not be accessible to the public (such as any that are accessible only with a VPN). A work-around in such cases is to configure build variants to generate a different manifest file for dev builds.
Android App Links verification
When android:autoVerify="true" is present in at least one of your app's intent filters, installing your app on a device that runs Android 6.0 (API level 23) or higher causes the system to automatically verify the hosts associated with the URLs in your app's intent filters. On Android 12 and higher, you can also invoke the verification process manually to test the verification logic.


Auto verification
The system's auto-verification involves the following:

The system inspects all intent filters that include any of the following:
Action: android.intent.action.VIEW
Categories: android.intent.category.BROWSABLE and android.intent.category.DEFAULT
Data scheme: http or https
For each unique host name found in the above intent filters, Android queries the corresponding websites for the Digital Asset Links file at https://hostname/.well-known/assetlinks.json.
Note: On Android 11 (API level 30) and lower, the system establishes your app as the default handler for the specified URL patterns only if it finds a matching Digital Asset Links file for all hosts in the manifest.
After you have confirmed the list of websites to associate with your app, and you have confirmed that the hosted JSON file is valid, install the app on your device. Wait at least 20 seconds for the asynchronous verification process to complete. Use the following command to check whether the system verified your app and set the correct link handling policies:


adb shell am start -a android.intent.action.VIEW \
    -c android.intent.category.BROWSABLE \
    -d "http://domain.name:optional_port"
Manual verification
Starting in Android 12, you can manually invoke domain verification for an app that's installed on a device. You can perform this process regardless of whether your app targets Android 12.

Establish an internet connection
To perform domain verification, your test device must be connected to the internet.

Support the updated domain verification process
If your app targets Android 12 or higher, the system uses the updated domain verification process automatically.

Otherwise, you can manually enable the updated verification process. To do so, run the following command in a terminal window:


adb shell am compat enable 175408749 PACKAGE_NAME
Reset the state of Android App Links on a device
Before you manually invoke domain verification on a device, you must reset the state of Android App Links on the test device. To do so, run the following command in a terminal window:


adb shell pm set-app-links --package PACKAGE_NAME 0 all
This command puts the device in the same state that it's in before the user chooses default apps for any domains.

Invoke the domain verification process
After you reset the state of Android App Links on a device, you can perform the verification itself. To do so, run the following command in a terminal window:


adb shell pm verify-app-links --re-verify PACKAGE_NAME
Note: Before you review the results of this command, wait a few minutes for the verification agent to finish the requests related to domain verification.
Review the verification results
After allowing some time for the verification agent to finish its requests, review the verification results. To do so, run the following command:


adb shell pm get-app-links PACKAGE_NAME
The output of this command is similar to the following:


com.example.pkg:
    ID: 01234567-89ab-cdef-0123-456789abcdef
    Signatures: [***]
    Domain verification state:
      example.com: verified
      sub.example.com: legacy_failure
      example.net: verified
      example.org: 1026
The domains that successfully pass verification have a domain verification state of verified. Any other state indicates that the domain verification couldn't be performed. In particular, a state of none indicates that the verification agent might not have completed the verification process yet.

The following list shows the possible return values that domain verification can return for a given domain:

none
Nothing has been recorded for this domain. Wait a few more minutes for the verification agent to finish the requests related to domain verification, then invoke the domain verification process again.
verified
The domain is successfully verified for the declaring app.
approved
The domain was force-approved, usually by executing a shell command.
denied
The domain was force-denied, usually by executing a shell command.
migrated
The system preserved the result of a previous process that used legacy domain verification.
restored
The domain was approved after the user performed a data restore. It's assumed that the domain was previously verified.
legacy_failure
The domain was rejected by a legacy verifier. The specific failure reason is unknown.
system_configured
The domain was approved automatically by the device configuration.
Error code of 1024 or greater
Custom error code that's specific to the device's verifier.

Double-check that you have established a network connection, and invoke the domain verification process again.

Request the user to associate your app with a domain
Another way for your app to get approved for a domain is to ask the user to associate your app with that domain.

Note: On a given device, only one app at a time can be associated with a particular domain. If another app is already verified for the domain, the user must first disassociate that other app with the domain before they can associate your app with the domain.
Check whether your app is already approved for the domain
Before you prompt the user, check whether your app is the default handler for the domains that you define in your <intent-filter> elements. You can query the approval state using one of the following methods:

The DomainVerificationManager API (at runtime).
A command-line program (during testing).
DomainVerificationManager
The following code snippet demonstrates how to use the DomainVerificationManager API:

Kotlin
Java

Context context = TODO("Your activity or fragment's Context");
DomainVerificationManager manager =
        context.getSystemService(DomainVerificationManager.class);
DomainVerificationUserState userState =
        manager.getDomainVerificationUserState(context.getPackageName());

Map<String, Integer> hostToStateMap = userState.getHostToStateMap();
List<String> verifiedDomains = new ArrayList<>();
List<String> selectedDomains = new ArrayList<>();
List<String> unapprovedDomains = new ArrayList<>();
for (String key : hostToStateMap.keySet()) {
    Integer stateValue = hostToStateMap.get(key);
    if (stateValue == DomainVerificationUserState.DOMAIN_STATE_VERIFIED) {
        // Domain has passed Android App Links verification.
        verifiedDomains.add(key);
    } else if (stateValue == DomainVerificationUserState.DOMAIN_STATE_SELECTED) {
        // Domain hasn't passed Android App Links verification, but the user has
        // associated it with an app.
        selectedDomains.add(key);
    } else {
        // All other domains.
        unapprovedDomains.add(key);
    }
}
Command-line program
When testing your app during development, you can run the following command to query the verification state of the domains that your organization owns:


adb shell pm get-app-links --user cur PACKAGE_NAME
In the following example output, even though the app failed verification for the "example.org" domain, user 0 has manually approved the app in system settings, and no other package is verified for that domain.


com.example.pkg:
ID: ***
Signatures: [***]
Domain verification state:
  example.com: verified
  example.net: verified
  example.org: 1026
User 0:
  Verification link handling allowed: true
  Selection state:
    Enabled:
      example.org
    Disabled:
      example.com
      example.net
You can also use shell commands to simulate the process where the user selects which app is associated with a given domain. A full explanation of these commands is available from the output of adb shell pm.

Note: The system can only associate one app at a time with a domain, even when you use shell commands. Some special cases, such as installing two app variants simultaneously, require special handling to open a given web link in the intended app.
Provide context for the request
Before you make this request for domain approval, provide some context for the user. For example, you might show them a splash screen, a dialog, or a similar UI element that explains to the user why your app should be the default handler for a particular domain.

Make the request
After the user understands what your app is asking them to do, make the request. To do so, invoke an intent that includes the ACTION_APP_OPEN_BY_DEFAULT_SETTINGS intent action, and a data string matching package:com.example.pkg for the target app, as shown in the following code snippet:

Kotlin
Java

Context context = TODO("Your activity or fragment's Context");
Intent intent = new Intent(Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS,
    Uri.parse("package:" + context.getPackageName()));
context.startActivity(intent);
When the intent is invoked, users see a settings screen called Open by default. This screen contains a radio button called Open supported links, as shown in figure 1.

When the user turns on Open supported links, a set of checkboxes appear under a section called Links to open in this app. From here, users can select the domains that they want to associate with your app. They can also select Add link to add domains, as shown in figure 2. When users later select any link within the domains that they add, the link opens in your app automatically.

When the radio button is enabled, a section near the bottom
    includes checkboxes as well as a button called 'Add link'
Figure 1. System settings screen where users can choose which links open in your app by default.
Each checkbox represents a domain that you can add. The
    dialog's buttons are 'Cancel' and 'Add.'
Figure 2. Dialog where users can choose additional domains to associate with your app.
Open domains in your app that your app cannot verify
Your app's main function might be to open links as a third party, without the ability to verify its handled domains. If this is the case, explain to users that, at that time when they select a web link, they cannot choose between a first-party app and your (third-party) app. Users need to manually associate the domains with your third-party app.

In addition, consider introducing a dialog or trampoline activity that allows the user to open the link in the first-party app if the user prefers to do so, acting as a proxy. Before setting up such a dialog or trampoline activity, set up your app so that it has package visibility into the first-party apps that match your app's web intent filter.

Test app links
When implementing the app linking feature, you should test the linking functionality to make sure the system can associate your app with your websites, and handle URL requests, as you expect.

To test an existing statement file, you can use the Statement List Generator and Tester tool.

Confirm the list of hosts to verify
When testing, you should confirm the list of associated hosts that the system should verify for your app. Make a list of all URLs whose corresponding intent filters include the following attributes and elements:

android:scheme attribute with a value of http or https
android:host attribute with a domain URL pattern
android.intent.action.VIEW action element
android.intent.category.BROWSABLE category element
Use this list to check that a Digital Asset Links JSON file is provided on each named host and subdomain.

Confirm the Digital Asset Links files
For each website, use the Digital Asset Links API to confirm that the Digital Asset Links JSON file is properly hosted and defined:


https://digitalassetlinks.googleapis.com/v1/statements:list?
   source.web.site=https://domain.name:optional_port&
   relation=delegate_permission/common.handle_all_urls
Check link policies
As part of your testing process, you can check the current system settings for link handling. Use the following command to get a listing of existing link-handling policies for all apps on your connected device:


adb shell dumpsys package domain-preferred-apps
Or the following does the same thing:


adb shell dumpsys package d
Note: Make sure you wait at least 20 seconds after installation of your app to allow for the system to complete the verification process.

The command returns a listing of each user or profile defined on the device, preceded by a header in the following format:


App linkages for user 0:
Following this header, the output uses the following format to list the link-handling settings for that user:


Package: com.android.vending
Domains: play.google.com market.android.com
Status: always : 200000002
This listing indicates which apps are associated with which domains for that user:

Package - Identifies an app by its package name, as declared in its manifest.
Domains - Shows the full list of hosts whose web links this app handles, using blank spaces as delimiters.
Status - Shows the current link-handling setting for this app. An app that has passed verification, and whose manifest contains android:autoVerify="true", shows a status of always. The hexadecimal number after this status is related to the Android system's record of the user’s app linkage preferences. This value does not indicate whether verification succeeded.
Note: If a user changes the app link settings for an app before verification is complete, you may see a false positive for a successful verification, even though verification has failed. This verification failure, however, does not matter if the user explicitly enabled the app to open supported links without asking. This is because user preferences take precedence over programmatic verification (or lack of it). As a result, the link goes directly to your app, without showing a dialog, just as if verification had succeeded.

Test example
For app link verification to succeed, the system must be able to verify your app with each of the websites that you specify in a given intent filter that meets the criteria for app links. The following example shows a manifest configuration with several app links defined:


<application>

    <activity android:name=”MainActivity”>
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
            <data android:scheme="https" />
            <data android:host="www.example.com" />
            <data android:host="mobile.example.com" />
        </intent-filter>
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
            <data android:host="www.example2.com" />
        </intent-filter>
    </activity>

    <activity android:name=”SecondActivity”>
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
            <data android:host="account.example.com" />
        </intent-filter>
    </activity>

      <activity android:name=”ThirdActivity”>
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <data android:scheme="https" />
            <data android:host="map.example.com" />
        </intent-filter>
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="market" />
            <data android:host="example.com" />
        </intent-filter>
      </activity>

</application>
The list of hosts that the platform would attempt to verify from the above manifest is:


www.example.com
mobile.example.com
www.example2.com
account.example.com
The list of hosts that the platform would not attempt to verify from the above manifest is:


map.example.com (it does not have android.intent.category.BROWSABLE)
market://example.com (it does not have either an "http" or "https" scheme)
To learn more about statement lists, see Creating a Statement List.

Fix common implementation errors
If you can't verify your Android App Links, check for the following common errors. This section uses example.com as a placeholder domain name; when performing these checks, substitute example.com with your server's actual domain name.

Incorrect intent filter set up
Check to see whether you include a URL that your app doesn't own in an <intent-filter> element.
Incorrect server configuration
Check to your server's JSON configuration, and make sure the SHA value is correct.

Also, check that example.com. (with the trailing period) serves the same content as example.com.

Server-side redirects
The system doesn't verify any Android App Links for your app if you set up a redirect such as the following:

http://example.com to https://example.com
example.com to www.example.com
This behavior protects your app's security.

Server robustness
Check whether your server can connect to your client apps.

Non-verifiable links
For testing purposes, you might intentionally add non-verifiable links. Keep in mind that, on Android 11 and lower, these links cause the system to not verify all Android App Links for your app.

Incorrect signature in assetlinks.json
Verify that your signature is correct and matches the signature used to sign your app. Common mistakes include:

Signing the app with a debug certificate and only having the release signature in assetlinks.json.
Having a lower case signature in assetlinks.json. The signature should be in upper case.
If you are using Play App Signing, make sure you're using the signature that Google uses to sign each of your releases. You can verify these details, including a complete JSON snippet, by following instructions about declaring website associations.


Create App Links for Instant Apps 

bookmark_border
An Android Instant App is a small version of your app that runs without installation. Instead of installing an APK, users launch your app simply by clicking a URL. As such, all instant apps need to be accessible via a URL declared using Android App Links. This page explains how to use Android App Links for your Android Instant Apps.

Note: If you're not building an instant app, then you don't need to read this guide—you should instead create app links for your installable app by reading Create Deep Links to App Content.
App links overview
First, here's a summary of what you should already understand about app links.

When you create an intent filter for activities in your app that allow the user to jump straight to a specific screen in your app with a URL link, this is known as a "deep link." Other apps can declare a similar URL intent filter, though, so the system might ask the user which app to open. To create these deep links, read Create Deep Links to App Content.
When you publish an assetlinks.json file on the website that corresponds to your app's HTTP deep links, you verify that your app is the true owner of those URLs. Thus, you've converted your deep links into Android App Links, which ensure that your app instantly opens when the user clicks such a URL. To create app links, read Verify Android App Links.
So, Android App Links are simply HTTP deep links that your website is verified to own so that the user doesn't need to choose which app to open. For a more specific description, see differences between deep links and app links.

In both cases, however, the user must already have your app installed. If the user clicks one of your web site's links and they don't have your app installed (and no other app handles that URL intent), the URL is opened in a web browser. So, creating an Instant App solves this part—it allows users to open your app by simply clicking a URL, even if they don't have your app installed.

When end users perform a Google search for your app, Google Search displays a URL with the "Instant" badge.

How app links for instant apps are different
If you've already followed the guides to Create Deep Links to App Content and Verify Android App Links, then you've already done most of the work necessary to make app links work with your instant app. There are just a couple extra rules when using app links for instant apps:

All intent filters used as app links in your instant app must support both HTTP and HTTPS. For example:


<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="http" android:host="www.example.com" />
    <data android:scheme="https" />
</intent-filter>
Notice that you don't need to include the host in the second <data> element because, within each <intent-filter> element, all combinations of each <data> attribute are considered valid (so this intent filter does resolve https://www.example.com).

Only one instant app can be declared for each website domain. (This is unlike when creating app links for your installable app, which allows you to associate a website with multiple apps.)

Other reminders when creating app links
All HTTP URL intent filters in your instant app should be included in your installable app. This is important because once the user installs your full app, tapping a URL should always open the installed app, not the instant app.
You must set autoVerify="true" in at least one intent filter in both the instant and the installable app. (See how to enable automatic verification.)
You must publish one assetlinks.json for each domain (and subdomain supported by your app links, using the HTTPS protocol. (See how to support app linking for multiple hosts).
The assetlinks.json file must be valid JSON, be served without redirects, and be accessible to bots (your robots.txt must allow crawling /.well-known/assetlinks.json).
Use of wildcards in your intent filter's host attribute is not recommended. (See how to support app linking from multiple subdomains.)
Custom host/scheme URLs should be declared with separate intent filters.
Ensure that your app link URLs account for your top search results for your key terms.