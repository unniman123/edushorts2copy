/**
 * useProtectedRoute - Custom hook for protecting routes based on authentication and role authorization
 * 
 * Provides route protection functionality with automatic redirection for unauthenticated users
 * and role-based access control. Handles navigation to appropriate screens based on authentication
 * status and user roles, with loading state management during authentication checks.
 * 
 * @hook
 * @param {AllowedRoles} [requiredRole] - Optional role requirement for route access
 * @returns {UseProtectedRouteReturn} Object containing authentication and authorization state
 * 
 * @example
 * // Basic authentication check
 * const { isAuthenticated, isLoading } = useProtectedRoute();
 * 
 * // Role-based protection
 * const { isAuthenticated, isAuthorized, userRole } = useProtectedRoute('admin');
 * 
 * // Usage in component
 * if (isLoading) return <LoadingScreen />;
 * if (!isAuthenticated) return null; // Will redirect to login
 * if (!isAuthorized) return <UnauthorizedScreen />;
 */
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Allowed user roles for route protection
 * @type {AllowedRoles}
 */
type AllowedRoles = 'user' | 'admin' | undefined;

/**
 * Return type for useProtectedRoute hook
 * @interface UseProtectedRouteReturn
 */
interface UseProtectedRouteReturn {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the user is authorized for the required role */
  isAuthorized: boolean;
  /** Loading state during authentication check */
  isLoading: boolean;
  /** Current user role */
  userRole: string | null;
}

export function useProtectedRoute(requiredRole?: AllowedRoles, enableGuestMode: boolean = true): UseProtectedRouteReturn {
  const navigation = useNavigation<NavigationProp>();
  const { session, userRole, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If guest mode is enabled, don't force redirect to login
    if (!session && !enableGuestMode) {
      // Schedule a gentle transition to Login so the UI doesn't abruptly jump.
      // Use InteractionManager to wait for animations/gestures to finish, then
      // navigate to Login and reset after a short timeout to allow the screen
      // to animate in gracefully.
      InteractionManager.runAfterInteractions(() => {
        // Provide empty params to satisfy navigation typing for Login screen
        navigation.navigate('Login', {});

        // Keep app responsive — perform a reset after a short delay so back
        // history is clean for auth flow. This matches existing behaviour
        // while avoiding an immediate hard jump.
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }, 220);
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
