import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useUserStats } from '../hooks/useUserStats';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const { savedArticlesCount, isLoading: statsLoading, error } = useUserStats();

  const handleExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error("Couldn't open URL", err);
    });
  };

  if (!profile || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: profile.avatar_url ||
                `https://api.dicebear.com/7.x/initials/png?seed=${profile.username}`
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {statsLoading ? (
            <ActivityIndicator color="#ff0000" style={styles.statsLoader} />
          ) : (
            <>
              <View style={styles.stat}>
                <Feather name="bookmark" size={20} color="#666" />
                <Text style={styles.statText}>Saved Articles</Text>
                <Text style={styles.statCount}>{savedArticlesCount}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Bookmarks')}
              >
                <Text style={styles.viewAllText}>View Saved Articles</Text>
                <Feather name="chevron-right" size={20} color="#ff0000" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => handleExternalLink('https://edushorts-website.vercel.app/#about')}
          >
            <Feather name="info" size={20} color="#666" />
            <Text style={styles.supportButtonText}>About Us</Text>
            <Feather name="external-link" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => handleExternalLink('https://edushorts-website.vercel.app/#contact')}
          >
            <Feather name="mail" size={20} color="#666" />
            <Text style={styles.supportButtonText}>Contact Us</Text>
            <Feather name="external-link" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => handleExternalLink('https://edushorts-website.vercel.app/privacy-policy.html')}
          >
            <Feather name="shield" size={20} color="#666" />
            <Text style={styles.supportButtonText}>Privacy Policy</Text>
            <Feather name="external-link" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => handleExternalLink('https://edushorts-website.vercel.app/terms-conditions.html')}
          >
            <Feather name="file-text" size={20} color="#666" />
            <Text style={styles.supportButtonText}>Terms & Conditions</Text>
            <Feather name="external-link" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Feather name="settings" size={20} color="#666" />
            <Text style={styles.settingsButtonText}>Settings</Text>
            <Feather name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
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
  statsLoader: {
    marginVertical: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  statCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#ff0000',
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  supportButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
});
