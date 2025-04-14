import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f8f8', '#f0f0f0']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/apk icon .png')}
          style={styles.logo}
          onError={(error) => console.error('LoadingScreen: Error loading logo:', error)}
        />
        <Text style={styles.brandText}>Edushorts</Text>
        <ActivityIndicator size="large" color="#ff0000" style={styles.spinner} />
        {error ? (
          <Text style={[styles.loadingText, styles.errorText]}>{error}</Text>
        ) : loadingDuration > 5 && (
          <Animated.Text style={[styles.loadingText, { opacity: fadeAnim }]}>
            {isLoading ? 'Still loading...' : 'Almost there...'}
          </Animated.Text>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    resizeMode: 'contain',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spinner: {
    transform: [{ scale: 1.75 }],
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
});
