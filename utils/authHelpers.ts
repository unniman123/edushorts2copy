import { toast } from 'sonner-native';
import { supabase } from './supabase';
import { Provider } from '@supabase/supabase-js';
// Remove explicit User import, rely on property checking
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Function to handle profile creation/update and role assignment after successful sign-in
const syncUserProfileAndRole = async (userId: string, email?: string) => {
  console.log('[authHelpers] Syncing profile/role for user:', userId);
  try {
    // const username = email?.split('@')[0] || `user_${userId.slice(0, 8)}`;
    // // Create or update profile - REMOVED: Handled by DB trigger now
    // const { error: profileError } = await supabase
    //   .from('profiles')
    //   .upsert(
    //     {
    //       id: userId,
    //       username: username,
    //       // Ensure default notification preferences are set if needed
    //       notification_preferences: { push: true, email: false },
    //       updated_at: new Date().toISOString(),
    //     },
    //     { onConflict: 'id' }
    //   );

    // if (profileError) {
    //   console.error('[authHelpers] Profile sync error:', profileError);
    //   throw profileError; // Re-throw to be caught below
    // }
    // console.log('[authHelpers] Profile sync successful.');

    // Assign user role if not exists
    console.log('[authHelpers] Checking/assigning user role...'); // Added log
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Handle potential error during role check (e.g., RLS issues)
    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected for new users
       console.error('[authHelpers] Role check error:', roleCheckError);
       throw roleCheckError;
    }

    if (!existingRole) {
      console.log('[authHelpers] No existing role found, inserting default role.');
      const { error: roleInsertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'user' }]);

      if (roleInsertError) {
        console.error('[authHelpers] Role insert error:', roleInsertError);
        throw roleInsertError; // Re-throw
      }
      console.log('[authHelpers] Default role inserted successfully.');
    } else {
       console.log('[authHelpers] User already has a role:', existingRole.role);
    }

  } catch (syncError) {
    console.error('[authHelpers] Error during profile/role sync:', syncError);
    // Log the error but don't block login - show a warning toast
    toast.warning('Profile data sync failed. Please check your profile later.');
    // Do not re-throw here, allow login to proceed
  }
};


// Updated function to handle only Google Sign-In natively
export const handleGoogleSignIn = async (): Promise<boolean> => {
  console.log('[authHelpers] handleGoogleSignIn started...');
  try {
    // Check for Play Services on Android
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch (err) {
      console.error('[authHelpers] Play services error:', err);
      toast.error('Google Play Services required for sign-in.');
      return false;
    }

    console.log('[authHelpers] Calling GoogleSignin.signIn()...');
    // Get the result without casting
    const signInResult = await GoogleSignin.signIn();

    // Check for idToken within the 'data' property of the result
    // Use optional chaining for safety
    const idToken = signInResult?.data?.idToken;
    if (!idToken) {
      console.error('[authHelpers] Google Sign-In failed: No ID token received in result.data.', signInResult);
      throw new Error('Google Sign-In failed to return an ID token.');
    }

    // Log email safely using optional chaining on the user property within 'data'
    const userEmail = signInResult?.data?.user?.email;
    console.log('[authHelpers] Google Signin Success, User Email:', userEmail || 'Not provided');

    console.log('[authHelpers] Calling supabase.auth.signInWithIdToken...');
    const { data: { session }, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken, // Use the validated idToken
    });

    if (supabaseError) {
       console.error('[authHelpers] Supabase signInWithIdToken error:', supabaseError);
       throw supabaseError;
    }
    if (!session) {
       throw new Error('Supabase sign-in failed after Google Sign-In (no session).');
    }

    console.log('[authHelpers] Supabase signInWithIdToken successful for user:', session.user.id);

    // Sync profile and role - errors handled internally by the function
    await syncUserProfileAndRole(session.user.id, session.user.email);

    toast.success('Successfully signed in with Google!');
    return true; // Indicate success

  } catch (error: any) {
    console.error('[authHelpers] Error in handleGoogleSignIn:', error);
    let message = 'Failed to sign in with Google';
    
    if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
      console.error('[authHelpers] Developer Error Details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        // Add configuration details for verification
        config: await GoogleSignin.getTokens().catch(e => ({ error: e.message }))
      });
      console.error('[authHelpers] If this error persists, verify OAuth configuration and Play Console settings.');
      message = 'Google Sign-In configuration error. Please try again later.';
    } else if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      message = 'Sign in cancelled.';
      console.log('[authHelpers] Google Sign-In Cancelled by user.');
      // Don't show toast for cancellation, it's intentional user action
      return false;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      message = 'Sign in already in progress.';
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      message = 'Google Play Services not available or outdated.';
    } else {
      // Use Supabase error message if available, otherwise generic
      message = error?.message || 'An unknown error occurred during Google sign in.';
    }
    // Only show toast for actual errors, not cancellations
    if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
       toast.error(message);
    }
    return false; // Indicate failure
  }
};

// Removed handleOAuthCallbackUrl as deep linking is no longer used for Google Sign-In
// Removed setupAuthDeepLinks as deep linking is no longer used for Google Sign-In

// Updated initializeAuth - Now does nothing as AuthProvider handles initialization
export const initializeAuth = () => {
  console.log('[authHelpers] initializeAuth called (now passive, AuthProvider handles init)');
  // AuthProvider now handles all session restoration and listener setup.
  // This function is kept for compatibility if called elsewhere, but does nothing.
  return () => {}; // Return an empty cleanup function
};
