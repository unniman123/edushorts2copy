/**
 * useAuthSession - Custom hook for managing authentication session persistence and validation
 * 
 * Provides comprehensive session management including automatic persistence to AsyncStorage,
 * session validation with refresh threshold, and auth state change handling. Implements
 * periodic session checks and automatic refresh when sessions are near expiration.
 * Handles session cleanup on sign out and user deletion events.
 * 
 * @hook
 * @returns {UseAuthSessionReturn} Object containing session management methods
 * 
 * @example
 * const { checkSession, persistSession } = useAuthSession();
 * 
 * // Manual session check
 * const isValid = await checkSession();
 * if (!isValid) {
 *   // Redirect to login
 * }
 * 
 * // Session will automatically:
 * // - Persist on sign in/token refresh
 * // - Refresh when near expiration
 * // - Clean up on sign out
 */
import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner-native';
import { AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Return type for useAuthSession hook
 * @interface UseAuthSessionReturn
 */
interface UseAuthSessionReturn {
  /** Function to check and validate current session */
  checkSession: () => Promise<boolean>;
  /** Function to persist current session to storage */
  persistSession: () => Promise<void>;
}

/**
 * Return type for useRequireAuth hook
 * @interface UseRequireAuthReturn
 */
interface UseRequireAuthReturn {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Loading state indicator */
  isLoading: boolean;
}

/**
 * AsyncStorage key for session persistence
 * @constant {string}
 */
const SESSION_KEY = '@edushorts/auth_session';

/**
 * Session refresh threshold in milliseconds (1 hour)
 * Sessions will be refreshed when they expire within this timeframe
 * @constant {number}
 */
const REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds

export function useAuthSession(): UseAuthSessionReturn {
  const { refreshSession } = useAuth();

  /**
   * Persists current session to AsyncStorage
   * Stores access token, refresh token, and expiration time
   * @returns {Promise<void>} Promise that resolves when session is persisted
   */
  const persistSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        }));
      }
    } catch (error) {
      console.error('Error persisting session:', error);
    }
  }, []);

  /**
   * Checks current session validity and refreshes if needed
   * Validates stored session and refreshes when near expiration
   * @returns {Promise<boolean>} Promise that resolves to true if session is valid
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionStr) return false;

      const session = JSON.parse(sessionStr);
      const expiresAt = new Date(session.expires_at).getTime();
      const now = Date.now();

      // If session is expired or will expire soon, refresh it
      if (expiresAt - now < REFRESH_THRESHOLD) {
        await refreshSession();
        await persistSession();
      }
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      // If there's an error, clear the stored session
      await AsyncStorage.removeItem(SESSION_KEY);
      return false;
    }
  }, [refreshSession, persistSession]);

  // Set up session persistence
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          await persistSession();
          break;
        case 'SIGNED_OUT':
          await AsyncStorage.removeItem(SESSION_KEY);
          break;
        case 'USER_UPDATED':
          if (!session) {
            // User was deleted
            await AsyncStorage.removeItem(SESSION_KEY);
            toast.error('Your account has been deleted');
          }
          break;
      }
    });

    // Check session on mount
    checkSession();

    // Set up periodic session checks
    const intervalId = setInterval(checkSession, REFRESH_THRESHOLD / 2);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [checkSession, persistSession]);

  return {
    checkSession,
    persistSession,
  };
}

/**
 * useRequireAuth - Custom hook for components that require authentication
 * 
 * Provides authentication requirement checking for protected components.
 * Automatically validates session and handles redirection logic for
 * unauthenticated users. Integrates with useAuthSession for session validation.
 * 
 * @hook
 * @param {string} [redirectTo='/login'] - Path to redirect to if not authenticated
 * @returns {UseRequireAuthReturn} Object containing authentication state
 * 
 * @example
 * const { isAuthenticated, isLoading } = useRequireAuth('/login');
 * 
 * if (isLoading) return <LoadingScreen />;
 * if (!isAuthenticated) return null; // Will handle redirect
 * 
 * // Component content for authenticated users
 * return <ProtectedContent />;
 */
export function useRequireAuth(redirectTo: string = '/login'): UseRequireAuthReturn {
  const { session, isLoading } = useAuth();
  const { checkSession } = useAuthSession();

  useEffect(() => {
    if (!isLoading && !session) {
      checkSession().then((isValid) => {
        if (!isValid) {
          // Handle navigation to login
          // You might want to use your navigation logic here
          console.log('Redirect to:', redirectTo);
        }
      });
    }
  }, [session, isLoading, checkSession, redirectTo]);

  return {
    isAuthenticated: !!session,
    isLoading,
  };
}
