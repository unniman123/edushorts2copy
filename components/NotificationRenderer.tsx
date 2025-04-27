import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  deep_link?: string;
  read: boolean;
  type: 'push' | 'web' | 'scheduled' | 'article_link';
  data?: Record<string, unknown>;
}

interface NotificationGroupProps {
  date: string;
  notifications: NotificationData[];
  onPress: (notification: NotificationData) => void;
  onDismiss: (notification: NotificationData) => void;
}

interface NotificationRendererProps {
  notification: NotificationData;
  onPress?: (notification: NotificationData) => void;
  onDismiss?: (notification: NotificationData) => void;
  style?: ViewStyle;
}

const NotificationGroup: React.FC<NotificationGroupProps> = ({
  date,
  notifications,
  onPress,
  onDismiss,
}) => {
  return (
    <View style={styles.group}>
      <Text style={styles.groupDate}>{date}</Text>
      {notifications.map((notification) => (
        <NotificationRenderer
          key={notification.id}
          notification={notification}
          onPress={onPress}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
};

const NotificationContent: React.FC<{ notification: NotificationData }> = ({
  notification,
}) => {
  return (
    <View style={styles.content}>
      <Text style={[styles.title, !notification.read && styles.unread]}>
        {notification.title}
      </Text>
      <Text style={styles.body} numberOfLines={2}>
        {notification.body}
      </Text>
      <Text testID="notification-timestamp" style={styles.time}>
        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
      </Text>
    </View>
  );
};

const NotificationRenderer: React.FC<NotificationRendererProps> = ({
  notification,
  onPress,
  onDismiss,
  style,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handlePress = useCallback(() => {
    if (notification.deep_link && notification.deep_link.startsWith('edushorts://articles/')) {
      const articleId = notification.deep_link.split('/').pop();
      if (articleId) {
        navigation.navigate('ArticleDetail', { articleId });
      }
    }
    onPress?.(notification);
  }, [notification, onPress, navigation]);

  const handleDismiss = useCallback(() => {
    onDismiss?.(notification);
  }, [notification, onDismiss]);

  const getIconName = useCallback(() => {
    switch (notification.type) {
      case 'article_link':
        return 'document-text';
      case 'scheduled':
        return 'time';
      case 'web':
        return 'globe';
      default:
        return 'notifications';
    }
  }, [notification.type]);

  return (
    <TouchableOpacity
      testID="notification-container"
      style={[styles.container, !notification.read && styles.unreadContainer, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          testID="notification-icon"
          name={getIconName() as any}
          size={24}
          color="#007AFF"
        />
      </View>
      <NotificationContent notification={notification} />
      <TouchableOpacity
        testID="dismiss-button"
        style={styles.dismissButton}
        onPress={handleDismiss}
      >
        <Ionicons name="close" size={20} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadContainer: {
    backgroundColor: '#f0f9ff',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  unread: {
    fontWeight: '600',
    color: '#000',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  dismissButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  group: {
    marginBottom: 16,
  },
  groupDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
});

export type { NotificationData, NotificationRendererProps };
export { NotificationGroup };
export default NotificationRenderer;
