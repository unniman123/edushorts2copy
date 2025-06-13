import React, { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getApp } from '@react-native-firebase/app';
import messaging, { getMessaging } from '@react-native-firebase/messaging';
import { RootStackParamList } from './types/navigation';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { useNews } from './context/NewsContext';
import { SavedArticlesProvider } from './context/SavedArticlesContext';
import { NewsProvider } from './context/NewsContext';
import { AdvertisementProvider } from './context/AdvertisementContext';
import { initializeAuth } from './utils/authHelpers';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { MonitoringService, DeepLinkHandler } from './services';
import { useScreenTracking } from './hooks/useAnalytics';
import { remoteConfigService } from './services/RemoteConfigService';
import { RemoteConfigProvider } from './context/RemoteConfigContext';
import branch from 'react-native-branch';
import { analyticsService } from './services/AnalyticsService';
import NotificationService from './services/NotificationService';
import PerformanceMonitoringService from './services/PerformanceMonitoringService';
import { NativeModules } from 'react-native';

import LoadingScreen from './screens/LoadingScreen';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import SingleArticleViewer from './screens/SingleArticleViewer';
import BookmarksScreen from './screens/BookmarksScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import SettingsScreen from './screens/SettingsScreen';
import EmailConfirmationScreen from './screens/EmailConfirmationScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const homeScreenRef = React.useRef<{scrollToTop: () => void}>(null);
  const { refreshNews } = useNews();

  const handleTabPress = (tabName: string, navigation: any) => {
    console.log('(NOBRIDGE) LOG  Tab pressed:', tabName);
    
    if (tabName === 'HomeTab') {
      // Always navigate to HomeTab first
      console.log('(NOBRIDGE) LOG  Navigating to HomeTab');
      navigation.navigate('Main', { screen: 'HomeTab' });
      
      // If already on HomeTab, also refresh and scroll
      if (navigation.isFocused()) {
        console.log('(NOBRIDGE) LOG  Already on HomeTab - refreshing');
        refreshNews()
          .then(() => {
            console.log('(NOBRIDGE) LOG  Refresh completed successfully');
            homeScreenRef.current?.scrollToTop();
          })
          .catch((error) => {
            console.error('(NOBRIDGE) ERROR  Refresh failed:', error);
          });
      }
    } else {
      // Handle other tab presses normally
      navigation.navigate('Main', { screen: tabName });
    }
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: typeof Ionicons.defaultProps.name;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'DiscoverTab':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'BookmarksTab':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff0000',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eeeeee',
          elevation: 0,
        },
      })}
    >
        <Tab.Screen
        name="HomeTab"
        children={() => <HomeScreen ref={homeScreenRef} />}
        options={({ navigation }) => ({ 
          tabBarLabel: 'Home',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('HomeTab', navigation)}
            />
          )
        })}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen
        name="BookmarksTab"
        component={BookmarksScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function RootStackNavigator() {
  const { isLoading, session } = useAuth();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized after first auth check
    if (!isLoading) {
      setHasInitialized(true);
    }
  }, [isLoading]);

  // Only show loading screen on initial load or if explicitly loading after init
  if (!hasInitialized || (hasInitialized && isLoading)) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {session ? (
        // Authenticated stack
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="SingleArticleViewer" component={SingleArticleViewer} />
          <Stack.Screen name="SavedArticlePager" component={ArticleDetailScreen} />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        // Auth stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Configure Google Sign-In (Call this early, outside component if possible, or in a top-level effect)
GoogleSignin.configure({
  // webClientId: 'YOUR_WEB_CLIENT_ID_HERE', // From Google Cloud Console
  webClientId: '966598634176-30i8rechrbp3jidt3gvlc8si2srsi5f0.apps.googleusercontent.com', // Updated Web Client ID
  // offlineAccess: true, // Keep offlineAccess if needed for server-side access, otherwise remove or set to false
  // Ensure scopes are configured if needed, e.g., scopes: ['email', 'profile']
});

function AppContent() {
  const [isAppContentReady, setIsAppContentReady] = useState(false);
  const navigationRef = useScreenTracking();
  const [notificationListener, setNotificationListener] = useState<Notifications.Subscription | null>(null);
  const [foregroundMessageUnsubscribe, setForegroundMessageUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    const setupAppContentSpecifics = async () => {
      try {
        const authCleanup = initializeAuth();

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Fix: Use global messaging() for background handler, not a specific instance
        messaging().setBackgroundMessageHandler(async remoteMessage => {
          console.log('Message handled in the background!', remoteMessage);
          
          const branchLink = remoteMessage.data?.branch_link || remoteMessage.data?.deep_link;
          if (branchLink && typeof branchLink === 'string') {
            try {
              console.log('FCM message contains Branch link:', branchLink);
            } catch (error) {
              console.error('Error processing Branch link from FCM:', error);
            }
          }
          
          try {
            if (remoteMessage.notification) {
              console.log('Received notification-type FCM message, letting FCM handle it natively');
              return;
            }
            // Background messages handled natively by FCM, no custom processing needed
            console.log('FCM background message received and handled natively');
          } catch (processError) {
            console.error('Error processing FCM notification:', processError);
          }
        });

        // Also set up foreground message handler for when app is active
        const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
          console.log('Message handled in the foreground!', remoteMessage);
          
          try {
            // For foreground messages, we need to display them manually using expo-notifications
            // since FCM won't show them when app is active
            if (remoteMessage.notification) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: remoteMessage.notification.title || 'Notification',
                  body: remoteMessage.notification.body || '',
                  data: {
                    ...remoteMessage.data,
                    // Ensure deep link data is preserved for navigation
                    deep_link: remoteMessage.data?.deep_link || remoteMessage.data?.branch_link || remoteMessage.data?.url
                  },
                  sound: 'default',
                },
                trigger: null, // Display immediately
              });
              console.log('FCM foreground message displayed via expo-notifications');
            }
          } catch (processError) {
            console.error('Error processing foreground FCM notification:', processError);
          }
        });

        // Store the unsubscribe function for cleanup
        setForegroundMessageUnsubscribe(() => unsubscribeOnMessage);

        try {
          const monitoringService = MonitoringService.getInstance();
          await monitoringService.initialize();
        } catch (monitoringError) {
          console.error('Error initializing monitoring service:', monitoringError);
        }

        setIsAppContentReady(true);
      } catch (error) {
        console.error('Error initializing AppContent specifics:', error);
        setIsAppContentReady(true); 
      }
    };

    setupAppContentSpecifics();

    return () => {
      const monitoringService = MonitoringService.getInstance();
      const deepLinkHandler = DeepLinkHandler.getInstance();
      
      if (notificationListener) {
        notificationListener.remove();
      }
      
      if (foregroundMessageUnsubscribe) {
        foregroundMessageUnsubscribe();
      }
      
      monitoringService.cleanup();
      deepLinkHandler.cleanupBranchListeners();
      // if (typeof authCleanup === 'function') authCleanup();
    };
  }, []);

  if (!isAppContentReady) {
    return <LoadingScreen />; 
  }

  const linking: LinkingOptions<any> = {
    prefixes: ['edushorts://', 'https://xbwk1.app.link', 'https://xbwk1-alternate.app.link', 'exp://localhost:19000'],
    config: {
      screens: {
        Settings: 'settings/delete-account',
        Login: {
          path: 'login',
          parse: {
            emailConfirmed: (emailConfirmed: string) => emailConfirmed === 'true',
            pendingConfirmation: (pendingConfirmation: string) => pendingConfirmation === 'true'
          }
        },
        Register: 'register',
        EmailConfirmation: {
          path: 'auth/confirm',
          parse: {
            token: (token: string) => token
          }
        },
        ResetPassword: {
          path: 'auth/reset-password',
          parse: {
            token: (token: string) => token
          }
        },
        Main: 'main',
        SingleArticleViewer: {
          path: 'article/:articleId',
          parse: {
            articleId: (articleId: string) => articleId
          }
        }
      },
      initialRouteName: 'Login'
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        console.log('[AppContent] NavigationContainer is ready. Initializing DeepLinkHandler.');
        try {
          const deepLinkHandler = DeepLinkHandler.getInstance();
          if (navigationRef?.current) {
            deepLinkHandler.setNavigationRef(navigationRef);
            deepLinkHandler.initialize(); 
            console.log('[AppContent] DeepLinkHandler initialized via onReady.');
          } else {
            console.error('[AppContent] Navigation reference (navigationRef.current) is unexpectedly null in onReady.');
          }
        } catch (deepLinkError) {
          console.error('[AppContent] Error initializing DeepLinkHandler in onReady:', deepLinkError);
        }
      }}
    >
      <NotificationProvider navigation={navigationRef}>
        <RootStackNavigator />
      </NotificationProvider>
    </NavigationContainer>
  );
}

