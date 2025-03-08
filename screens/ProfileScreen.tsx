import React, { useCallback, useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner-native';
import AuthGuard from '../components/AuthGuard';

type RootStackParamList = {
  Login: undefined;
  Settings: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileContent = memo(() => {
  const navigation = useNavigation<NavigationProp>();
  const { preferences, error: prefsError, updatePreferences, loading } = usePreferences();
  const { user, signOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle errors with toast
  useEffect(() => {
    if (prefsError) {
      toast.error(prefsError);
    }
  }, [prefsError]);

  const handleTogglePreference = useCallback(async (key: 'notifications_enabled' | 'dark_mode_enabled') => {
    if (!preferences || isProcessing) return;
    
    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      toast.error('Request timed out. Please try again.');
    }, 5000);

    try {
      const result = await Promise.race([
        updatePreferences({
          [key]: !preferences[key],
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), 4000)
        )
      ]);
      
      const actionType = key.split('_')[0];
      const newState = !preferences[key];
      toast.success(`${actionType} ${newState ? 'enabled' : 'disabled'}`);
      clearTimeout(timeoutId);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to update ${key.split('_')[0]} preference`;
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [preferences, updatePreferences, isProcessing]);

  const handleLogout = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      toast.error('Logout timed out. Please try again.');
    }, 5000);

    try {
      await Promise.race([
        signOut(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timed out')), 4000)
        )
      ]);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      toast.success('Successfully logged out');
      clearTimeout(timeoutId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log out';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [navigation, signOut, isProcessing]);

  if (prefsError) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorText}>{prefsError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <Image
          source={{ 
            uri: user?.user_metadata?.avatar_url || 
                 `https://api.a0.dev/assets/image?text=${encodeURIComponent(user?.email?.charAt(0) || 'U')}&aspect=1:1&seed=${user?.id}` 
          }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>
          {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.settingsIconContainer}>
              <Feather name="bell" size={22} color="#333" />
            </View>
            <View>
              <Text style={styles.settingsItemTitle}>Push Notifications</Text>
              <Text style={styles.settingsItemSubtitle}>Get notified about important updates</Text>
            </View>
          </View>
          <Switch
            value={preferences?.notifications_enabled ?? false}
            onValueChange={() => handleTogglePreference('notifications_enabled')}
            trackColor={{ false: '#d1d1d1', true: '#0066cc' }}
            thumbColor="#ffffff"
            disabled={isProcessing || loading}
          />
        </View>
        
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <View style={styles.settingsIconContainer}>
              <Feather name="moon" size={22} color="#333" />
            </View>
            <View>
              <Text style={styles.settingsItemTitle}>Dark Mode</Text>
              <Text style={styles.settingsItemSubtitle}>Switch app appearance</Text>
            </View>
          </View>
          <Switch
            value={preferences?.dark_mode_enabled ?? false}
            onValueChange={() => handleTogglePreference('dark_mode_enabled')}
            trackColor={{ false: '#d1d1d1', true: '#0066cc' }}
            thumbColor="#ffffff"
            disabled={isProcessing || loading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, isProcessing && styles.disabledButton]}
        onPress={handleLogout}
        disabled={isProcessing}
      >
        <Feather name="log-out" size={22} color="#ff3b30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
});

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthGuard loadingMessage="Loading profile...">
        <ProfileContent />
      </AuthGuard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingsSection: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#ff3b30',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
