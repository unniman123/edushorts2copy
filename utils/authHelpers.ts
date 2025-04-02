import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { toast } from 'sonner-native';
import { supabase } from './supabase';
import { Provider } from '@supabase/supabase-js';

interface OAuthSession {
  user: {
    id: string;
    email?: string;
  };
}

export const handleOAuthCallbackUrl = async (url: string) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    const session = data.session;
    if (!session?.user) throw new Error('No user returned from OAuth sign in');

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
          notification_preferences: { push: true, email: false },
          updated_at: new Date().toISOString(),
        },
      ], {
        onConflict: 'id',
      });

    if (profileError) throw profileError;

    // Assign user role if not exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: session.user.id,
            role: 'user',
          },
        ]);

      if (roleError) throw roleError;
    }

    toast.success('Successfully signed in!');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    toast.error(message);
    return false;
  }
};

export const handleOAuthSignIn = async (provider: Provider) => {
  try {
    const redirectUrl = makeRedirectUri({
      native: Linking.createURL('/auth/callback'),
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from OAuth sign in');

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initiate sign in';
    toast.error(message);
    return false;
  }
};

// Handle deep linking setup
export const setupAuthDeepLinks = () => {
  const authUrl = Linking.createURL('auth/callback');
  let removeListener: (() => void) | undefined;

  const init = () => {
    // Remove existing listener if any
    if (removeListener) {
      removeListener();
    }

    // Set up new listener
    removeListener = Linking.addEventListener('url', (event: { url: string }) => {
      if (event.url.startsWith(authUrl)) {
        handleOAuthCallbackUrl(event.url);
      }
    }).remove;

    // Check for initial URL
    Linking.getInitialURL().then((url: string | null) => {
      if (url && url.startsWith(authUrl)) {
        handleOAuthCallbackUrl(url);
      }
    });
  };

  init();

  // Return cleanup function
  return () => {
    if (removeListener) {
      removeListener();
    }
  };
};

// Initialize deep linking
export const initializeAuth = () => {
  const cleanup = setupAuthDeepLinks();
  
  // Re-establish auth state from storage
  supabase.auth.getSession().catch(error => {
    console.error('Error restoring auth state:', error);
  });

  return cleanup;
};
