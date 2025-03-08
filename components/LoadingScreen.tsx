import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

interface LoadingScreenProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  error = null,
  onRetry
}) => {
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const handleRetry = useCallback(async () => {
    if (isRetrying || !onRetry) return;

    setIsRetrying(true);
    setRetryCount((prev: number) => prev + 1);

    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying]);

  // Auto-retry up to 3 times if it's a timeout error
  useEffect(() => {
    if (error?.toLowerCase().includes('timeout') && retryCount < 3 && !isRetrying) {
      const timer = setTimeout(() => {
        handleRetry();
      }, Math.min(2000 * Math.pow(2, retryCount), 8000)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, handleRetry, isRetrying]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Feather name="alert-circle" size={48} color="#ff3b30" />
          <Text style={styles.errorTitle}>
            {error.toLowerCase().includes('timeout') ? 'Connection Timeout' : 'Something went wrong'}
          </Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {onRetry && (
            <TouchableOpacity 
              style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              <Text style={styles.retryButtonText}>
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          )}
          {retryCount > 0 && (
            <Text style={styles.retryCount}>
              Retry attempt {retryCount}/3
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  retryButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#999',
  },
  retryCount: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoadingScreen;
