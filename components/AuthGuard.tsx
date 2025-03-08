import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

type RootStackParamList = {
  Login: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface AuthGuardProps {
  children: React.ReactNode;
  loadingMessage?: string;
  requireAdmin?: boolean;
  requiredRole?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  loadingMessage = 'Loading...',
  requireAdmin = false,
  requiredRole,
}) => {
  const { user, isLoading, isAuthReady, error, isAdmin } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [timeoutError, setTimeoutError] = React.useState<string | null>(null);

  // Handle timeout for initial loading
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isAuthReady || isLoading) {
      timeoutId = setTimeout(() => {
        setTimeoutError('Loading timed out. Please try again.');
      }, 10000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthReady, isLoading]);

  // Show custom loading screen while auth is initializing
  if (!isAuthReady || isLoading) {
    return (
      <LoadingScreen 
        message={loadingMessage} 
        error={timeoutError}
        onRetry={() => {
          setTimeoutError(null);
          navigation.replace('Login');
        }}
      />
    );
  }

  // Show error state with retry option
  if (error || timeoutError) {
    return (
      <LoadingScreen 
        error={error || timeoutError}
        onRetry={() => {
          setTimeoutError(null);
          navigation.replace('Login');
        }}
      />
    );
  }

  // Handle unauthenticated state with clear message
  if (!user) {
    return (
      <LoadingScreen 
        error="Please log in to access this content"
        onRetry={() => navigation.navigate('Login')}
      />
    );
  }

  // Handle admin access requirement
  if (requireAdmin && !isAdmin) {
    return (
      <LoadingScreen 
        error="Admin access required"
      />
    );
  }

  // Handle role requirement
  if (requiredRole && user.user_metadata?.role !== requiredRole) {
    return (
      <LoadingScreen 
        error={`Access restricted: ${requiredRole} role required`}
      />
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AuthGuard;
