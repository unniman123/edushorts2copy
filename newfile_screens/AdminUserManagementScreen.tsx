import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { toast } from 'sonner-native';

export default function AdminUserManagementScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdate, setRoleUpdate] = useState({}); // { userId: newRole }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    let { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      toast.error(`Error fetching users: ${error.message}`);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      toast.error(`Error updating role: ${error.message}`);
    } else {
      toast.success('User role updated');
      fetchUsers();
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.userName}>{item.full_name || 'No Name'}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <TextInput
        style={styles.roleInput}
        value={roleUpdate[item.id] !== undefined ? roleUpdate[item.id] : item.role}
        onChangeText={(text) => setRoleUpdate({ ...roleUpdate, [item.id]: text })}
      />
      <TouchableOpacity style={styles.updateButton} onPress={() => updateUserRole(item.id, roleUpdate[item.id] || item.role)}>
        <Text style={styles.updateButtonText}>Update Role</Text>
      </TouchableOpacity>
    </View>
  );

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