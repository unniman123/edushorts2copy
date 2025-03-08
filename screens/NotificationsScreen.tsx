import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import NotificationItem from '../components/NotificationItem';
import EmptyState from '../components/EmptyState';
import AuthGuard from '../components/AuthGuard';
import { NotificationService } from '../lib/notificationService';
import { toast } from 'sonner-native';
import { useAuth } from '../context/AuthContext';
import { DBNotification } from '../types/notifications';

const NotificationsContent = () => {
  const [notifications, setNotifications] = React.useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { user } = useAuth();

  // Fetch notifications with error handling and timeout
  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 5000)
      );

      const fetchPromise = NotificationService.getNotifications();
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as {
        notifications: DBNotification[];
        unreadCount: number;
      };
      
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('Error fetching notifications:', message);
      setError(message);
      toast.error(message);
      
      // Auto-retry after 3 seconds if it was a timeout
      if (message.includes('timed out')) {
        setTimeout(() => fetchNotifications(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle refresh with timeout
  const handleRefresh = useCallback(async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast.error('Refresh timed out. Please try again.');
    }, 5000);

    try {
      await Promise.race([
        fetchNotifications(false),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Refresh timed out')), 4000)
        )
      ]);
      clearTimeout(timeoutId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh';
      toast.error(message);
    }
  }, [fetchNotifications]);

  // Handle marking notification as read with timeout
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    const timeoutId = setTimeout(() => {
      toast.error('Operation timed out. Please try again.');
    }, 5000);

    try {
      await Promise.race([
        NotificationService.markAsRead(notificationId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), 4000)
        )
      ]);
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      clearTimeout(timeoutId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark as read';
      toast.error(message);
    }
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((newNotification: DBNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    toast.info('New notification received');
  }, []);

  // Initial fetch and subscription setup with cleanup
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;

    const initializeNotifications = async () => {
      try {
        await fetchNotifications();
        if (isSubscribed) {
          unsubscribe = NotificationService.subscribeToNotifications(
            user.id,
            handleNewNotification
          );
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
      setNotifications([]);
      setUnreadCount(0);
    };
  }, [user, fetchNotifications, handleNewNotification]);

  // Reset loading state if no user
  useEffect(() => {
    if (!user) {
      setLoading(false);
    }
  }, [user]);

  // Error handling
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorTitle}>Unable to load notifications</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchNotifications(true)}
          disabled={loading}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && !notifications.length) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="notifications-off"
          title="No Notifications"
          message="You're all caught up! New notifications will appear here."
        />
      </View>
    );
  }

  return (
    <>
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleMarkAsRead(item.id)}
            onMarkAsRead={() => handleMarkAsRead(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </>
  );
};

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthGuard loadingMessage="Loading notifications...">
        <NotificationsContent />
      </AuthGuard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  unreadBanner: {
    backgroundColor: '#007AFF',
    padding: 10,
    alignItems: 'center'
  },
  unreadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});
