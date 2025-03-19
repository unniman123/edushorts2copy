import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  notification_preferences: {
    push: boolean;
    email: boolean;
  };
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
  profile: Profile | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    userRole: null,
    profile: null,
  });

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Session check result:', session ? 'Found session' : 'No session');
      if (session) {
        handleSession(session);
      } else {
        console.log('AuthContext: No session found, setting isLoading to false');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }).catch(error => {
      console.error('AuthContext: Error getting session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event);
      if (session) {
        await handleSession(session);
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          userRole: null,
          profile: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session: Session) => {
    console.log('AuthContext: Handling session for user:', session.user.id);
    try {
      // Set initial state to show we're processing
      setState(prev => ({
        ...prev,
        user: session.user,
        session,
        isLoading: true
      }));

      // Get user role
      console.log('AuthContext: Fetching user role...');
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (roleError) {
        console.warn('AuthContext: Role fetch error:', roleError);
        if (roleError.code !== 'PGRST116') {
          throw roleError;
        }
      }

      // Get user profile
      console.log('AuthContext: Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.warn('AuthContext: Profile fetch error:', profileError);
        if (profileError.code !== 'PGRST116') {
          throw profileError;
        }
      }

      // Successfully processed session
      console.log('AuthContext: Session handled successfully');
      setState({
        user: session.user,
        session,
        isLoading: false,
        userRole: roleData?.role || null,
        profile: profile as Profile || null,
      });

    } catch (error) {
      console.error('AuthContext: Error in handleSession:', error);
      // Set error state but maintain session
      setState({
        user: session.user,
        session,
        isLoading: false,
        userRole: null,
        profile: null,
      });
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('userSession');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setState({
        user: null,
        session: null,
        isLoading: false,
        userRole: null,
        profile: null,
      });
    }
  };

  const refreshSession = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        await handleSession(session);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user?.id) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    signOut,
    refreshSession,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { Profile };
