/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Edushorts',
  slug: 'edushorts',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'edushort',
  icon: './assets/app-logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash icon.png',
    resizeMode: 'cover',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ajilkojilgokulravi.unniman',
    googleServicesFile: './ios/edushorts/GoogleService-Info.plist',
    associatedDomains: [
      'applinks:edushorts.app'
    ]
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/splash icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.ajilkojilgokulravi.unniman',
    googleServicesFile: './android/app/google-services.json',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'edushorts.app',
            pathPrefix: '/'
          }
        ],
        category: ['BROWSABLE', 'DEFAULT']
      }
    ]
  },
  plugins: [
    '@react-native-google-signin/google-signin',
    'expo-secure-store',
    ['expo-build-properties', {
      android: {
        compileSdkVersion: 33,
        targetSdkVersion: 33,
        buildToolsVersion: "33.0.0",
        kotlinVersion: "1.8.0",
        enableProguardInReleaseBuilds: true,
      },
      ios: {
        useFrameworks: 'static'
      }
    }]
  ],
  extra: {
    eas: {
      projectId: "cfa91622-46a9-49aa-86c3-177c0a05d850"
    }
  }
};
