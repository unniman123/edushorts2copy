import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { Toaster } from 'sonner-native';

import HomeScreen, { RootStackParamList } from './screens/HomeScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';

enableScreens();

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => (
  <AuthGuard>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#eeeeee' },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <View>
              <Text style={{ color, fontSize: 12 }}>Home</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <View>
              <Text style={{ color, fontSize: 12 }}>Discover</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Bookmarks" 
        component={BookmarksScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <View>
              <Text style={{ color, fontSize: 12 }}>Saved</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <View>
              <Text style={{ color, fontSize: 12 }}>Profile</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  </AuthGuard>
);

const AdminDashboardWrapper = () => (
  <AuthGuard requiredRole="admin">
    <AdminDashboardScreen />
  </AuthGuard>
);

import { ErrorBoundary } from './components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <SafeAreaProvider>
          <Toaster />
          <NavigationContainer>
            <Stack.Navigator 
              screenOptions={{ headerShown: false }}
              initialRouteName="Login"
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen
                name="ArticleDetail"
                component={ArticleDetailScreen}
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
              />
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboardWrapper}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
