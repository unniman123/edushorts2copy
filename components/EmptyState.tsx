import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControlProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'notifications-off',
  title,
  message,
  refreshControl
}) => {
  const Content = () => (
    <>
      <MaterialIcons name={icon} size={48} color="#999" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </>
  );

  if (refreshControl) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
      >
        <Content />
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, styles.contentContainer]}>
      <Content />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: '80%'
  }
});

export default EmptyState;
