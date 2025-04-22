Overview of Linking, Deep Links, Android App Links, and iOS Universal Links

An overview of available resources to implement Linking and Deep Links in your Expo apps.

Linking
Linking allows your app to interact with incoming and outgoing URLs. In this process, the user not only gets directed to open your app, but they are taken to a specific screen (route) within the app.

Linking strategies
There are different linking strategies you handle in your Expo app:

Linking to your app using your web domain links (universal linking using the https or http scheme)
Linking to your app from other apps or websites using a custom scheme (deep links)
Linking to other apps from your app (outgoing links)
Tip: Support for incoming links in Expo Go is limited. We recommend using Development builds to test your app's linking strategies.
Universal linking
Both Android and iOS implement their own systems for routing web URL's to an app if the app is installed. On Android, this system is called App Links, and on iOS it is called Universal Links. The pre-requisite for both systems is that you have a web domain where you can host a file which verifies you control the domain.

Android App Links
Android App Links are different from standard deep links as they use regular HTTP and HTTPS schemes and are exclusive to Android devices.

This link type allows your app to always open when a user clicks the link instead of choosing between the browser or another handler from a dialog displayed on the device. If the user doesn't have your app installed, the link takes them to your app's associated website.

Configure Android App Links
Learn how to configure intentFilters and set up two-way association from a standard web URL.

iOS Universal Links
iOS Universal Links are different from standard deep links as they use regular HTTP and HTTPS schemes and are exclusive to iOS devices.

This link type allows your app to open when a user clicks an HTTP(S) link pointing to your web domain. If the user doesn't have your app installed, the link takes them to your app's associated website. You can further configure the website by displaying a banner for the user to open your app using Apple Smart Banner.

Configure iOS Universal Links
Learn how to configure associatedDomains and set up two-way association.

Linking to your app from other apps or websites
Deep Links are links to a specific URL-based content inside an app or a website.

For example, by clicking a product advertisement, your app will open on the user's device and they can view that product's details. This product's link that the user clicked may look like (or alternatively be invoked by JavaScript with setting window.location.href):

<a href="myapp://web-app.com/product">View Product</a>
This link is constructed by three parts:

