import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { toast } from 'sonner-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { profile, updateProfile, signOut, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    push: profile?.notification_preferences?.push ?? false,
  });

  const handleNotificationToggle = async (type: 'push') => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const newSettings = {
        ...notificationSettings,
        push: !notificationSettings.push,
      };

      await updateProfile({
        ...profile,
        notification_preferences: {
          push: newSettings.push,
        }
      });

      setNotificationSettings(newSettings);
      toast.success(`Push notifications ${newSettings.push ? 'enabled' : 'disabled'}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Delete user profile and data
              if (!user?.id) throw new Error('User not found');
              
              await Promise.all([
                // Delete saved articles
                supabase
                  .from('saved_articles')
                  .delete()
                  .eq('user_id', user.id),
                
                // Delete notifications
                supabase
                  .from('notifications')
                  .delete()
                  .eq('user_id', user.id),
                
                // Delete profile
                supabase
                  .from('profiles')
                  .delete()
                  .eq('id', user.id),
                
                // Delete user role
                supabase
                  .from('user_roles')
                  .delete()
                  .eq('user_id', user.id),
              ]);

              // Delete auth user
              await signOut();
              toast.success('Account successfully deleted');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to delete account';
              toast.error(message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notificationSettings.push}
              onValueChange={() => handleNotificationToggle('push')}
              disabled={isLoading}
              trackColor={{ false: '#767577', true: '#ff0000' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Feather name="log-out" size={20} color="#ff0000" />
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={isLoading}
          >
            <Feather name="trash-2" size={20} color="#ff3b30" />
            <Text style={[styles.buttonText, styles.deleteButtonText]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#ff0000',
    marginLeft: 12,
  },
  deleteButton: {
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#ff3b30',
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
