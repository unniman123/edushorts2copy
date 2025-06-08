import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { toast } from 'sonner-native';
import UserListItem from './components/UserListItem';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function AdminUserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdate, setRoleUpdate] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    let { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      toast.error(`Error fetching users: ${error.message}`);
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      toast.error(`Error updating role: ${error.message}`);
    } else {
      toast.success('User role updated');
      fetchUsers();
    }
  };

  const renderUserItem = useCallback(({ item }: { item: User }) => (
    <UserListItem
      item={item}
      role={roleUpdate[item.id] !== undefined ? roleUpdate[item.id] : item.role}
      onRoleChange={(text) => setRoleUpdate({ ...roleUpdate, [item.id]: text })}
      onUpdateRole={() => updateUserRole(item.id, roleUpdate[item.id] || item.role)}
    />
  ), [roleUpdate, updateUserRole]);

  // For metrics, simulate counts (in a real app, use aggregate queries)
  const totalUsers = users.length;
  const totalArticles = 50; // Replace with real fetch if available

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>User Management & Metrics</Text>
      <View style={styles.metrics}>
        <Text style={styles.metricText}>Total Users: {totalUsers}</Text>
        <Text style={styles.metricText}>Total Articles: {totalArticles}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  metrics: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  metricText: { fontSize: 16, color: '#333' },
  loader: { marginTop: 20 },
  list: { paddingBottom: 16 },
  userItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 8 },
  roleInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    fontSize: 14,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
});