import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationService } from '../lib/notificationService';
import { NotificationCategory } from '../types/notifications';
import type { CreateNotificationDTO } from '../types/notifications';

// Define categories array (move from types to component)
const NOTIFICATION_CATEGORIES = [
  'Education',
  'Visas',
  'Immigration',
  'Housing',
  'Employment',
  'Events',
  'Announcements'
] as const;

interface NotificationComposerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotificationComposer: React.FC<NotificationComposerProps> = ({
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<NotificationCategory[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!title.trim() || !body.trim()) {
        throw new Error('Title and body are required');
      }

      const notification: CreateNotificationDTO = {
        title: title.trim(),
        body: body.trim(),
        target_audience: {
          roles: ['user'],
          categories: selectedCategories
        }
      };

      // If not broadcast, set the target user
      if (!isBroadcast && targetUserId) {
        notification.user_id = targetUserId;
        notification.target_audience = { roles: ['user'], categories: [] };
      }

      await NotificationService.createNotification(notification);
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create notification';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category: NotificationCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Notification</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={styles.titleInput}
        placeholder="Notification Title"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <TextInput
        style={styles.bodyInput}
        placeholder="Notification Message"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>Broadcast Message</Text>
        <Switch
          value={isBroadcast}
          onValueChange={setIsBroadcast}
        />
      </View>

      {!isBroadcast && (
        <TextInput
          style={styles.userIdInput}
          placeholder="Target User ID"
          value={targetUserId}
          onChangeText={setTargetUserId}
        />
      )}

      {isBroadcast && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Target Categories</Text>
          <View style={styles.categoriesList}>
            {NOTIFICATION_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category) && styles.selectedCategoryChip
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategories.includes(category) && styles.selectedCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.sendButton, (!title || !body) && styles.sendButtonDisabled]}
        onPress={handleCreate}
        disabled={isLoading || !title || !body}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="send" size={20} color="#fff" />
            <Text style={styles.sendButtonText}>Send Notification</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 20,
    fontWeight: '600'
  },
  closeButton: {
    padding: 4
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  errorText: {
    color: '#D00',
    fontSize: 14
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    height: 120,
    textAlignVertical: 'top'
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  optionLabel: {
    fontSize: 16,
    color: '#333'
  },
  userIdInput: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16
  },
  categoriesContainer: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    margin: 4
  },
  selectedCategoryChip: {
    backgroundColor: '#007AFF'
  },
  categoryText: {
    fontSize: 14,
    color: '#666'
  },
  selectedCategoryText: {
    color: '#fff'
  },
  sendButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24
  },
  sendButtonDisabled: {
    backgroundColor: '#99C9FF'
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
});

export default NotificationComposer;
