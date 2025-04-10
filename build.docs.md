  EAS Build is a hosted service for building app binaries for your Expo and React Native projects.

It makes building your apps for distribution simple and easy to automate by providing defaults that work well for Expo and React Native projects out of the box, and by handling your app signing credentials for you (if you wish). It also makes sharing builds with your team easier than ever with internal distribution (using ad hoc and/or enterprise "universal" provisioning), deeply integrates with EAS Submit for app store submissions, and has first-class support for the expo-updates library.

It's designed to work for any native project, whether or not you use Expo and React Native. It's the fastest way to get from npx create-expo-app or npx @react-native-community/cli@latest init to app stores.

EAS Build allows you to build a ready-to-submit binary of your app for the Google Play Store or Apple App Store. In this guide, let's learn how to do that.

Alternatively, if you prefer to install the app directly to your Android device/emulator or install it in the iOS Simulator, we will point you toward resources that explain how to do that.

For a small app, builds for Android and iOS platforms trigger within a few minutes. If you encounter any issues along the way, you can reach out on Discord and Forums.

Prerequisites
EAS Build is a rapidly evolving service. Before you set out to create a build for your project we recommend consulting the limitations page and the other prerequisites below.

A React Native Android and/or iOS project that you want to build
Don't have a project yet? No problem. It's quick and easy to create a "Hello world" app that you can use with this guide.

Run the following command to create a new project:

Terminal

Copy

npx create-expo-app my-app
EAS Build also works well with projects created by npx create-react-native-app, npx react-native, ignite-cli, and other project bootstrapping tools.

An Expo user account
EAS Build is available to anyone with an Expo account, regardless of whether you pay for EAS or use our Free plan. You can sign up at https://expo.dev/signup.

Paid subscribers get quality improvements such as additional build concurrencies, priority access to minimize the time your builds spend queueing, and increased limits on build timeouts. Learn more about different plans and benefits at EAS pricing.

1

Install the latest EAS CLI
EAS CLI is the command-line app that you will use to interact with EAS services from your terminal. To install it, run the command:

Terminal

Copy

npm install -g eas-cli
You can also use the above command to check if a new version of EAS CLI is available. We encourage you to always stay up to date with the latest version.

We recommend using npm instead of yarn for global package installations. You may alternatively use npx eas-cli@latest. Remember to use that instead of eas whenever it's called for in the documentation.

2

Log in to your Expo account
If you are already signed in to an Expo account using Expo CLI, you can skip the steps described in this section. If you are not, run the following command to log in:

Terminal

Copy

eas login
You can check whether you are logged in by running eas whoami.

3

Configure the project
To configure an Android or an iOS project for EAS Build, run the following command:

Terminal

Copy

eas build:configure
To learn more about what happens behind the scenes, see build configuration process reference.

For development, we recommend creating a development build, which is a debug build of your app and contains the expo-dev-client library. It helps you iterate as quickly as possible and provides a more flexible, reliable, and complete development environment. To install the library, run the following command:

Terminal

Copy

npx expo install expo-dev-client
Additional configuration may be required for some scenarios:

Does your app code depend on environment variables? Add them to your build configuration.
Is your project inside of a monorepo? Follow these instructions.
Do you use private npm packages? Add your npm token.
Does your app depend on specific versions of tools like Node, Yarn, npm, CocoaPods, or Xcode? Specify these versions in your build configuration.
4

Run a build
Build for Android Emulator/device or iOS Simulator
The easiest way to try out EAS Build is to create a build that you can run on your Android device/emulator or iOS Simulator. It's quicker than uploading it to a store, and you don't need store developer membership accounts. If you'd like to try this, read about creating an installable APK for Android and creating a simulator build for iOS.

Build for app stores
Before the build process can start for app stores, you will need to have a store developer account and generate or provide app signing credentials.

Whether you have experience with generating app signing credentials or not, EAS CLI does the heavy lifting. You can opt-in for EAS CLI to handle the app signing credentials process. Check out the steps for Android app signing credentials or iOS app signing credentials process below for more information.

Google Play Developer membership is required to distribute to the Google Play Store.
Apple Developer Program membership is required to build for the Apple App Store.
After you have confirmed that you have a Google Play Store or Apple App Store account and decided whether or not EAS CLI should handle app signing credentials, you can proceed with the following set of commands to build for the platform's store:


