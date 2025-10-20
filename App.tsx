import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, LinkingOptions, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { RootStackParamList } from './types/navigation';
import { StyleSheet, TouchableOpacity, Platform, StatusBar, Animated, View } from 'react-native';
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
import { COLORS } from './constants/theme';
import { normalizeNotificationDeepLink, routeNotificationDeepLink, waitForNavigationReady, waitForBranchReady, isBranchLink } from './utils/notificationHelpers';

// Core screens - Always loaded for performance
import LoadingScreen from './screens/LoadingScreen';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import LoginPromptScreen from './screens/LoginPromptScreen';

// Performance-optimized screens with conditional loading
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import EmailConfirmationScreen from './screens/EmailConfirmationScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import SingleArticleViewer from './screens/SingleArticleViewer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Performance optimization: Memoized screen components
const MemoizedProfileScreen = React.memo(ProfileScreen);
const MemoizedSettingsScreen = React.memo(SettingsScreen);
const MemoizedLoginScreen = React.memo(LoginScreen);
const MemoizedRegisterScreen = React.memo(RegisterScreen);
const MemoizedEmailConfirmationScreen = React.memo(EmailConfirmationScreen);
const MemoizedResetPasswordScreen = React.memo(ResetPasswordScreen);
const MemoizedSingleArticleViewer = React.memo(SingleArticleViewer);

// Simple lazy-loading style transition
const getAuthScreenOptions = (): NativeStackNavigationOptions => {
  return {
    headerShown: false,
    animation: 'fade',
    animationDuration: 250,
    gestureEnabled: true,
  };
};

