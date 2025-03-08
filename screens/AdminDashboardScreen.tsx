import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Article } from '../lib/dataAdapter';
import { mockNewsData } from '../data/mockData';
import { supabase } from '../lib/supabaseClient';
import { adaptArticles, isMockMode } from '../lib/dataAdapter';
import { toast } from 'sonner-native';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  last_login: string;
}

type RootStackParamList = {
  Profile: undefined;
  CreateArticle: undefined;
  EditArticle: { articleId: string };
};

import NotificationComposer from '../components/NotificationComposer';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [articles, setArticles] = useState<Article[]>(isMockMode() ? mockNewsData : []);
  const [loading, setLoading] = useState(!isMockMode());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalViews: 0
  });

  useEffect(() => {
    if (!isMockMode()) {
      fetchArticles();
      fetchStats();
    } else {
      setStats({
        totalUsers: 230,
        totalArticles: mockNewsData.length,
        totalViews: 12543
      });
    }
  }, []);

  const fetchArticles = async () => {
    try {
      const { data: articles, error } = await supabase
        .from('articles')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setArticles(adaptArticles(articles || []));
    } catch (error) {
      toast.error('Error fetching articles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersCount, articlesCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('articles').select('*', { count: 'exact' })
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalArticles: articlesCount.count || 0,
        totalViews: 12543 // This would come from analytics in a real app
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <MaterialIcons name="people" size={24} color="#0066cc" />,
      color: '#e3f2fd',
    },
    {
      title: 'Articles',
      value: stats.totalArticles,
      icon: <MaterialIcons name="article" size={24} color="#4caf50" />,
      color: '#e8f5e9',
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: <MaterialIcons name="visibility" size={24} color="#ff9800" />,
      color: '#fff3e0',
    },
  ];

  const filterArticles = () => {
    if (searchQuery.trim() === '') {
      return articles;
    }
    
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const deleteArticle = async (id: string) => {
    try {
      if (isMockMode()) {
        setArticles(articles.filter(article => article.id !== id));
        toast.success('Article deleted successfully');
        return;
      }

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Article deleted successfully');
      fetchArticles(); // Refresh the list
    } catch (error) {
      toast.error('Error deleting article');
      console.error(error);
    }
  };

  const renderArticlesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.listHeader}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateArticle')}
        >
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.addButtonText}>New Article</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filterArticles()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.articleItem}>
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.articleMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.articleDate}>{item.timeAgo}</Text>
              </View>
            </View>
            <View style={styles.articleActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EditArticle', { articleId: item.id })}
              >
                <Feather name="edit-2" size={16} color="#0066cc" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteArticle(item.id)}
              >
                <Feather name="trash-2" size={16} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.articlesList}
      />
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
            <View style={styles.statIconContainer}>
              {stat.icon}
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="account-plus" size={18} color="#4caf50" />
            <Text style={styles.activityText}>
              <Text style={styles.activityHighlight}>12 new users</Text> registered today
            </Text>
            <Text style={styles.activityTime}>2h ago</Text>
          </View>
          
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="file-document-edit" size={18} color="#0066cc" />
            <Text style={styles.activityText}>
              <Text style={styles.activityHighlight}>New article</Text> about scholarships published
            </Text>
            <Text style={styles.activityTime}>5h ago</Text>
          </View>
          
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="alert" size={18} color="#ff9800" />
            <Text style={styles.activityText}>
              <Text style={styles.activityHighlight}>System update</Text> scheduled for tomorrow
            </Text>
            <Text style={styles.activityTime}>1d ago</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
        </View>
        
        <View style={styles.categoryStats}>
          <View style={styles.categoryItem}>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryProgress, { width: '80%', backgroundColor: '#0066cc' }]} />
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>Scholarships</Text>
              <Text style={styles.categoryValue}>80%</Text>
            </View>
          </View>
          
          <View style={styles.categoryItem}>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryProgress, { width: '65%', backgroundColor: '#4caf50' }]} />
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>Visas</Text>
              <Text style={styles.categoryValue}>65%</Text>
            </View>
          </View>
          
          <View style={styles.categoryItem}>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryProgress, { width: '45%', backgroundColor: '#ff9800' }]} />
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>Immigration</Text>
              <Text style={styles.categoryValue}>45%</Text>
            </View>
          </View>
          
          <View style={styles.categoryItem}>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryProgress, { width: '30%', backgroundColor: '#9c27b0' }]} />
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>Education</Text>
              <Text style={styles.categoryValue}>30%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabContentText}>Settings functionality coming soon</Text>
    </View>
  );

  const renderNotificationsTab = () => (
    <View style={styles.tabContent}>
      <NotificationComposer />
    </View>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Active Users</Text>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.subtitle}>Total registered users in the system</Text>
          </View>
          
          {/* User list will be implemented in a future update */}
          <EmptyState
            icon="users"
            title="User Management"
            subtitle="This feature will be available in the next update"
          />
        </ScrollView>
      )}
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'analytics':
        return renderAnalyticsTab();
      case 'articles':
        return renderArticlesTab();
      case 'users':
        return renderUsersTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderAnalyticsTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Feather name="user" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'analytics' && styles.activeTabItem]}
            onPress={() => setActiveTab('analytics')}
          >
            <MaterialIcons name="analytics" size={24} color={activeTab === 'analytics' ? '#0066cc' : '#888'} />
            <Text style={[styles.tabLabel, activeTab === 'analytics' && styles.activeTabLabel]}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'articles' && styles.activeTabItem]}
            onPress={() => setActiveTab('articles')}
          >
            <MaterialIcons name="article" size={24} color={activeTab === 'articles' ? '#0066cc' : '#888'} />
            <Text style={[styles.tabLabel, activeTab === 'articles' && styles.activeTabLabel]}>Articles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'users' && styles.activeTabItem]}
            onPress={() => setActiveTab('users')}
          >
            <MaterialIcons name="people" size={24} color={activeTab === 'users' ? '#0066cc' : '#888'} />
            <Text style={[styles.tabLabel, activeTab === 'users' && styles.activeTabLabel]}>Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'notifications' && styles.activeTabItem]}
            onPress={() => setActiveTab('notifications')}
          >
            <MaterialIcons name="notifications" size={24} color={activeTab === 'notifications' ? '#0066cc' : '#888'} />
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.activeTabItem]}
            onPress={() => setActiveTab('settings')}
          >
            <MaterialIcons name="settings" size={24} color={activeTab === 'settings' ? '#0066cc' : '#888'} />
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.activeTabLabel]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {renderActiveTab()}
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  activityHighlight: {
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: 12,
    color: '#888',
  },
  categoryStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryProgress: {
    height: '100%',
    borderRadius: 4,
  },
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContent: {
    flex: 1,
  },
  tabContentText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  articlesList: {
    paddingBottom: 16,
  },
  articleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  articleInfo: {
    flex: 1,
    marginRight: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  articleDate: {
    fontSize: 12,
    color: '#888',
  },
  articleActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});
