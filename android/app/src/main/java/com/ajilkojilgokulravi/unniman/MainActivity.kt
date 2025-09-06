package com.ajilkojilgokulravi.unniman

import android.os.Build
import android.os.Bundle
import android.content.Intent
import android.view.View
import android.view.WindowInsetsController

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

// Import Branch
import io.branch.referral.Branch

// Import for edge-to-edge support
import androidx.core.view.WindowCompat
import androidx.activity.enableEdgeToEdge

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Enable edge-to-edge display for Android 15 compatibility using recommended approach
    enableEdgeToEdge()
    
    // Configure status bar appearance natively to avoid deprecated API calls
    configureStatusBarAppearance()
    
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
  }

  /**
   * Configure status bar appearance natively using WindowInsetsController
   * This replaces expo-status-bar to avoid deprecated Window color API calls
   * Equivalent to <StatusBar style="light" translucent={true} />
   * Enhanced based on Android 15 edge-to-edge video guidelines
   */
  private fun configureStatusBarAppearance() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      // Android 11+ (API 30+) - Use WindowInsetsController (modern approach)
      window.insetsController?.apply {
        // Set light status bar icons for better visibility on light backgrounds
        setSystemBarsAppearance(
          0, // Clear light status bar flags for dark icons on light background
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
        )
        
        // For three-button navigation: make navigation bar transparent
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          window.isNavigationBarContrastEnforced = false
        }
      }
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Android 6+ (API 23+) - Use systemUiVisibility (fallback)
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = 
        window.decorView.systemUiVisibility and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
        
      // Configure navigation bar for Android 8+ (API 26+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = 
          window.decorView.systemUiVisibility and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
      }
      
      // Make navigation bar transparent for three-button navigation (Android 10+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.isNavigationBarContrastEnforced = false
      }
    }
    // For Android versions below API 23, light status bar is not supported
    // The status bar will remain dark, which is acceptable for older devices
  }

  // Handle Branch links when the app opens from a link
  override fun onStart() {
    super.onStart()
    Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
      if (error != null) {
        // Log error
        return@withCallback
      }
    }.withData(this.intent.data).init()
  }

  // Forward deep link data to Branch SDK if activity is launched from a deep link
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    intent.putExtra("branch_force_new_session", true)
    setIntent(intent)
    Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
      // Branch link handling
    }.reInit()
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
