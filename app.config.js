module.exports = ({ config }) => {
  console.log("[DEBUG] EXPO_PUBLIC_SUPABASE_URL in app.config.js:", process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log("[DEBUG] EXPO_PUBLIC_SUPABASE_ANON_KEY in app.config.js:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  console.log("[DEBUG] SUPABASE_URL in app.config.js:", process.env.SUPABASE_URL);
  return {
    ...config,
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
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.ajilkojilgokulravi.unniman', // Updated bundle ID
      googleServicesFile: './ios/edushorts/GoogleService-Info.plist', // Added GoogleService-Info.plist path
      buildNumber: '1', // Adding explicit build number
      infoPlist: {
        // Branch iOS SDK configuration
        branch_key: '${BRANCH_KEY}',
        branch_universal_link_domains: ['xbwk1.app.link', 'xbwk1-alternate.app.link'],
        // Allow privacy-sensitive permissions
        UIBackgroundModes: ['fetch', 'remote-notification'],
        NSUserTrackingUsageDescription: "This allows Edushorts to provide you with a personalized experience and relevant content.",
        // Add LSApplicationQueriesSchemes for common social apps (for Branch sharing)
        LSApplicationQueriesSchemes: [
          "whatsapp", "fb", "facebook-stories", "fb-messenger", 
          "instagram", "instagram-stories", "twitter", "linkedin", 
          "pinterest", "snapchat", "com.google.android.apps.messaging"
        ]
      },
      associatedDomains: [
        'applinks:xbwk1.app.link',
        'applinks:xbwk1-alternate.app.link'
      ], // Updated for Branch.io
      entitlements: {
        "aps-environment": "production",
        "com.apple.developer.associated-domains": [
          "applinks:xbwk1.app.link",
          "applinks:xbwk1-alternate.app.link"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/splash icon.png',
        backgroundColor: '#FFFFFF'
      },
      package: 'com.ajilkojilgokulravi.unniman',
      googleServicesFile: './android/app/google-services.json',
      buildProperties: {
        appBuildGradle: {
          implementation: [
            'io.branch.sdk.android:library:6.4.0'
          ]
        }
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "xbwk1.app.link"
            },
            {
              scheme: "https",
              host: "xbwk1-alternate.app.link"
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
      },
      owner: "unniman"
    },
    developmentClient: {
      silentLaunch: false
    },
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
          icon: './assets/app-logo.png',
          color: '#ffffff',
          androidMode: 'default',
          androidCollapsedTitle: 'Edushorts'
        }
      ],
      [
        "@config-plugins/react-native-branch",
        {
          apiKey: "key_live_lsvfoHjZGCGcuEseqCIYAompzweTIc13",
          iosAppDomain: "xbwk1.app.link"
        }
      ]
    ]
  };
};
