import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getPersistedSession, persistSession, isSessionValid, TOKEN_REFRESH_INTERVAL } from '../lib/session';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
  });

  const refreshToken = async () => {
    try {
      if (!state.session) return;
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session && session.user) {
        await persistSession(session);
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          isAdmin: session.user.user_metadata?.is_admin || false,
        }));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      await signOut();
    }
  };

  const signIn = async (session: Session) => {
    await persistSession(session);
    setState({
      user: session.user,
      session,
      isAdmin: session.user?.user_metadata?.is_admin || false,
      isLoading: false,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await persistSession(null);
    setState({
      user: null,
      session: null,
      isAdmin: false,
      isLoading: false,
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await getPersistedSession();
        if (session && isSessionValid(session)) {
          await signIn(session);
        } else {
          await signOut();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        await signOut();
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.session) return;
    
    const intervalId = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [state.session]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
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
