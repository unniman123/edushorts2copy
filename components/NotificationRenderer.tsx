/**
 * NotificationRenderer - Comprehensive notification display system with deep linking support
 * 
 * Renders individual notifications with support for different notification types, deep linking
 * to articles, read/unread states, and dismissal actions. Includes grouped notification display
 * and automatic navigation handling for article links. Features platform-specific styling
 * and accessibility support with test IDs.
 * 
 * @component
 * @param {NotificationRendererProps} props - Component properties
 * @returns {React.ReactElement} The rendered notification component
 * 
 * @example
 * <NotificationRenderer
 *   notification={notificationData}
 *   onPress={(notification) => handleNotificationPress(notification)}
 *   onDismiss={(notification) => dismissNotification(notification)}
 * />
 */
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
import { getRelativeTime } from '../utils/timeUtils';

/**
 * Notification data structure with support for different notification types
 * @interface NotificationData
 */
interface NotificationData {
  /** Unique identifier for the notification */
  id: string;
  /** Notification title/headline */
  title: string;
  /** Notification body/content */
  body: string;
  /** Timestamp when the notification was created */
  timestamp: Date;
  /** Optional deep link URL for navigation */
  deep_link?: string;
  /** Whether the notification has been read */
  read: boolean;
  /** Type of notification for icon and behavior determination */
  type: 'push' | 'web' | 'scheduled' | 'article_link';
  /** Additional metadata for the notification */
  data?: Record<string, unknown>;
}

/**
 * Props for notification group component
 * @interface NotificationGroupProps
 */
interface NotificationGroupProps {
  /** Date string for grouping notifications */
  date: string;
  /** Array of notifications to display in the group */
  notifications: NotificationData[];
  /** Callback when a notification is pressed */
  onPress: (notification: NotificationData) => void;
  /** Callback when a notification is dismissed */
  onDismiss: (notification: NotificationData) => void;
}

/**
 * Props for the main notification renderer component
 * @interface NotificationRendererProps
 */
interface NotificationRendererProps {
  /** Notification data to render */
  notification: NotificationData;
  /** Optional callback when notification is pressed */
  onPress?: (notification: NotificationData) => void;
  /** Optional callback when notification is dismissed */
  onDismiss?: (notification: NotificationData) => void;
  /** Optional custom styles for the notification container */
  style?: ViewStyle;
}

/**
 * NotificationGroup - Groups notifications by date for organized display
 * 
 * @component
 * @param {NotificationGroupProps} props - Group component properties
 * @returns {React.ReactElement} The rendered notification group
 */
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

/**
 * NotificationContent - Renders the main content area of a notification
 * 
 * @component
 * @param {Object} props - Content component properties
 * @param {NotificationData} props.notification - Notification data to display
 * @returns {React.ReactElement} The rendered notification content
 */
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
        {getRelativeTime(notification.timestamp)}
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

  /**
   * Handles notification press with deep linking support
   * Automatically navigates to article viewer for article links
   * @returns {void}
   */
  const handlePress = useCallback(() => {
    if (notification.deep_link && notification.deep_link.startsWith('edushorts://articles/')) {
      const articleId = notification.deep_link.split('/').pop();
      if (articleId) {
        navigation.navigate('SingleArticleViewer', { articleId });
      }
    }
    onPress?.(notification);
  }, [notification, onPress, navigation]);

  /**
   * Handles notification dismissal
   * @returns {void}
   */
  const handleDismiss = useCallback(() => {
    onDismiss?.(notification);
  }, [notification, onDismiss]);

  /**
   * Determines appropriate icon based on notification type
   * @returns {string} Icon name for the notification type
   */
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
