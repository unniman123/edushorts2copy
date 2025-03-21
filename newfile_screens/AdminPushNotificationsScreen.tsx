import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';

export default function AdminPushNotificationsScreen() {
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const [targetCategory, setTargetCategory] = useState('all');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScheduleNotification = async () => {
    if (!message || !scheduleTime) {
      toast.error('Please enter message and schedule time');
      return;
    }
    setLoading(true);
    const notificationData = {
      message,
      link: '', // Optionally, add a link
      schedule_time: scheduleTime,
      target: targetCategory, // Custom field for targeting notifications
    };
    const { error } = await supabase.from('notifications').insert([notificationData]);
    if (error) {
      toast.error(`Error scheduling notification: ${error.message}`);
    } else {
      toast.success('Notification scheduled successfully');
      navigation.goBack();
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.header}>Schedule Push Notification</Text>
        <TextInput
          style={styles.input}
          placeholder="Notification Message"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Target Category (or 'all')"
          value={targetCategory}
          onChangeText={setTargetCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Schedule Time (ISO format)"
          value={scheduleTime}
          onChangeText={setScheduleTime}
        />
        <TouchableOpacity style={styles.button} onPress={handleScheduleNotification} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Schedule Notification</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 24 },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});