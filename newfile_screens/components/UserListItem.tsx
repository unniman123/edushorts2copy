import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface UserListItemProps {
  item: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  onUpdateRole: () => void;
  onRoleChange: (text: string) => void;
  role: string;
}

const UserListItem: React.FC<UserListItemProps> = ({ item, onUpdateRole, onRoleChange, role }) => {
  return (
    <View style={styles.userItem}>
      <Text style={styles.userName}>{item.full_name || 'No Name'}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <TextInput
        style={styles.roleInput}
        value={role}
        onChangeText={onRoleChange}
      />
      <TouchableOpacity style={styles.updateButton} onPress={onUpdateRole}>
        <Text style={styles.updateButtonText}>Update Role</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default memo(UserListItem); 