Android


iOS

Terminal

Copy

eas build --platform android
You can attach a message to the build by passing --message to the build command, for example, eas build --platform ios --message "Some message". The message will appear on the website. It comes in handy when you want to leave a note with the purpose of the build for your team.

Alternatively, you can use --platform all option to build for Android and iOS at the same time:

Terminal

Copy

eas build --platform all
If you have released your app to stores previously and have existing app signing credentials that you want to use, follow these instructions to configure them.

Android app signing credentials
If you have not yet generated a keystore for your app, you can let EAS CLI take care of that for you by selecting Generate new keystore, and then you are done. The keystore is stored securely on EAS servers.
If you have previously built your app with expo build:android, you can use the same credentials here.
If you want to manually generate your keystore, see the manual Android credentials guide for more information.
iOS app signing credentials
If you have not generated a provisioning profile and/or distribution certificate yet, you can let EAS CLI take care of that for you by signing into your Apple Developer Program account and following the prompts.
If you have already built your app with expo build:ios, you can use the same credentials here.
If you want to rather manually generate your credentials, refer to the manual iOS credentials guide for more information.
5

Wait for the build to complete
By default, the eas build command will wait for your build to complete, but you can interrupt it if you prefer not to wait. Monitor the progress and read the logs by following the link to the build details page that EAS CLI prompts once the build process gets started. You can also find this page by visiting your build dashboard or running the following command:

Terminal

Copy

eas build:list
If you are a member of an organization and your build is on its behalf, you will find the build details on the build dashboard for that account.

Did your build fail? Double check that you followed any applicable instructions in the configuration step and refer to the troubleshooting guide if needed.

6

Deploy the build
If you have made it to this step, congratulations! Depending on which path you chose, you now either have a build that is ready to upload to an app store, or you have a build that you can install directly on an Android device/iOS Simulator.

Distribute your app to an app store
You will only be able to submit to an app store if you built specifically for that purpose. If you created a build for a store, learn how to submit your app to app stores with EAS Submit.

Install and run the app
You will only be able to install the app directly to your Android device/iOS Simulator if you explicitly built it for that purpose. If you built for app store distribution, you will need to upload to an app store and then install it from there (for example, from Apple's TestFlight app).

To learn how to install the app directly to your Android device/iOS Simulator, navigate to your build details page from your build dashboard and click the "Install" button.

Next steps
We walked you through the steps to create your first build with EAS Build without going into too much depth on any particular part of the process.

When you are ready to learn more, we recommend proceeding through the following topics to learn more:

Configuration with eas.json
Internal distribution
Updates
Automating submissions
Triggering builds from CI
You may also want to dig through the reference section to learn more about the topics that interest you most, such as:

Build webhooks
Build server infrastructure
How the Android and iOS build processes work


Configure EAS Build with eas.json

Learn how a project using EAS services is configured with eas.json.

eas.json is the configuration file for EAS CLI and services. It is generated when the eas build:configure command runs for the first time in your project and is located next to package.json at the root of your project. Configuration for EAS Build all belongs under the build key.

The default configuration for eas.json generated in a new project is shown below:

eas.json

Copy


{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
Build profiles
A build profile is a named group of configurations that describes the necessary parameters to perform a certain type of build.

The JSON object under the build key can contain multiple build profiles, and you can have custom build profile names. In the default configuration, there are three build profiles: development, preview, and production. However, these could have been named foo, bar, and baz.

To run a build with a specific profile, use the command as shown below with a <profile-name>:

Terminal

Copy

eas build --profile <profile-name>
If you omit the --profile flag, EAS CLI will default to using the profile with the name production (if it exists).

Platform-specific and common options
Inside each build profile, you can specify android and ios fields that contain platform-specific configuration for the build. Options that are available to both platforms can be provided on the platform-specific configuration object or the root of a profile.

Sharing configuration between profiles
Build profiles can be extended to other build profile properties using the extends option.

For example, in the preview profile you might have "extends": "production". This will make the preview profile inherit the configuration of the production profile.

You can keep chaining profile extensions up to the depth of 5 as long as you avoid making circular dependencies.

Common use cases
Developers using Expo tools usually end up having three different types of builds: development, preview, and production.

Development builds
By default, eas build:configure will create a development profile with "developmentClient": true. This indicates that this build depends on expo-dev-client. These builds include developer tools, and they are never submitted to an app store.

The development profile also defaults to "distribution": "internal". This will make it easy to distribute your app directly to physical Android and iOS devices.

You can also configure your development builds to run on the iOS Simulator. To do this, use the following configuration for the development profile:

eas.json

Copy


{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    }
    ... 
  }
  ... 
}
Note: For iOS, to create a build for internal distribution and another for the iOS Simulator, you can create a separate development profile for that build. You can give the profile a custom name. For example, development-simulator, and use the iOS Simulator specific configuration on that profile instead of on development. No such configuration is required to run an Android .apk on a device and an Android Emulator as the same .apk will run with both environments.

