import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AllowedRoles = 'user' | 'admin' | undefined;

export function useProtectedRoute(requiredRole?: AllowedRoles) {
  const navigation = useNavigation<NavigationProp>();
  const { session, userRole, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!session) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    // Check role requirements if specified
    if (requiredRole && userRole !== requiredRole) {
      // If user doesn't have required role, redirect to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [session, userRole, isLoading, requiredRole, navigation]);

  // Return auth state for component usage
  return {
    isAuthenticated: !!session,
    isAuthorized: !requiredRole || userRole === requiredRole,
    isLoading,
    userRole,
  };
}
