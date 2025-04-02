import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser'; // <-- Import WebBrowser
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
  console.log('[authHelpers] handleOAuthSignIn started for provider:', provider); // <-- ADD LOG
  try {
    console.log('[authHelpers] Creating redirect URL...'); // <-- ADD LOG
    const redirectUrl = makeRedirectUri({
      native: Linking.createURL('/auth/callback'),
    });
    console.log('[authHelpers] Redirect URL created:', redirectUrl); // <-- ADD LOG

    console.log('[authHelpers] Calling supabase.auth.signInWithOAuth...'); // <-- ADD LOG
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // <-- Set to true
      },
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from OAuth sign in');
    console.log('[authHelpers] signInWithOAuth successful, data:', data); // <-- ADD LOG

    // Explicitly open the browser
    const authResponse = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    console.log('[authHelpers] WebBrowser response:', authResponse); // <-- ADD LOG

    if (authResponse.type !== 'success') {
      // Handle cancellation or dismissal
      if (authResponse.type === 'cancel' || authResponse.type === 'dismiss') {
        console.log('[authHelpers] OAuth flow cancelled by user.');
        // Optionally show a toast message
        // toast.info('Sign in cancelled.');
        return false; // Indicate cancellation
      }
      // Handle other potential non-success types if necessary
      throw new Error(`WebBrowser failed: ${authResponse.type}`);
    }

    // If successful, the deep link listener (handleOAuthCallbackUrl) will be triggered
    // We don't need to return anything specific here as the listener handles the final steps
    // Returning true might be misleading if the callback processing fails later
    // Let's return void or handle the success state based on the listener's outcome if needed elsewhere
    // For now, just log success at this stage
    console.log('[authHelpers] WebBrowser session opened successfully. Waiting for callback...');
    // The function implicitly returns undefined here, which is fine.
    // The LoginScreen's finally block will still run.

  } catch (error) {
    console.error('[authHelpers] Error in handleOAuthSignIn:', error); // <-- ADD LOG
    const message = error instanceof Error ? error.message : 'Failed to initiate sign in';
    // Attempt toast, but also log in case toast fails silently
    console.error('[authHelpers] Error message for toast:', message); // <-- ADD LOG
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