function MainTabs() {
  const homeScreenRef = React.useRef<{ scrollToTop: () => void }>(null);
  const { refreshNews } = useNews();

  const handleTabPress = (tabName: string, navigation: { navigate: (screen: string, params?: { screen: string }) => void; isFocused: () => boolean }) => {
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
        tabBarActiveTintColor: COLORS.PRIMARY,
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
        options={({ navigation }) => ({
          tabBarLabel: 'Home',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('HomeTab', navigation)}
            />
          )
        })}
      >
        {() => <HomeScreen ref={homeScreenRef} />}
      </Tab.Screen>
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
        options={{ tabBarLabel: 'Profile' }}
      >
        {() => <MemoizedProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function GuestTabs() {
  const homeScreenRef = React.useRef<{ scrollToTop: () => void }>(null);
  const { refreshNews } = useNews();
  const navigation = useNavigation<any>();

  const handleGuestTabPress = (tabName: string) => {
    console.log('Guest tab pressed:', tabName);

    if (tabName === 'HomeTab') {
      navigation.navigate('Guest', { screen: 'HomeTab' });
      if (navigation.isFocused()) {
        refreshNews()
          .then(() => {
            homeScreenRef.current?.scrollToTop();
          })
          .catch((error) => {
            console.error('Guest refresh failed:', error);
          });
      }
    } else if (tabName === 'DiscoverTab') {
      navigation.navigate('Guest', { screen: 'DiscoverTab' });
    } else if (tabName === 'LoginPrompt') {
      // Navigate to login with context about why login is needed
      navigation.navigate('Login', { 
        returnTo: 'Guest',
        context: 'bookmarks'
      });
    } else if (tabName === 'ProfilePrompt') {
      // Navigate to login with profile context
      navigation.navigate('Login', { 
        returnTo: 'Guest',
        context: 'profile'
      });
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
            case 'LoginPrompt':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'ProfilePrompt':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
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
        options={{
          tabBarLabel: 'Home',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleGuestTabPress('HomeTab')}
            />
          )
        }}
      >
        {() => <HomeScreen ref={homeScreenRef} />}
      </Tab.Screen>
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{ 
          tabBarLabel: 'Discover',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleGuestTabPress('DiscoverTab')}
            />
          )
        }}
      />
      <Tab.Screen
        name="LoginPrompt"
        options={{ 
          tabBarLabel: 'Saved',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleGuestTabPress('LoginPrompt')}
            />
          )
        }}
      >
        {() => <LoginPromptScreen context="bookmarks" />}
      </Tab.Screen>
      <Tab.Screen
        name="ProfilePrompt"
        options={{ 
          tabBarLabel: 'Profile',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleGuestTabPress('ProfilePrompt')}
            />
          )
        }}
      >
        {() => <LoginPromptScreen context="profile" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function RootStackNavigator() {
  const { isLoading, session } = useAuth();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [appMode, setAppMode] = useState<'guest' | 'auth' | 'authenticated'>('guest');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const prevAppModeRef = useRef<'guest' | 'auth' | 'authenticated'>('guest');

  useEffect(() => {
    // Mark as initialized after first auth check
    if (!isLoading) {
      setHasInitialized(true);
      
      // Determine new app mode based on session
      const newAppMode = session ? 'authenticated' : 'guest';
      
      // Only trigger transition if mode actually changed
      if (prevAppModeRef.current !== newAppMode && hasInitialized) {
        console.log(`RootStackNavigator: Transitioning from ${prevAppModeRef.current} to ${newAppMode}`);
        
        // Start smooth transition
        setIsTransitioning(true);
        
        // Fade in overlay
        Animated.timing(transitionOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Change app mode while overlay is visible
          setAppMode(newAppMode);
          prevAppModeRef.current = newAppMode;
          
          // Fade out overlay after brief delay
          setTimeout(() => {
            Animated.timing(transitionOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              setIsTransitioning(false);
            });
          }, 100);
        });
      } else {
        // Initial setup or no mode change
        setAppMode(newAppMode);
        prevAppModeRef.current = newAppMode;
      }
    }
  }, [isLoading, session, hasInitialized]);

  // Only show loading screen on initial load or if explicitly loading after init
  if (!hasInitialized || (hasInitialized && isLoading)) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
      {appMode === 'authenticated' ? (
        // Authenticated stack - Full access with memoized components
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="SingleArticleViewer" component={MemoizedSingleArticleViewer} />
          <Stack.Screen name="SavedArticlePager" component={ArticleDetailScreen} />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
          <Stack.Screen name="Profile" component={MemoizedProfileScreen} />
          <Stack.Screen name="Settings" component={MemoizedSettingsScreen} />
          <Stack.Screen name="Login" component={MemoizedLoginScreen} />
          <Stack.Screen name="Register" component={MemoizedRegisterScreen} />
          <Stack.Screen name="EmailConfirmation" component={MemoizedEmailConfirmationScreen} />
          <Stack.Screen name="ResetPassword" component={MemoizedResetPasswordScreen} />
        </>
      ) : appMode === 'guest' ? (
        // Guest stack - Browse with auth prompts and memoized components
        <>
          <Stack.Screen name="Guest" component={GuestTabs} />
          <Stack.Screen name="SingleArticleViewer" component={MemoizedSingleArticleViewer} />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen 
            name="Login" 
            component={MemoizedLoginScreen}
            options={getAuthScreenOptions()}
          />
          <Stack.Screen 
            name="Register" 
            component={MemoizedRegisterScreen}
            options={getAuthScreenOptions()}
          />
          <Stack.Screen 
            name="EmailConfirmation" 
            component={MemoizedEmailConfirmationScreen}
            options={getAuthScreenOptions()}
          />
          <Stack.Screen 
            name="ResetPassword" 
            component={MemoizedResetPasswordScreen}
            options={getAuthScreenOptions()}
          />
        </>
      ) : (
        // Auth stack - Login required mode with memoized components
        <>
          <Stack.Screen name="Login" component={MemoizedLoginScreen} />
          <Stack.Screen name="Register" component={MemoizedRegisterScreen} />
          <Stack.Screen name="EmailConfirmation" component={MemoizedEmailConfirmationScreen} />
          <Stack.Screen name="ResetPassword" component={MemoizedResetPasswordScreen} />
        </>
      )}
      </Stack.Navigator>

      {/* Smooth transition overlay to mask component remounting */}
      {isTransitioning && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: COLORS.WHITE,
              opacity: transitionOpacity,
              zIndex: 9999,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </>
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
  const { navigationRef } = useScreenTracking();
  const [notificationListener] = useState<Notifications.Subscription | null>(null);
  const [foregroundMessageUnsubscribe, setForegroundMessageUnsubscribe] = useState<(() => void) | null>(null);
  const [notificationOpenedAppUnsubscribe, setNotificationOpenedAppUnsubscribe] = useState<(() => void) | null>(null);
  const [pendingInitialNotification, setPendingInitialNotification] = useState<any | null>(null);

  useEffect(() => {
    const setupAppContentSpecifics = async () => {
      try {
        initializeAuth();

        // CRITICAL: Check for initial notification BEFORE rendering navigation
        // In development builds, add a small delay to avoid conflicts with Expo Dev Menu initialization
        // which can cause MainActivity recreation and double-initialization crashes
        // Evidence: Dev menu initialization can trigger activity recreation, causing "Only one instance" assertion failure
        const isDevelopment = __DEV__;
        const notificationCheckDelay = isDevelopment ? 1500 : 0; // 1.5s delay in dev, immediate in prod

        if (isDevelopment) {
          console.log('[AppContent] Development build detected - delaying initial notification check to avoid dev menu conflict');
        }

        setTimeout(async () => {
          try {
            const initialFcmNotification = await messaging().getInitialNotification();
            if (initialFcmNotification) {
              console.log('[AppContent] Initial FCM notification detected (storing for later processing):', initialFcmNotification);
              setPendingInitialNotification(initialFcmNotification);
            } else {
              console.log('[AppContent] No initial FCM notification found');
            }
          } catch (initialNotifError) {
            console.error('[AppContent] Error checking initial notification:', initialNotifError);
            // Non-fatal, continue app initialization
          }
        }, notificationCheckDelay);

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

        // Set up handler for when user taps notification while app is in background
        // Evidence: This is the critical missing piece for background notification taps (Firebase docs)
        const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
          console.log('[AppContent] Notification opened app from background:', remoteMessage);
          
          try {
            // Extract and normalize deep link from FCM message data
            const deepLink = normalizeNotificationDeepLink(remoteMessage.data);
            
            if (deepLink) {
              console.log('[AppContent] Processing deep link from background notification tap:', deepLink);
              
              // Wait for navigation to be ready before attempting navigation
              const navReady = await waitForNavigationReady(navigationRef, 3000);
              if (!navReady) {
                console.error('[AppContent] Navigation not ready after background notification tap');
                return;
              }

              // If it's a Branch link, wait for Branch SDK to be ready
              if (isBranchLink(deepLink)) {
                console.log('[AppContent] Branch link detected, waiting for Branch SDK readiness');
                const branchReady = await waitForBranchReady(5000);
                if (!branchReady) {
                  console.warn('[AppContent] Branch SDK not ready, attempting navigation anyway');
                }
              }

              // Route the deep link using centralized executor
              await routeNotificationDeepLink(deepLink);
            } else {
              console.log('[AppContent] No deep link found in background notification');
            }
          } catch (error) {
            console.error('[AppContent] Error handling notification opened from background:', error);
          }
        });

        setNotificationOpenedAppUnsubscribe(() => unsubscribeNotificationOpened);

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

      if (notificationOpenedAppUnsubscribe) {
        notificationOpenedAppUnsubscribe();
      }

      monitoringService.cleanup();
      deepLinkHandler.cleanupBranchListeners();
      // if (typeof authCleanup === 'function') authCleanup();
    };
  }, []);

  if (!isAppContentReady) {
    return <LoadingScreen />;
  }

  const linking: LinkingOptions<{}> = {
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
      }
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={async () => {
        console.log('[AppContent] NavigationContainer is ready. Initializing DeepLinkHandler.');
        try {
          const deepLinkHandler = DeepLinkHandler.getInstance();
          if (navigationRef?.current) {
            deepLinkHandler.setNavigationRef(navigationRef);
            await deepLinkHandler.initialize();
            console.log('[AppContent] DeepLinkHandler initialized via onReady.');

            // Handle cold-start notification taps (app was killed)
            // Evidence: Initial notification must be checked EARLY (before rendering) to prevent crashes
            // We now use the pending notification that was stored during setup
            try {
              // Use the pending initial notification that was captured early in setup
              if (pendingInitialNotification) {
                console.log('[AppContent] Processing pending FCM initial notification:', pendingInitialNotification);
                
                // Extract and normalize deep link from FCM message
                const deepLink = normalizeNotificationDeepLink(pendingInitialNotification.data);
                
                if (deepLink) {
                  console.log('[AppContent] Cold-start deep link found from FCM:', deepLink);

                  // Wait for navigation to be ready (adaptive wait, not fixed delay)
                  const navReady = await waitForNavigationReady(navigationRef, 5000);
                  if (!navReady) {
                    console.error('[AppContent] Navigation not ready after cold-start, cannot navigate');
                    return;
                  }

                  // If it's a Branch link, wait for Branch SDK
                  if (isBranchLink(deepLink)) {
                    console.log('[AppContent] Branch link detected in cold-start FCM notification');
                    const branchReady = await waitForBranchReady(5000);
                    if (!branchReady) {
                      console.warn('[AppContent] Branch SDK not ready within timeout, attempting navigation anyway');
                    }
                  }

                  // Route using centralized executor
                  const handled = await routeNotificationDeepLink(deepLink);
                  if (handled) {
                    console.log('[AppContent] Cold-start FCM notification deep link handled successfully');
                  } else {
                    console.warn('[AppContent] Cold-start FCM notification deep link routing returned false');
                  }
                } else {
                  console.log('[AppContent] FCM initial notification has no deep link');
                }
              } else {
                // Fallback: check Expo's last notification response (for Expo-scheduled notifications)
                console.log('[AppContent] No FCM initial notification, checking Expo last notification response');
                const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
                
                if (lastNotificationResponse) {
                  console.log('[AppContent] Expo last notification response detected:', lastNotificationResponse);
                  
                  const notificationData = lastNotificationResponse.notification.request.content.data;
                  const deepLink = normalizeNotificationDeepLink(notificationData);

                  if (deepLink) {
                    console.log('[AppContent] Cold-start deep link found from Expo notification:', deepLink);

                    // Wait for navigation readiness
                    const navReady = await waitForNavigationReady(navigationRef, 5000);
                    if (!navReady) {
                      console.error('[AppContent] Navigation not ready after Expo cold-start, cannot navigate');
                      return;
                    }

                    // If it's a Branch link, wait for Branch SDK
                    if (isBranchLink(deepLink)) {
                      console.log('[AppContent] Branch link detected in cold-start Expo notification');
                      const branchReady = await waitForBranchReady(5000);
                      if (!branchReady) {
                        console.warn('[AppContent] Branch SDK not ready, attempting navigation anyway');
                      }
                    }

                    // Route using centralized executor
                    const handled = await routeNotificationDeepLink(deepLink);
                    if (handled) {
                      console.log('[AppContent] Cold-start Expo notification deep link handled successfully');
                    } else {
                      console.warn('[AppContent] Cold-start Expo notification deep link routing returned false');
                    }
                  } else {
                    console.log('[AppContent] Expo notification response has no valid deep link');
                  }
                } else {
                  console.log('[AppContent] No cold-start notification found (normal app launch)');
                }
              }
            } catch (notificationError) {
              console.error('[AppContent] Error handling cold-start notification:', notificationError);
              // Non-fatal - app should continue to function normally
            }
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
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaProvider>
        <AuthProvider>
          <NewsProvider>
            <SavedArticlesProvider>
              <AdvertisementProvider>
                <RemoteConfigProvider>
                  <Toaster
                    richColors
                    duration={8000}
                  />
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
