import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'auth_session';

export const persistSession = async (session: Session | null): Promise<void> => {
  try {
    if (session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  } catch (error) {
    console.error('Error persisting session:', error);
  }
};

export const getPersistedSession = async (): Promise<Session | null> => {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (error) {
    console.error('Error getting persisted session:', error);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const isSessionValid = (session: Session | null): boolean => {
  if (!session?.expires_at) return false;
  const expiresAt = new Date(session.expires_at).getTime();
  const now = new Date().getTime();
  return expiresAt > now;
};

// Token refresh check interval (5 minutes)
export const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;
