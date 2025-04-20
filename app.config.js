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
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ajilkojilgokulravi.unniman',
    googleServicesFile: './ios/edushorts/GoogleService-Info.plist',
    associatedDomains: [
      'applinks:lh1wg.app.link',
      'applinks:lh1wg-alternate.app.link'
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
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "lh1wg.app.link"
          },
          {
            scheme: "https",
            host: "lh1wg-alternate.app.link"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      },
      {
        action: "VIEW",
        data: [
          {
            scheme: "edushort",
            host: "article",
            pathPattern: "/*"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    favicon: './assets/favicon for apk .png'
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "cfa91622-46a9-49aa-86c3-177c0a05d850"
    }
  },
  plugins: [
    '@react-native-google-signin/google-signin',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static'
        }
      }
    ],
    [
      'react-native-branch',
      {
        apiKey: 'key_live_mtk16153Ngoe3o4XBsd8iehnFDichSM4'
      }
    ]
  ]
};