Preview builds
These builds don't include developer tools. They are intended to be installed by your team and other stakeholders, to test out the app in production-like circumstances. In this way, they are similar to production builds. However, they are different from production builds because they are either not signed for distribution on app stores (ad hoc or enterprise provisioning on iOS), or are packaged in a way that is not optimal for store deployment (Android .apk is recommended for preview, .aab is recommended for Google Play Store).

A minimal preview profile example:

eas.json

Copy


{
  "build": {
    "preview": {
      "distribution": "internal"
    }
    ... 
  }
  ... 
}
Similar to development builds, you can configure a preview build to run on the iOS Simulator or create a variant of your preview profile for that purpose. No such configuration is required to run an Android .apk on a device and an Android Emulator as the same .apk will run with both environments.

Production builds
These builds are submitted to an app store, for release to the general public or as part of a store-facilitated testing process such as TestFlight.

Production builds must be installed through their respective app stores. They cannot be installed directly on your Android Emulator or device, or iOS Simulator or device. The only exception to this is if you explicitly set "buildType": "apk" for Android on your build profile. However, it is recommended to use .aab when submitting to stores, as this is the default configuration.

A minimal production profile example:

eas.json

Copy


{
  "build": {
    "production": {}
    ... 
  }
  ... 
}
Installing multiple builds of the same app on a single device
It's common to have development and production builds installed simultaneously on the same device. See Install app variants on the same device.

Configuring build tools
Every build depends either implicitly or explicitly on a specific set of versions of related tools that are needed to carry out the build process. These include but are not limited to: Node.js, npm, Yarn, Ruby, Bundler, CocoaPods, Fastlane, Xcode, and Android NDK.

Selecting build tool versions
Versions for the most common build tools can be set on build profiles with fields corresponding to the names of the tools. For example node:

eas.json

Copy


{
  "build": {
    "production": {
      "node": "18.18.0"
    }
    ... 
  }
  ... 
}
It's common to share build tool configurations between profiles. Use extends for that:

eas.json

Copy


{
  "build": {
    "production": {
      "node": "18.18.0"
    },
    "preview": {
      "extends": "production",
      "distribution": "internal"
    },
    "development": {
      "extends": "production",
      "developmentClient": true,
      "distribution": "internal"
    }
    ... 
  }
  ... 
}

Show More
Selecting resource class
A resource class is the virtual machine resources configuration (CPU cores, RAM size) EAS Build provides to your jobs. By default, the resource class is set to medium, which is usually sufficient for both small and bigger projects. However, if your project requires a more powerful CPU or bigger memory, or if you want your builds to finish faster, you can switch to large workers.

For more details on resources provided to each class, see android.resourceClass and ios.resourceClass properties. To run your build on a worker of a specific resource class, configure this property in your build profile:

eas.json

Copy


{
  "build": {
    "production": {
      "android": {
        "resourceClass": "medium"
      },
      "ios": {
        "resourceClass": "large"
      },
    }
    ... 
  }
  ... 
}
Note: Running jobs on a large worker requires a paid EAS plan.

Selecting a base image
The base image for the build job controls the default versions for a variety of dependencies, such as Node.js, Yarn, and CocoaPods. You can override them using the specific named fields as described in the previous section using resourceClass. However, the image includes specific versions of tools that can't be explicitly set any other way, such as the operating system version and Xcode version.

