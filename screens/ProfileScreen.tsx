import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  EditProfile: undefined;
  Bookmarks: undefined;
  ChangePassword: undefined;
  HelpSupport: undefined;
  AboutUs: undefined;
  PrivacyPolicy: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { mockUsers } from '../data/mockData';
import { toast } from 'sonner-native';

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState(mockUsers[0]); // Using first user as example
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigation.navigate('Login');
  };

  const renderSettingsItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string | undefined,
    rightElement: React.ReactNode,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIconContainer}>
          {icon}
        </View>
        <View style={styles.settingsTextContainer}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Feather name="edit-2" size={16} color="#0066cc" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://api.a0.dev/assets/image?text=profile%20picture&aspect=1:1&seed=42' }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.savedArticles.length}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.readingHistory.length}</Text>
              <Text style={styles.statLabel}>Read</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderSettingsItem(
            <Ionicons name="notifications-outline" size={22} color="#333" />,
            'Push Notifications',
            'Get notified about important news',
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d1d1', true: '#0066cc' }}
              thumbColor="#ffffff"
            />,
            () => {}
          )}
          
          {renderSettingsItem(
            <Ionicons name="moon-outline" size={22} color="#333" />,
            'Dark Mode',
            'Change app appearance',
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#d1d1d1', true: '#0066cc' }}
              thumbColor="#ffffff"
            />,
            () => {}
          )}
          
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderSettingsItem(
            <Ionicons name="bookmark-outline" size={22} color="#333" />,
            'Saved Articles',
            'View your bookmarks',
            <Feather name="chevron-right" size={20} color="#888" />,
            () => navigation.navigate('Bookmarks')
          )}
          
          {renderSettingsItem(
            <Ionicons name="lock-closed-outline" size={22} color="#333" />,
            'Change Password',
            'Update your security credentials',
            <Feather name="chevron-right" size={20} color="#888" />,
            () => navigation.navigate('ChangePassword')
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderSettingsItem(
            <Ionicons name="help-circle-outline" size={22} color="#333" />,
            'Help & Support',
            'Get assistance and find answers',
            <Feather name="chevron-right" size={20} color="#888" />,
            () => navigation.navigate('HelpSupport')
          )}
          
          {renderSettingsItem(
            <Ionicons name="information-circle-outline" size={22} color="#333" />,
            'About Us',
            'Learn more about Edushorts',
            <Feather name="chevron-right" size={20} color="#888" />,
            () => navigation.navigate('AboutUs')
          )}
          
          {renderSettingsItem(
            <Ionicons name="shield-checkmark-outline" size={22} color="#333" />,
            'Privacy Policy',
            'Review our privacy terms',
            <Feather name="chevron-right" size={20} color="#888" />,
            () => navigation.navigate('PrivacyPolicy')
          )}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
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
  statsContainer: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statSeparator: {
    width: 1,
    height: '80%',
    backgroundColor: '#eeeeee',
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
  settingsTextContainer: {
    flex: 1,
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
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  }
});
