import { toast } from 'sonner-native';
import { supabase } from './supabase';
// Use the main GoogleSignin export and related types/status codes
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse, // Helper to check for success response type
  isCancelledResponse, // Helper to check for cancelled response type
  type User,
  type SignInResponse
} from '@react-native-google-signin/google-signin';

// Function to handle profile creation/update and role assignment after successful sign-in
const syncUserProfileAndRole = async (userId: string, email?: string) => {
  console.log('[authHelpers] Syncing profile/role for user:', userId);
  try {
    // Assign user role if not exists
    console.log('[authHelpers] Checking/assigning user role...');
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Handle potential error during role check (e.g., RLS issues)
    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 means no rows found
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
    toast.warning('Profile data sync failed. Please check your profile later.');
  }
};


// Updated function to handle Google Sign-In using the standard GoogleSignin API
export const handleGoogleSignIn = async (): Promise<boolean> => {
  console.log('[authHelpers] handleGoogleSignIn started (using GoogleSignin API)...');
  try {
    // Check for Play Services
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch (playServicesError) {
      console.error('[authHelpers] Play services error:', playServicesError);
      toast.error('Google Play Services required for sign-in.');
      return false;
    }

    console.log('[authHelpers] Calling GoogleSignin.signIn()...');
    const signInResponse: SignInResponse = await GoogleSignin.signIn();

    // Check if the sign-in was successful using the helper
    if (isSuccessResponse(signInResponse)) {
      // Access idToken and user from the 'data' property
      const idToken = signInResponse.data.idToken;
      const userEmail = signInResponse.data.user?.email; // Access user email safely

      if (!idToken) {
        console.error('[authHelpers] Google Sign-In succeeded but no ID token received.', signInResponse);
        throw new Error('Google Sign-In succeeded but failed to return an ID token.');
      }

      console.log('[authHelpers] Google Signin Success, User Email:', userEmail || 'Not provided');

      console.log('[authHelpers] Calling supabase.auth.signInWithIdToken...');
      const { data: { session }, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (supabaseError) {
         console.error('[authHelpers] Supabase signInWithIdToken error:', supabaseError);
         throw supabaseError;
      }
      if (!session) {
         throw new Error('Supabase sign-in failed after Google Sign-In (no session).');
      }

      console.log('[authHelpers] Supabase signInWithIdToken successful for user:', session.user.id);

      // Sync profile and role
      await syncUserProfileAndRole(session.user.id, session.user.email);

      toast.success('Successfully signed in with Google!');
      return true; // Indicate success

    } else if (isCancelledResponse(signInResponse)) {
      // Handle cancellation explicitly based on response type
      console.log('[authHelpers] Google Sign-In Cancelled by user.');
      // No toast needed for cancellation
      return false;
    } else {
      // Handle other non-success, non-cancelled responses if necessary
      console.error('[authHelpers] Google Sign-In returned non-success/non-cancelled response:', signInResponse);
      throw new Error('Google Sign-In failed with an unexpected response type.');
    }

  } catch (error: any) {
    console.error('[authHelpers] Error in handleGoogleSignIn:', error);
    let message = 'Failed to sign in with Google';

    // Use the isErrorWithCode helper for safer error code checking
    if (isErrorWithCode(error)) {
      // Use status codes relevant to the standard GoogleSignin API
      switch (error.code) {
        // SIGN_IN_CANCELLED is now handled above by checking response type,
        // but keep this case for potential edge cases where the error might still be thrown.
        case statusCodes.SIGN_IN_CANCELLED:
          message = 'Sign in cancelled.';
          console.log('[authHelpers] Google Sign-In Cancelled (caught as error).');
          // Don't show toast for cancellation
          return false; // Return false for cancellation
        case statusCodes.IN_PROGRESS:
          message = 'Sign in already in progress.';
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          message = 'Google Play Services not available or outdated.';
          break;
        default:
           if (error.message?.includes('DEVELOPER_ERROR')) {
             console.error('[authHelpers] Developer Error Details:', { message: error.message, code: error.code, stack: error.stack });
             console.error('[authHelpers] Verify OAuth configuration (SHA-1, package name, client IDs) in Google Cloud/Firebase Console.');
             message = 'Google Sign-In configuration error. Please check setup.';
           } else {
             message = error.message || 'An unknown Google Sign-In error occurred.';
           }
      }
    } else {
      // Handle errors not originating from the Google Sign-In library (e.g., Supabase errors)
      message = error?.message || 'An unknown error occurred during sign in.';
    }

    // Show toast for actual errors, not cancellations
    toast.error(message);
    return false; // Indicate failure
  }
};

// initializeAuth remains passive as AuthProvider handles initialization
export const initializeAuth = () => {
  console.log('[authHelpers] initializeAuth called (now passive, AuthProvider handles init)');
  return () => {}; // Return an empty cleanup function
};
