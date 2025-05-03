module.exports = {
  name: 'Edushorts',
  slug: 'edushorts',
  version: '1.0.0',
  orientation: 'portrait',
  schemes: ['edushorts', 'exp+edushorts'],
  icon: './assets/app-logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash icon.png', // Updated splash icon
    resizeMode: 'cover', // Changed from 'contain' to 'cover'
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ajilkojilgokulravi.unniman', // Updated bundle ID
    googleServicesFile: './ios/edushorts/GoogleService-Info.plist', // Added GoogleService-Info.plist path
    associatedDomains: ['applinks:edushorts.app'], // Keep associatedDomains for now
    entitlements: {
      "aps-environment": "development"
    }
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
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "edushortlinks.netlify.app",
            pathPattern: "/article/*"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      },
      {
        action: "VIEW",
        data: [
          {
            scheme: "edushorts",
            host: "article",
            pathPattern: "/*"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: './assets/favicon for apk .png' // Updated favicon again
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "cfa91622-46a9-49aa-86c3-177c0a05d850"
    }
  },
  developmentClient: {
    silentLaunch: false
  },
  owner: "edushorts",
  plugins: [
    '@react-native-google-signin/google-signin',
    'expo-secure-store',
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          infoPlist: {
            UIBackgroundModes: ["remote-notification"],
            FirebaseAppDelegateProxyEnabled: false
          }
        }
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ffffff'
      }
    ]
  ]
};
