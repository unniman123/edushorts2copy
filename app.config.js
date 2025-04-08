module.exports = {
  name: 'Edushorts',
  slug: 'edushorts',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'edushort', // Updated scheme
  icon: './assets/app-logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
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
    associatedDomains: ['applinks:edushorts.app'] // Keep associatedDomains for now
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/app-logo.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.ajilkojilgokulravi.unniman', // Updated package name
    googleServicesFile: './android/app/google-services.json', // Added google-services.json path
    intentFilters: [
      {
        action: "VIEW",
        data: [
          {
            scheme: "edushort", // Updated scheme in intent filter
            host: "*",
            pathPrefix: "/auth"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      },
      {
        action: "VIEW",
        data: [
          {
            scheme: "https",
            host: "edushortlinks.netlify.app",
            pathPrefix: "/article"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: './assets/app-logo.png'
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "cfa91622-46a9-49aa-86c3-177c0a05d850"
    }
  },
  plugins: [
    '@react-native-google-signin/google-signin', // Added Google Sign-In plugin
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static'
        }
      }
    ]
  ]
};