Scheme: The URL scheme that identifies the app that should open the URL (example: myapp://). It can also be https or http for non-standard deep links. We recommend universal linking for http(s)-based deep links.
Host: The domain name of the app that should open the URL (example: web-app.com).
Path: The path to the screen that should be opened (example: /product). If the path isn't specified, the user is taken to the home screen of the app.
Linking to your app
Learn how to configure custom URL schemes to create a deep link of your app.

Use Expo Router to handle deep linking
To implement any of the above Linking strategies, we recommend using Expo Router since deep linking is automatically enabled for all of your app's screens.

Benefits:

Link component from Expo Router can be used to handle URL schemes to other apps
Android App Links and iOS Universal Links require configuring runtime routing in JavaScript for the link in your app. Using Expo Router, you don't have to configure runtime routing separately since deep links for all routes are automatically enabled.
For third-party deep links, you can override the default linking behavior to handle incoming links and send navigation events. See Customizing links.
Linking to other apps from your app
Linking to other apps from your app is achieved using a URL based on the target app's URL scheme. This URL scheme allows you to reference resources within that native app.

Your app can use a common URL scheme for default apps, including https and http (commonly used by web browsers like Chrome, Safari, and so on), and use JavaScript to invoke the URL that launches the corresponding native app.

Linking into other apps

Learn how to handle and open a URL from your app based on the URL scheme of another app.

Handling linking into other apps from your app is achieved by using the target app's URL. There are two methods you can use to open such URLs from your app:

Using the expo-linking API
Using Expo Router's Link component
Using expo-linking API
The expo-linking API provides a universal abstraction over native linking APIs (such as window.history on the web) and offers utilities for your app to interact with other installed apps.

The example below opens at the common URL scheme in the default browser of the operating system using Linking.openURL:

index.tsx

Copy


import { Button, View, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

export default function Home() {
  return (
    <View style={styles.container}>
      <Button title="Open a URL" onPress={() => Linking.openURL('https://expo.dev/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

Show More
Using Expo Router's Link component
If your project uses Expo Router, use the Link component to open a URL. It wraps a <Text> component on native platforms and an <a> element on the web. It also uses the expo-linking API to handle URL schemes.

The example below opens a common URL scheme (HTTPS) in the default browser of the operating system:

index.tsx

Copy


import { Button, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <Link href="https://expo.dev">Open a URL</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

Show More
Common URL schemes
There are built-in URL schemes that provide access to core functionality on all platforms. Here is a list of commonly-used schemes:

Scheme	Description	Example
https / http	Open web browser app.	https://expo.dev
mailto	Open mail app.	mailto:support@expo.dev
tel	Open phone app.	tel:+123456789
sms	Open SMS app.	sms:+123456789
Specify Android intents to handle common URL schemes
Custom URL schemes
If you know the custom scheme for the app you want to open, you can link to it using any of the methods: Using expo-linking API or Using Link from Expo Router.

Some services provide documentation on how to use their app's custom URL schemes. For example, Uber's deep linking documentation describes how to link directly to a specific pickup location and destination:

uber://?client_id=<CLIENT_ID>&action=setPickup&pickup[latitude]=37.775818&pickup[longitude]=-122.418028&pickup[nickname]=UberHQ&pickup[formatted_address]=1455%20Market%20St%2C%20San%20Francisco%2C%20CA%2094103&dropoff[latitude]=37.802374&dropoff[longitude]=-122.405818&dropoff[nickname]=Coit%20Tower&dropoff[formatted_address]=1%20Telegraph%20Hill%20Blvd%2C%20San%20Francisco%2C%20CA%2094133&product_id=a1111c8c-c720-46c3-8534-2fcdd730040d&link_text=View%20team%20roster&partner_deeplink=partner%3A%2F%2Fteam%2F9383
In the example above, if the user does not have the Uber app installed on their device, your app can direct them to the Google Play Store or Apple App Store to install it. We recommend using the react-native-app-link library to handle these scenarios.

Specify custom schemes for iOS
Create URLs
You can use Linking.createURL to create a URL that can be used to open or redirect back to your app. This method resolves to the following:

Production and development builds: myapp://, where myapp is the custom scheme defined in the app config
Development in Expo Go: exp://127.0.0.1:8081
Using Linking.createURL helps you avoid hardcoding URLs. You can modify the returned URL by passing optional parameters to this method.

To pass data to your app, you can append it as a path or query string to the URL. Linking.createURL will construct a working URL automatically. For example:

Example

Copy


const redirectUrl = Linking.createURL('path/into/app', {
  queryParams: { hello: 'world' },
});
This will resolve into the following, depending on the environment:

Production and development builds: myapp://path/into/app?hello=world
Development in Expo Go: exp://127.0.0.1:8081/--/path/into/app?hello=world
Using Expo Go for testing?
In-app browsers
The expo-linking API allows you to open a URL using the operating system's default web browser app. You can use the expo-web-browser library to open URLs in an in-app browser. For example, an in-app browser is useful for secure authentication.

Example of opening a URL in an in-app browser
Additional link functionality on web
To provide additional link functionality on the web, such as right-click to copy or hover to preview, you can use a Link component from the expo-router library.

index.tsx

Copy


import { Link } from 'expo-router';

export default function Home() {
  return <Link href="https://expo.dev">Go to Expo</Link>;
}
Alternatively, you can use the @expo/html-elements library to use a universal <A> element:

index.tsx

Copy


import { A } from '@expo/html-elements';

export default function Home() {
  return <A href="https://expo.dev">Go to Expo</A>;
}
The <A> component renders an <a> on the web and an interactive <Text>that uses the expo-linking API on native platforms.

Previous (Dev

Linking into your app

Learn how to handle an incoming URL in your React Native and Expo app by creating a deep link.

This guide provides steps to configure standard deep links in your project by adding a custom scheme.

For most apps, you probably want to set up Android App/iOS Universal Links instead of the deep links described in this guide or set up both.
Add a custom scheme in app config
To provide a link to your app, add a custom string to the scheme property in the app config:

app.json

Copy


{
  "expo": {
    "scheme": "myapp"
  }
}
After adding a custom scheme to your app, you need to create a new development build. Once the app is installed on a device, you can open links within your app using myapp://.

If the custom scheme is not defined, the app will use android.package and ios.bundleIdentifier as the default schemes in both development and production builds. This is because Expo Prebuild automatically adds these properties as custom schemes for Android and iOS.

Test the deep link
You can test a link that opens your app using npx uri-scheme, which is a command-line utility for interacting and testing URI schemes.

For example, if your app has a /details screen that you want to open when a user taps on a link (either through another app or a web browser), you can test this behavior by running the following command:

Terminal
npx uri-scheme open com.example.app://somepath/details --android
npx uri-scheme open myapp://somepath/details --ios
Running the above command:

Opens your app's /details screen
The android or ios options specify that the link should be opened on Android or iOS
Alternatively, you can try opening the link by clicking a link like <a href="scheme://">Click me</a> in the device's web browser. Note that entering the link in the address bar may not work as expected, and you can use universal linking to implement that ability.
Test a link using Expo Go
Handle URLs
If you are using Expo Router, you can ignore this section.
You can observe links that launch your app using the Linking.useURL() hook from expo-linking.

index.tsx

Copy


import * as Linking from 'expo-linking';

export default function Home() {
  const url = Linking.useURL();

  return <Text>URL: {url}</Text>;
}
The Linking.useURL() hook works behind the scenes by following these imperative methods:

The link that launched the app is initially returned using Linking.getInitialURL()
Any new links triggered while the app is already open are observed with Linking.addEventListener('url', callback)
Parse URLs
You can use the Linking.parse() method to parse the path, hostname, and query parameters from a URL. This method extracts deep linking information and considers nonstandard implementations.

index.tsx

Copy


import * as Linking from 'expo-linking';

export default function Home() {
  const url = Linking.useURL();

  if (url) {
    const { hostname, path, queryParams } = Linking.parse(url);

    console.log(
      `Linked to app with hostname: ${hostname}, path: ${path} and data: ${JSON.stringify(
        queryParams
      )}`
    );
  }

  return (
    Your React component here. 
  )
}
Limitations
If a user does not have your app installed, deep links to your app will not work. Attribution services like Branch offer solutions for conditionally linking to your app or web page.

Android App/iOS Universal Links is another solution you can use to handle such cases. This type of linking allows your app to open when a user clicks follows an HTTP(S) link pointing to your web domain. If the user doesn't have your app installed, the link takes them to your website. For more details, see universal linking.

Android App Links

Learn how to configure Android App Links to open your Expo app from a standard web URL.

To configure Android App Links for your app, you need to:

Add intentFilters and set autoVerify to true in your project's app config
Set up two-way association to verify your website and native app
Watch: Set up Android App Links with Expo Router
Watch: Set up Android App Links with Expo Router
Add intentFilters to the app config
Configure your app config by adding the android.intentFilters property and setting the autoVerify attribute to true. Specifying autoVerify is required for Android App Links to work correctly.

The following example shows a basic configuration that enables your app to appear in the standard Android dialog as an option for handling any links to the webapp.io domain. It also uses the regular https scheme since Android App Links are different from standard deep links.

app.json

Copy


{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "*.webapp.io",
              "pathPrefix": "/records"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
Set up two-way association
To setup two-way association between the website and Android app, you will need the following:

Website verification: This requires creating a assetlinks.json file inside the /.well-known directory and hosting it on the target website. This file is used to verify that the app opened from a given link is the correct app.
Native app verification: This requires some form of code signing that references the target website domain (URL).
Create assetlinks.json file
1

Create an assetlinks.json file for the website verification (also known as digital asset links file) at /.well-known/assetlinks.json. This file is used to verify that the app opened for a given link.

If you're using Expo Router to build your website (or any other modern React framework such as Remix, Next.js, and so on), create assetlinks.json at public/.well-known/assetlinks.json. For legacy Expo webpack projects, create the file at web/.well-known/assetlinks.json.

2

Get the value of package_name from your app config, under android.package.

3

Get the value of sha256_cert_fingerprints from your app's signing certificate. If you're using EAS Build to build your Android app, after creating a build:

Run eas credentials -p android command, and select the build profile to get its fingerprint value.
Copy the fingerprint value listed under SHA256 Fingerprint.
Alternate method to obtain the SHA256 certificate fingerprint from Google Play Console
4

Add package_name and sha256_cert_fingerprints to the assetlinks.json file:

public/.well-known/assetlinks.json

Copy


[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example",
      "sha256_cert_fingerprints": [
        // Supports multiple fingerprints for different apps and keys
        "14:6D:E9:83:51:7F:66:01:84:93:4F:2F:5E:E0:8F:3A:D6:F4:CA:41:1A:CF:45:BF:8D:10:76:76:CD"
      ]
    }
  }
]
You can add multiple fingerprints to the sha256_cert_fingerprints array to support different variants of your app. For more information, see Android's documentation on how to declare website associations.
Host assetlinks.json file
Host the assetlinks.json file using a web server with your domain. This file must be served with the content-type application/json and accessible over an HTTPS connection. Verify that your browser can access this file by typing the complete URL in the address bar.

Native app verification
Install the app on an Android device to trigger the Android app verification process.

Once you have your app opened, see Handle links into your app for more information on how to handle inbound links and show the user the content they requested.

Debugging
The Expo CLI enables you to test Android App Links without deploying a website. Utilizing the --tunnel functionality, you can forward your dev server to a publicly available HTTPS URL.

1

Set the environment variable EXPO_TUNNEL_SUBDOMAIN=my-custom-domain where my-custom-domain is a unique string that you use during development. This ensures that your tunnel URL is consistent across dev server restarts.

2

Add intentFilters to your app config as described above. Replace the host value with a Ngrok URL: my-custom-domain.ngrok.io.

3

Start your dev server with the --tunnel flag:

Terminal

Copy

npx expo start --tunnel
4

Compile the development build on your device:

Terminal

Copy

npx expo run:android
5

Use the following adb command to start the intent activity and open the link on your app or type the custom domain link in your device's web browser.

Terminal

Copy

adb shell am start -a android.intent.action.VIEW  -c android.intent.category.BROWSABLE -d "https://my-custom-domain.ngrok.io/" <your-package-name>
Troubleshooting
Here are some common tips to help you troubleshoot when implementing Android App Links:

Ensure your website is served over HTTPS and with the content-type application/json
Verify Android app links
Android verification may take 20 seconds or longer to take effect, so be sure to wait until it is completed.
If you update your web files, rebuild the native app to trigger a server update on the vendor side (Google)

iOS Universal Links

Learn how to configure iOS Universal Links to open your Expo app from a standard web URL.

To configure iOS Universal Links for your app, you need to set up the two-way association to verify your website and native app.

Watch: Set up iOS Universal Links with Expo Router
Watch: Set up iOS Universal Links with Expo Router
Set up two-way association
To setup two-way association between the website and app for iOS, you need to perform the following steps:

Website verification: This requires creating a apple-app-site-association (AASA) file inside the /.well-known directory and hosting it on the target website. This file is used to verify that the app opened from a given link is the correct app.
Native app verification: This requires some form of code signing that references the target website domain (URL).
Create AASA file
Create an apple-app-site-association file for the website verification inside the /.well-known directory. This file specifies your Apple Developer Team ID, bundle identifier, and a list of supported paths to redirect to the native app.

You can run the experimental CLI command npx setup-safari inside your project to automatically register a bundle identifier to your Apple account, assign entitlements to the ID, and create an iTunes app entry in the store. The local setup will be printed and you can skip most the following. This is the easiest way to get started with universal links on iOS.
If you're using Expo Router to build your website (or any other modern React framework such as Remix, Next.js, and so on), create the AASA file at public/.well-known/apple-app-site-association. For legacy Expo webpack projects, create the file at web/.well-known/apple-app-site-association.

public/.well-known/apple-app-site-association

Copy


{
  // This section enables Universal Links
  "applinks": {
    "apps": [],
    "details": [
      {
        // Syntax: "<APPLE_TEAM_ID>.<BUNDLE_ID>"
        "appID": "QQ57RJ5UTD.com.example.myapp",
        // All paths that should support redirecting.
        "paths": ["/records/*"]
      }
    ]
  },
  // This section enables Apple Handoff
  "activitycontinuation": {
    "apps": ["<APPLE_TEAM_ID>.<BUNDLE_ID>"]
  },
  // This section enable Shared Web Credentials
  "webcredentials": {
    "apps": ["<APPLE_TEAM_ID>.<BUNDLE_ID>"]
  }
}

Show More
In the above example:

Any links to https://www.myapp.io/records/* (with wildcard matching for the record ID) should be opened directly by the app with a matching bundle identifier on an iOS device. It is a combination of the Apple Team ID and the bundle identifier.
The * wildcard does not match domain or path separators (periods and slashes).
The activitycontinuation and webcredentials objects are optional, but recommended.
See Apple's documentation for further details on the format of the AASA. Branch provides an AASA validator which can help you confirm that your AASA is correctly deployed and has a valid format.

Supporting details format
The details format is supported as of iOS 13. It allows you to specify:

appIDs instead of appID: Makes it easier to associate multiple apps with the same configuration
An array of components: Allows you to specify fragments, exclude specific paths, and add comments
An example AASA JSON from Apple's documentation
To support all iOS versions, you can provide both the above formats in your details key, but we recommend placing the configuration for more recent iOS versions first.

Host AASA file
Host the apple-app-site-association file using a web server with your domain. This file must be served over an HTTPS connection. Verify that your browser can access this file.

After you have setup the AASA file, deploy your website to a server that supports HTTPS (most modern web hosts).

Native app configuration
After deploying your apple-app-site-association (AASA) file, configure your app to use your associated domain by adding ios.associatedDomains to your app config. Make sure to follow Apple's specified format and not include the protocol (https) in your URL. This is a common mistake that will result in the universal links not working.

For example, if an associated website is https://expo.dev/, the applinks is:

app.json

Copy


{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:expo.dev"]
    }
  }
}
Build your iOS app with EAS Build which ensures that the entitlement is registered with Apple automatically.

Manual native configuration
Native app verification
Install the app on your iOS device to trigger the verification process. A link to your website on your mobile device should open your app. If it doesn't, re-check the previous steps to ensure that your AASA is valid, the path specified in the AASA, and you have correctly configured your App ID in the Apple Developer Console.

Once you have your app opened, see Handle links into your app for more information on how to handle inbound links and show the user the content they requested.

iOS downloads your AASA when your app is first installed or when updates are installed from the App Store. The operating system does not refresh frequently after that. If you want to change the paths in your AASA for a production app, you will need to issue a full update via the App Store so that all of your users' apps re-fetch your AASA and recognize the new paths.

Apple Smart Banner
If a user doesn't have your app installed, they'll be directed to the website. You can use the Apple Smart Banner to show a banner at the top of the page that prompts the user to install the app. The banner will only show up if the user is on a mobile device and doesn't have the app installed.

To enable the banner, add the following meta tag to the <head> of your website, replacing <ITUNES_ID> with your app's iTunes ID:

<meta name="apple-itunes-app" content="app-id=<ITUNES_ID>" />
If you're having trouble setting up the banner, run the following command to automatically generate the meta tag for your project:

Terminal

Copy

npx setup-safari
Add the meta tag to your statically rendered website
If you're building a statically rendered website with Expo Router, then add the HTML tag to the <head> component in your app/+html.js file.

app/+html.tsx

Copy


import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="apple-itunes-app" content="app-id=<ITUNES_ID>" />
        {/* Other head elements... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
Debugging
Expo CLI enables you to test iOS Universal Links without deploying a website. Utilizing the --tunnel functionality, you can forward your dev server to a publicly available HTTPS URL.

1

Set the environment variable EXPO_TUNNEL_SUBDOMAIN=my-custom-domain where my-custom-domain is a unique string that you use during development. This ensures that your tunnel URL is consistent across dev server restarts.

2

Add associatedDomains to your app config as described above. Replace the domain value with a Ngrok URL: my-custom-domain.ngrok.io.

3

Start your dev server with the --tunnel flag:

Terminal

Copy

npx expo start --tunnel
4

Compile the development build on your device:

Terminal

Copy

npx expo run:ios
You can now type your custom domain link in your device's web browser to open your app.

Troubleshooting
Here are some common tips to help you troubleshoot when implementing iOS Universal Links:

Read Apple's official documentation on debugging universal links
Ensure your apple app site association file is valid by using a validator tool.
The uncompressed apple-app-site-association file cannot be larger than 128kb.
Ensure your website is served over HTTPS.
If you update your web files, rebuild the native app to trigger a server update on the vendor side (Apple).
An example AASA JSON from Apple's documentation
public/.well-known/apple-app-site-association

Copy


{
  "applinks": {
    "details": [
      {
        "appIDs": ["ABCDE12345.com.example.app", "ABCDE12345.com.example.app2"],
        "components": [
          {
            "#": "no_universal_links",
            "exclude": true,
            "comment": "Matches any URL whose fragment equals no_universal_links and instructs the system not to open it as a universal link"
          },
          {
            "/": "/buy/*",
            "comment": "Matches any URL whose path starts with /buy/"
          },
          {
            "/": "/help/website/*",
            "exclude": true,
            "comment": "Matches any URL whose path starts with /help/website/ and instructs the system not to open it as a universal link"
          },
          {
            "/": "/help/*",
            "?": {
              "articleNumber": "????"
            },
            "comment": "Matches any URL whose path starts with /help/ and which has a query item with name 'articleNumber' and a value of exactly 4 characters"
          }
        ]
      }
    ]
  }
}