If you are building an app with Expo, EAS Build will pick the appropriate image to use with a reasonable set of dependencies for the SDK version that you are building for. Otherwise, it is recommended to see the list of available images on Build server infrastructure.

Examples
Schema
eas.json

Copy


{
  "cli": {
    "version": "SEMVER_RANGE",
    "requireCommit": boolean,
    "appVersionSource": string,
    "promptToConfigurePushNotifications": boolean,
  },
  "build": {
    "BUILD_PROFILE_NAME_1": {
      ...COMMON_OPTIONS,
      "android": {
        ...COMMON_OPTIONS,
        ...ANDROID_OPTIONS
      },
      "ios": {
        ...COMMON_OPTIONS,
        ...IOS_OPTIONS
      }
    },
    "BUILD_PROFILE_NAME_2": {},
	... 
  }
}

Show More
You can specify common properties both in the platform-specific configuration object or at the profile's root. The platform-specific options take precedence over globally-defined ones.

A managed project with several profiles
A bare project with several profiles
Environment variables
You can configure environment variables on your build profiles using the "env" field. These environment variables will be used to evaluate app.config.js locally when you run eas build, and they will also be set on the EAS Build builder.

eas.json

Copy


{
  "build": {
    "production": {
      "node": "16.13.0",
      "env": {
        "API_URL": "https://company.com/api"
      }
    },
    "preview": {
      "extends": "production",
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging.company.com/api"
      }
    }
    ... 
  }
  ... 
}

Show More
The Environment variables and secrets reference explains this topic in greater detail, and the Use EAS Update guide provides considerations when using this feature alongside expo-updates.


Internal distribution

Learn how EAS Build provides shareable URLs for your builds with your team for internal distribution.

Setting up an internal distribution build only takes a few minutes with EAS Build and provides a streamlined way to share your app with your team and other testers for feedback. It does this by providing a URL that allows them to install the app directly to their device. If you are not sure yet if you want to use this approach and want to learn about all of the options available for distributing your app internally, refer to the overview of distribution apps for review guide.

Using internal distribution
To configure a build profile for internal distribution, set "distribution": "internal" on it. When you set this configuration, it has the following effects on the build profile:

Android: The default behavior for the gradleCommand will change to generate an APK instead of an AAB. If you have specified a custom gradleCommand, then make sure that it produces an APK, or it won't be directly installable on an Android device. Additionally, EAS Build will generate a new Android keystore for signing the APK, or it will use an existing one if the package name is the same as your development build.
iOS: Builds using this profile will use either ad hoc or enterprise provisioning. When using ad hoc provisioning, EAS Build will generate a provisioning profile containing an allow-list of device UDIDs, and only those devices in the list at build time will be able to install it. You can add a device by running eas device:create and creating a new build.
By default, internal distribution build URLs are available to anybody with the URL, and each is identified by a 32 character UUID. If you would like to require sign-in to an authorized Expo account to access these builds, you can disable the Unauthenticated access to internal builds option in your project settings.
See the tutorial on Internal distribution with EAS Build below for more information on how to configure, create, and install a build:

Create and share internal distribution build
Complete step-by-step guide to setting up and sharing internal distribution builds with EAS Build.

Automation on CI (optional)
It's possible to run internal distribution builds non-interactively in CI using the --non-interactive flag. However, if you are using ad hoc provisioning on iOS you will not be able to add new devices to your provisioning profile when using this flag. After registering a device through eas device:create, you need to run eas build interactively and authenticate with Apple in order for EAS to add the device to your provisioning profile. Learn more about triggering builds from CI.

Managing devices
You can see any devices registered via eas device:create by running:

Terminal

Copy

eas device:list
Devices registered with Expo for ad hoc provisioning will appear on your Apple Developer Portal after they are used to generate a provisioning profile for a new internal build with EAS Build or to resign an existing build with eas build:resign.

Remove devices
If a device is no longer in use, it can be removed from this list by running:

Terminal

Copy

eas device:delete
This command will also prompt you to disable the device on the Apple Developer Portal. Disabled devices still count against Apple's limit of 100 devices for ad hoc distribution per app.

Rename devices
Devices added via the website URL/QR code will default to displaying their UDID when selecting them for an EAS Build. You can assign friendly names to your devices with the following command:

Terminal

Copy

eas device:rename