export default function App() {
  const [coreServicesInitialized, setCoreServicesInitialized] = useState(false);

  useEffect(() => {
    const initializeCoreServices = async () => {
      try {
        // Initialize Firebase services ONCE here
        const firebaseAppInstance = getApp(); // Ensure Firebase app is initialized if not already done globally
        
        await analyticsService.initialize(firebaseAppInstance);
        console.log('[App] AnalyticsService initialized.');

        await remoteConfigService.initialize(firebaseAppInstance);
        console.log('[App] RemoteConfigService initialized.');

        const notificationService = NotificationService.getInstance();
        await notificationService.initialize(firebaseAppInstance);
        console.log('[App] NotificationService initialized.');
        
        const performanceMonitoringService = PerformanceMonitoringService.getInstance();
        await performanceMonitoringService.initialize(firebaseAppInstance);
        console.log('[App] PerformanceMonitoringService initialized.');
        
        // Check for Branch native module availability. Actual SDK initialization is handled by DeepLinkHandler.
        if (Platform.OS !== 'web' && NativeModules.RNBranch) {
          console.log('[App] Branch native module (RNBranch) found. Branch SDK initialization is handled by DeepLinkHandler.');
          // The imported 'branch' module from 'react-native-branch' might not directly expose 'init'.
          // We rely on DeepLinkHandler to use the correct Branch SDK methods.
        } else {
          console.log('[App] Branch native module (RNBranch) not found or not on a supported platform. Branch SDK may not function.');
        }

      } catch (error) {
        console.error('Error initializing core services in App:', error);
      } finally {
        setCoreServicesInitialized(true);
      }
    };

    initializeCoreServices();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={styles.container}>
        <AuthProvider>
          <NewsProvider>
            <SavedArticlesProvider>
              <AdvertisementProvider>
                <RemoteConfigProvider>
                  <Toaster richColors />
                  {coreServicesInitialized ? (
                    <AppContent />
                  ) : (
                    <LoadingScreen /> // This LoadingScreen is now within AuthProvider scope
                  )}
                </RemoteConfigProvider>
              </AdvertisementProvider>
            </SavedArticlesProvider>
          </NewsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
