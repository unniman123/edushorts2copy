    import React from 'react';
    import { View, Text, StyleSheet } from 'react-native';
    import { SafeAreaView } from 'react-native-safe-area-context';
    
    export default function NotificationsScreen() {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Your recent notifications will appear here.</Text>
          </View>
        </SafeAreaView>
      );
    }
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#ffffff',
      },
      content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      },
      title: {
        fontSize: 24,
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 8,
      },
      subtitle: {
        fontSize: 16,
        color: '#666',
      },
    });