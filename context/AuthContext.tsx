import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getPersistedSession, persistSession, isSessionValid, TOKEN_REFRESH_INTERVAL } from '../lib/session';
import { isTimeoutError } from '../lib/supabaseClient';
import { withTimeout, withRetry, DEFAULT_TIMEOUT } from '../lib/timeoutUtils';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  error: string | null;
  refreshAttempts: number;
}

interface AuthContextType extends AuthState {
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

type AuthResponse = {
  data: {
    session: Session | null;
  };
  error: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
    isAuthReady: false,
    error: null,
    refreshAttempts: 0
  });

  const setAuthState = (newState: Partial<AuthState> | ((prev: AuthState) => AuthState)) => {
    if (typeof newState === 'function') {
      setState(prev => ({
        ...prev,
        ...(newState(prev)),
        isAuthReady: prev.isAuthReady // Preserve isAuthReady state
      }));
    } else {
      setState(prev => ({
        ...prev,
        ...newState,
        isAuthReady: newState.hasOwnProperty('session') || prev.isAuthReady
      }));
    }
  };

  const clearError = () => {
    setAuthState({ error: null });
  };

  const refreshToken = async () => {
    try {
      if (!state.session) return;

      const result = await withRetry(
        () => supabase.auth.refreshSession(),
        {
          timeoutMs: DEFAULT_TIMEOUT.AUTH,
          maxAttempts: 3,
          backoffMs: 1000,
          retryableError: isTimeoutError
        }
      ) as AuthResponse;

      if (result.error) throw result.error;
      
      const { session } = result.data;
      if (session && session.user) {
        await persistSession(session);
        setAuthState({
          session,
          user: session.user,
          isAdmin: session.user.user_metadata?.is_admin || false,
          error: null,
          refreshAttempts: 0
        });
      } else {
        throw new Error('No session data received during refresh');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error refreshing token';
      console.error('Error refreshing token:', message);
      setAuthState({ error: message });

      // Only sign out if it's not a timeout error or if we've failed multiple times
      if (!isTimeoutError(error) || state.refreshAttempts >= 3) {
        await signOut();
      } else {
        // Increment refresh attempts and try again after delay
        setAuthState(prev => ({
          ...prev,
          refreshAttempts: prev.refreshAttempts + 1
        }));
      }
    }
  };

  const signIn = async (session: Session) => {
    try {
      await withTimeout(
        () => persistSession(session),
        DEFAULT_TIMEOUT.AUTH,
        'Sign in timed out'
      );

      setAuthState({
        user: session.user,
        session,
        isAdmin: session.user?.user_metadata?.is_admin || false,
        isLoading: false,
        error: null,
        refreshAttempts: 0
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error signing in';
      console.error('Error signing in:', message);
      setAuthState({
        user: null,
        session: null,
        isAdmin: false,
        isLoading: false,
        error: message,
        refreshAttempts: 0
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await withRetry(
        () => Promise.all([
          supabase.auth.signOut(),
          persistSession(null)
        ]),
        {
          timeoutMs: DEFAULT_TIMEOUT.AUTH,
          maxAttempts: 2,
          backoffMs: 1000
        }
      );

      setAuthState({
        user: null,
        session: null,
        isAdmin: false,
        isLoading: false,
        error: null,
        refreshAttempts: 0
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error signing out';
      console.error('Error signing out:', message);
      setAuthState({
        user: null,
        session: null,
        isAdmin: false,
        isLoading: false,
        error: message,
        refreshAttempts: 0
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await withTimeout(
          () => getPersistedSession(),
          DEFAULT_TIMEOUT.AUTH,
          'Auth initialization timed out'
        );
        
        if (session && isSessionValid(session)) {
          await signIn(session);
        } else {
          setAuthState({
            user: null,
            session: null,
            isAdmin: false,
            isLoading: false,
            error: null,
            refreshAttempts: 0
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error initializing auth';
        console.error('Error initializing auth:', message);
        setAuthState({
          user: null,
          session: null,
          isAdmin: false,
          isLoading: false,
          error: message,
          refreshAttempts: 0
        });
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval with cleanup
  useEffect(() => {
    if (!state.session) return;
    
    const intervalId = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
      setAuthState({ refreshAttempts: 0 });
    };
  }, [state.session]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        await signOut();
      } else if (session) {
        await signIn(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    ...state,
    signIn,
    signOut,
    refreshToken,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
