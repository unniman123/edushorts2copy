import * as React from 'react';
import { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import linking from './utils/linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from './types/navigation';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useNews } from './context/NewsContext';
import { SavedArticlesProvider } from './context/SavedArticlesContext';
import { NewsProvider } from './context/NewsContext';
import { initializeAuth } from './utils/authHelpers';
import * as Linking from 'expo-linking';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // <-- Add import

import LoadingScreen from './screens/LoadingScreen';
import HomeScreen from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
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
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
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
  const [isReady, setIsReady] = useState(false);
  const { session } = useAuth();
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);

  const navigate = (name: keyof RootStackParamList, params?: any) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  };

  useEffect(() => {
    // Initialize auth and mark as ready
    const cleanup = initializeAuth();
    setIsReady(true);

    return cleanup;
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }


  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStackNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={styles.container}>
        <AuthProvider>
          <NewsProvider>
            <SavedArticlesProvider>
              <Toaster />
              <AppContent />
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
