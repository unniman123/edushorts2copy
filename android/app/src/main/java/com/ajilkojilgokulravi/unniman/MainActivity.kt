package com.ajilkojilgokulravi.unniman

import android.content.Intent
import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

import io.branch.referral.Branch

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
  }

  override fun onStart() {
    super.onStart()
    // Initialize Branch session
    Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
      if (error != null) {
        android.util.Log.e("BranchSDK", "Branch init error: " + error.message)
      } else {
        android.util.Log.i("BranchSDK", "Branch init successful")
        if (branchUniversalObject != null) {
          android.util.Log.i("BranchSDK", "Title: " + branchUniversalObject.title)
          android.util.Log.i("BranchSDK", "CanonicalIdentifier: " + branchUniversalObject.canonicalIdentifier)
          android.util.Log.i("BranchSDK", "Metadata: " + branchUniversalObject.contentMetadata.convertToJson())
        }
        if (linkProperties != null) {
          android.util.Log.i("BranchSDK", "Channel: " + linkProperties.channel)
          android.util.Log.i("BranchSDK", "Control params: " + linkProperties.controlParams)
        }
      }
    }.withData(this.intent.data).init()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    this.intent = intent
    // If activity is in foreground (or in backstack but partially visible) launching the same
    // activity will skip onStart, so we need to handle the case here
    if (intent != null && intent.hasExtra("branch_force_new_session") && intent.getBooleanExtra("branch_force_new_session", false)) {
      Branch.sessionBuilder(this).withCallback { referringParams, error ->
        if (error != null) {
          android.util.Log.e("BranchSDK", "Branch init error: " + error.message)
        } else if (referringParams != null) {
          android.util.Log.i("BranchSDK", "Referring params: " + referringParams.toString())
        }
      }.reInit()
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
