import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner-native';
import { AuthChangeEvent } from '@supabase/supabase-js';

const SESSION_KEY = '@edushorts/auth_session';
const REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds

export function useAuthSession() {
  const { refreshSession } = useAuth();

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

// Custom hook for protected routes that require authentication
export function useRequireAuth(redirectTo: string = '/login') {
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
