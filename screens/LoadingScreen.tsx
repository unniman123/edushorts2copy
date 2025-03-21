import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoadingScreen() {
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { isLoading, refreshSession } = useAuth();
  
  // Handle loading duration tracking with maximum timeout
  useEffect(() => {
    const startTime = Date.now();
    const MAX_LOADING_TIME = 30000; // 30 seconds maximum loading time
    
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setLoadingDuration(duration);
      
      // Force error state if loading takes too long
      if (duration * 1000 >= MAX_LOADING_TIME) {
        setError('Loading timeout. Please restart the app.');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle session refresh with better cleanup and error handling
  useEffect(() => {
    let isActive = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let refreshTimeoutId: NodeJS.Timeout | null = null;
    
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 3000; // 3 seconds between retries
    const INITIAL_DELAY = 1000; // 1 second before first retry
    
    const cleanup = () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (refreshTimeoutId) clearTimeout(refreshTimeoutId);
    };

    let refreshAttempts = 0;

    const attemptRefresh = async () => {
      if (!isActive || !isLoading || refreshAttempts >= MAX_RETRIES) return;

      try {
        console.log(`LoadingScreen: Attempting to refresh session (retry ${refreshAttempts + 1}/${MAX_RETRIES})...`);
        await refreshSession();
        
        if (!isActive) return;
        
        refreshAttempts++;
        
        // Only schedule next retry if still loading and under max attempts
        if (isLoading && refreshAttempts < MAX_RETRIES) {
          refreshTimeoutId = setTimeout(attemptRefresh, RETRY_DELAY);
        } else if (refreshAttempts >= MAX_RETRIES) {
          setError('Unable to load. Please check your connection and try again.');
        }
      } catch (err) {
        console.error('LoadingScreen: Refresh failed:', err);
        if (isActive && refreshAttempts >= MAX_RETRIES) {
          setError('Connection error. Please try again.');
        }
      }
    };

    // Start refresh cycle if loading takes too long
    if (loadingDuration >= 5 && isLoading) {
      timeoutId = setTimeout(attemptRefresh, INITIAL_DELAY);
    }

    return cleanup;
  }, [isLoading, loadingDuration, refreshSession]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icon.png')}
        style={styles.logo}
        onError={(error) => console.error('LoadingScreen: Error loading logo:', error)}
      />
      <Text style={styles.brandText}>Edushorts</Text>
      <ActivityIndicator size="large" color="#ff0000" style={styles.spinner} />
      {error ? (
        <Text style={[styles.loadingText, styles.errorText]}>{error}</Text>
      ) : loadingDuration > 5 && (
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
  errorText: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
});
