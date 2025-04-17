package com.ajilkojilgokulravi.unniman

import android.os.Build
import android.os.Bundle
import android.content.Intent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import io.branch.referral.Branch
import io.branch.referral.BranchError
import io.branch.referral.util.BranchLogger
import io.branch.referral.validators.IntegrationValidator

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme)
    super.onCreate(null)

    // Initialize Branch session
    Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
      if (error != null) {
        BranchLogger.e("Branch Error: " + error.message)
      } else {
        BranchLogger.i("Branch: session initialized")
        // Handle deep link data if needed
        branchUniversalObject?.contentMetadata?.customMetadata?.let { metadata ->
          // Log metadata for debugging
          BranchLogger.i("Branch: metadata = $metadata")
        }
      }
    }.withData(this.intent?.data).init()
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    this.intent = intent

    // Handle Branch deep links in onNewIntent
    if (intent != null && intent.hasExtra("branch_force_new_session") && intent.getBooleanExtra("branch_force_new_session", false)) {
      Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
        if (error != null) {
          BranchLogger.e("Branch Error: " + error.message)
        } else {
          BranchLogger.i("Branch: session re-initialized")
        }
      }.reInit()
    }
  }

  override fun onStart() {
    super.onStart()

    // Run Branch Integration Validator
    if (BuildConfig.DEBUG) {
      // This will validate your Branch SDK integration
      // Check your logcat output for validation results
      IntegrationValidator.validate(this)
      BranchLogger.i("Branch: Integration validation executed")
    }

    Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
      if (error != null) {
        BranchLogger.e("Branch Error: " + error.message)
      } else {
        BranchLogger.i("Branch: onStart session initialized")
      }
    }.init()
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
