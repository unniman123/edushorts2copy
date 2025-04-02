          module.exports = {
  name: 'Edushorts',
  slug: 'edushorts',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'edushorts',
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
    bundleIdentifier: 'com.reviveandfight.edushorts',
    associatedDomains: ['applinks:edushorts.app']
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/app-logo.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.reviveandfight.edushorts',
    // googleServicesFile: './android/app/google-services.json', // Revert to using EAS Secret
    intentFilters: [
      {
        action: "VIEW",
        data: [
          {
            scheme: "edushorts",
            host: "*",
            pathPrefix: "/auth"
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
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    // Added the EAS Project ID manually
    eas: {
      projectId: "d0ee7c53-a824-430b-af72-69e4f937a1ea"
    }
  },
  plugins: [
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
