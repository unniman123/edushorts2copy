
  context/AuthContext.tsx

  // Merged React and GoogleSignin imports
 import React, { createContext, useState, useContext, useEffect } from 'react';
 import { Session, User } from '@supabase/supabase-js';
 import { supabase } from '../utils/supabase';
 import { GoogleSignin } from '@react-native-google-signin/google-signin';
 rofile related types
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
     isLoading: true, // Start as loading
     userRole: null,
     profile: null,
   });
 
   // handleSession remains largely the same, fetches profile/role
   const handleSession = async (session: Session | null, skipLoading = false): Promise<void> => {
     if (!session) {
       // If session is null (e.g., on sign out), clear the state
       setState({
         user: null,
         session: null,
         isLoading: false,
         userRole: null,
         profile: null,
       });
       return;
     }
     console.log('AuthContext: Handling session for user:', session.user.id);
     // Set user/session state immediately
     setState(prev => ({
        ...prev,
        user: session.user,
        setState(prev => ({
            ...prev,
            user: session.user,
            session,
            isLoading: !skipLoading // Only set loading if not skipping
          }));
      
          const FETCH_TIMEOUT = 5000; // 5 seconds timeout
      
          try {
            // Fetch role and profile concurrently with timeout logic
            const getRolePromise = new Promise<{ data: UserRole | null, error: DBError | null }>(async (resolve) => {
                let timeoutId: NodeJS.Timeout | null = null;
                
                try {
                  const timeoutPromise = new Promise<{ data: UserRole | null, error: DBError | null }>((resolveTimeout) => { timeoutId = setTimeout(() => { resolveTimeout({ data: null, error: { code: 'TIMEOUT', message: 'Request timed out' } }); }, FETCH_TIMEOUT); });
                  const result = await Promise.race([ supabase.from('user_roles').select('role').eq('user_id', session.user.id).single(), timeoutPromise ]);
                  if (timeoutId) clearTimeout(timeoutId); resolve(result);
                } catch (error) { if (timeoutId) clearTimeout(timeoutId); resolve({ data: null, error: error as DBError }); }
            });
 
            const getProfilePromise = new Promise<{ data: DatabaseProfileData | null, error: DBError | null }>(async (resolve) => {
              let timeoutId: NodeJS.Timeout | null = null;
      
              try {
                const timeoutPromise = new Promise<{ data: DatabaseProfileData | null, error: DBError | null }>((resolveTimeout) => { timeoutId = setTimeout(() => { resolveTimeout({ data: null, error: { code: 'TIMEOUT', message: 'Request timed out' } }); }, FETCH_TIMEOUT); });
                const result = await Promise.race([ supabase.from('profiles').select('*').eq('id', session.user.id).single(), timeoutPromise ]);
                if (timeoutId) clearTimeout(timeoutId); resolve(result);
              } catch (error) { if (timeoutId) clearTimeout(timeoutId); resolve({ data: null, error: error as DBError }); }
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
                notification_preferences: dbProfile.notification_preferences || { push: false, email: false },
                updated_at: dbProfile.updated_at || new Date().toISOString(),
            };
          }
    
          // Update state with fetched data
          console.log('AuthContext: Session handled successfully');
          setState(prev => ({
            ...prev,
            userRole,
            profile,
            isLoading: false // Mark as not loading after fetching data
        }));
 
    } catch (error) {
      console.error('AuthContext: Error fetching profile/role in handleSession:', error);
      // Keep user and session but mark as not loading, clear profile/role
      setState(prev => ({
        ...prev,
        isLoading: false,
@@ -143,110 +170,167 @@
    }
  };

  // Simplified useEffect for session handling
  useEffect(() => {
    let isSubscribed = true;
    console.log('AuthContext: Setting up session listener and initial check...');

    // Immediately check for existing session from Supabase client (handles storage internally)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isSubscribed) {
        console.log('AuthContext: Initial session check result:', session ? 'Found session' : 'No session');
        // Call handleSession which sets state including isLoading: false
        handleSession(session);
    }
}).catch(error => {
   console.error('AuthContext: Error in initial getSession:', error);
   if (isSubscribed) {
      setState(prev => ({ ...prev, isLoading: false })); // Ensure loading stops on error
   }
});
};

     // Listen for auth state changes
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('AuthContext: Auth state changed:', event, session ? 'Session provided' : 'No session');

        if (!isSubscribed) return;
 
       // Let handleSession manage the state update based on the session provided
       // No need to manually save/remove from AsyncStorage here
       handleSession(session);

    });
 
    // Cleanup function
    return () => {
      console.log('AuthContext: Unsubscribing auth listener.');
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  }, []);

  // Updated signOut to also sign out from Google
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // Sign out from Supabase
      const { error: supabaseSignOutError } = await supabase.auth.signOut();
      if (supabaseSignOutError) {
        console.error('Supabase sign out error:', supabaseSignOutError);
        // Decide if we should still attempt Google sign out or throw/toast
      }

      // Sign out from Google Sign-In locally
      try {
        // Check if user is signed in with Google using getCurrentUser
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          await GoogleSignin.revokeAccess(); // Revoke access token (optional but good practice)
          await GoogleSignin.signOut();     // Clear local Google session
          console.log('AuthContext: Google Sign-Out successful.');
        } else {
          console.log('AuthContext: Google Sign-Out skipped (no current Google user).');
        }
      } catch (googleSignOutError) {
        console.error('AuthContext: Google Sign out error:', googleSignOutError);
        // Don't necessarily block the overall sign-out if Google fails, but log it.
      }

    } catch (error) {
        // Catch errors from Supabase sign out primarily
        console.error('Error during sign out process:', error);
        console.error('Error signing out:', error);
      } finally {
        // State is cleared by the onAuthStateChange listener calling handleSession(null)
        // We can ensure isLoading is false here just in case
         setState(prev => ({
           ...prev,
           user: null,
           session: null,
           isLoading: false,
           userRole: null,
           profile: null,
         }));
        }
    };
  
    // refreshSession remains the same
    const refreshSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        // handleSession will update state and isLoading
        await handleSession(session);
    } catch (error) {
        console.error('Error refreshing session:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
  
    // updateProfile remains the same
    const updateProfile = async (updates: Partial<Profile>) => {
      try {
        if (!state.user?.id) throw new Error('No user logged in');
        const timestamp = new Date().toISOString();
        const updateData = { ...updates, updated_at: timestamp };
        const { error } = await supabase.from('profiles').update(updateData).eq('id', state.user.id);
        if (error) throw error;
 
        setState(prev => ({
          ...prev,
          profile: prev.profile ? { ...prev.profile, ...updates, updated_at: timestamp } : null,


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
