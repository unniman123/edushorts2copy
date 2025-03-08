import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import type { DBNotification } from '../types/notifications';

interface NotificationItemProps {
  notification: DBNotification;
  onPress?: () => void;
  onMarkAsRead?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead
}) => {
  const { title, body, created_at, read } = notification;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !read && styles.unreadContainer
      ]}
      onPress={onPress}
      testID="notification-container"
    >
      {/* Notification Icon */}
      <View style={[styles.iconContainer, !read && styles.unreadIcon]}>
        <MaterialIcons
          name={read ? 'notifications-none' : 'notifications-active'}
          size={24}
          color={read ? '#666' : '#007AFF'}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, !read && styles.unreadText]}>{title}</Text>
        <Text style={styles.body} numberOfLines={2}>{body}</Text>
        <Text style={styles.timestamp}>
          {format(new Date(created_at), 'MMM d, yyyy h:mm a')}
        </Text>
      </View>

      {/* Actions */}
      {!read && onMarkAsRead && (
        <TouchableOpacity 
          style={styles.markReadButton}
          onPress={onMarkAsRead}
          testID="mark-read-button"
        >
          <MaterialIcons name="check" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1'
  },
  unreadContainer: {
    backgroundColor: '#F7F9FF'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  unreadIcon: {
    backgroundColor: '#EBF5FF'
  },
  content: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  unreadText: {
    fontWeight: '600',
    color: '#000'
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20
  },
  timestamp: {
    fontSize: 12,
    color: '#999'
  },
  markReadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  }
});

export default NotificationItem;
