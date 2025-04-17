# Add project specific ProGuard rules here.

# Branch SDK
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.** { *; }
-keep class io.branch.** { *; }
-keep class com.huawei.hms.** { *; }
-keep class com.huawei.hianalytics.** { *; }
-keep class store.galaxy.samsung.** { *; }

# Branch specific rules
-dontwarn com.android.installreferrer.api.**
-dontwarn io.branch.**

# Samsung Galaxy Store Referrer
-keep class store.galaxy.samsung.installreferrer.** { *; }
-keep interface store.galaxy.samsung.installreferrer.** { *; }

# Huawei HMS Core
-keep class com.huawei.hms.ads.** { *; }
-keep interface com.huawei.hms.ads.** { *; }

# Google Play Services
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient {
    com.google.android.gms.ads.identifier.AdvertisingIdClient$Info getAdvertisingIdInfo(android.content.Context);
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient$Info {
    java.lang.String getId();
    boolean isLimitAdTrackingEnabled();
}
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
