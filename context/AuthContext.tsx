import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Profile related types
export type NotificationPreferences = {
  push: boolean;
  email: boolean;
};

export interface IProfile {
  id: string;
  username: string;
  avatar_url?: string;
  notification_preferences: NotificationPreferences;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
  profile: IProfile | null;
}

// We'll use this for the raw database response
type DatabaseProfileData = {
  id: string;
  username: string;
  avatar_url?: string;
  notification_preferences?: NotificationPreferences;
  updated_at?: string;
}

type UserRole = {
  role: string;
}

type DBError = {
  code: string;
  message: string;
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

  const handleSession = async (session: Session, skipLoading = false): Promise<void> => {
    console.log('AuthContext: Handling session for user:', session.user.id);
    
    // Set initial state immediately
    setState(prev => ({
      ...prev,
      user: session.user,
      session,
      isLoading: !skipLoading // Only set loading if not skipping
    }));

    const FETCH_TIMEOUT = 5000; // 5 seconds timeout

    try {
      // Create promises with timeouts
      const getRolePromise = new Promise<{ data: UserRole | null, error: DBError | null }>(async (resolve) => {
        let timeoutId: NodeJS.Timeout | null = null;
        
        try {
          const timeoutPromise = new Promise<{ data: UserRole | null, error: DBError | null }>((resolveTimeout) => {
            timeoutId = setTimeout(() => {
              resolveTimeout({ data: null, error: { code: 'TIMEOUT', message: 'Request timed out' } });
            }, FETCH_TIMEOUT);
          });

          const result = await Promise.race([
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single(),
            timeoutPromise
          ]);

          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          resolve({ data: null, error: error as DBError });
        }
      });

      const getProfilePromise = new Promise<{ data: DatabaseProfileData | null, error: DBError | null }>(async (resolve) => {
        let timeoutId: NodeJS.Timeout | null = null;

        try {
          const timeoutPromise = new Promise<{ data: DatabaseProfileData | null, error: DBError | null }>((resolveTimeout) => {
            timeoutId = setTimeout(() => {
              resolveTimeout({ data: null, error: { code: 'TIMEOUT', message: 'Request timed out' } });
            }, FETCH_TIMEOUT);
          });

          const result = await Promise.race([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single(),
            timeoutPromise
          ]);

          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          resolve({ data: null, error: error as DBError });
        }
      });

      const [roleResult, profileResult] = await Promise.all([getRolePromise, getProfilePromise]);

      // Process results
      const userRole = roleResult.data?.role || null;
      let profile: IProfile | null = null;

      if (profileResult.data) {
        const dbProfile = profileResult.data;
        profile = {
          id: session.user.id,
          username: dbProfile.username || '',
          avatar_url: dbProfile.avatar_url,
          notification_preferences: dbProfile.notification_preferences || {
            push: false,
            email: false,
          },
          updated_at: dbProfile.updated_at || new Date().toISOString(),
        };
      }

      // Update state with fetched data
      console.log('AuthContext: Session handled successfully');
      setState(prev => ({
        ...prev,
        userRole,
        profile,
        isLoading: false
      }));

    } catch (error) {
      console.error('AuthContext: Error in handleSession:', error);
      // Keep user and session but mark as not loading
      setState(prev => ({
        ...prev,
        isLoading: false,
        userRole: null,
        profile: null
      }));
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let hasInitializedSession = false;
    console.log('AuthContext: Initializing...');

    const initializeAuth = async () => {
      try {
        // Always start with stored session
        const storedSession = await AsyncStorage.getItem('userSession');
        if (storedSession && isSubscribed) {
          const parsedSession = JSON.parse(storedSession);
          const { data: { session }, error } = await supabase.auth.setSession(parsedSession);
          if (error) {
            console.error('AuthContext: Error setting stored session:', error);
            await AsyncStorage.removeItem('userSession');
          } else if (session) {
            await handleSession(session);
            hasInitializedSession = true;
          }
        }

        // If no stored session or it failed, get current state
        if (!hasInitializedSession && isSubscribed) {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('AuthContext: Session check result:', session ? 'Found session' : 'No session');
          
          if (session) {
            await handleSession(session);
            await AsyncStorage.setItem('userSession', JSON.stringify(session));
          } else {
            console.log('AuthContext: No session found, setting isLoading to false');
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('AuthContext: Error initializing:', error);
        if (isSubscribed) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event);
      
      if (!isSubscribed) return;

      try {
        switch (event) {
          case 'TOKEN_REFRESHED':
            if (session && session.user.id === state.session?.user?.id) {
              // Only update session data without full reload
              await handleSession(session, true);
              await AsyncStorage.setItem('userSession', JSON.stringify(session));
            }
            break;
            
          case 'SIGNED_IN':
            if (session) {
              await handleSession(session);
              await AsyncStorage.setItem('userSession', JSON.stringify(session));
            }
            break;

          case 'SIGNED_OUT':
            setState({
              user: null,
              session: null,
              isLoading: false,
              userRole: null,
              profile: null,
            });
            await AsyncStorage.removeItem('userSession');
            break;
            
          case 'USER_UPDATED':
            if (!session) {
              setState({
                user: null,
                session: null,
                isLoading: false,
                userRole: null,
                profile: null,
              });
              await AsyncStorage.removeItem('userSession');
            }
            break;
        }
      } catch (error) {
        console.error('AuthContext: Error handling auth state change:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

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
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        await handleSession(session);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user?.id) throw new Error('No user logged in');

      const timestamp = new Date().toISOString();
      const updateData = {
        ...updates,
        updated_at: timestamp,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', state.user.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        profile: prev.profile 
          ? { 
              ...prev.profile, 
              ...updates, 
              updated_at: timestamp 
            }
          : null,
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

// Export Profile type alias
export type Profile = IProfile;
