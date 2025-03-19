import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoadingScreen() {
  const [loadingDuration, setLoadingDuration] = useState(0);
  const { isLoading } = useAuth();

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoadingDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loadingDuration > 10) {
      console.warn('LoadingScreen: Loading is taking longer than expected');
    }
  }, [loadingDuration]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icon.png')}
        style={styles.logo}
        onError={(error) => console.error('LoadingScreen: Error loading logo:', error)}
      />
      <Text style={styles.brandText}>Edushorts</Text>
      <ActivityIndicator size="large" color="#ff0000" style={styles.spinner} />
      {loadingDuration > 5 && (
        <Text style={styles.loadingText}>
          {isLoading ? 'Still loading...' : 'Almost there...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 24,
  },
  spinner: {
    transform: [{ scale: 1.5 }],
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
});
