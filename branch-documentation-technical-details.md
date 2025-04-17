# Branch.io Technical Implementation Guide

## SDK Installation & Setup

### Android Setup

```gradle
// Add to your root build.gradle
allprojects {
    repositories {
        maven { url "https://maven.branch.io" }
    }
}

// Add to your app's build.gradle
dependencies {
    implementation 'io.branch.sdk.android:library:5.+'
}
```

AndroidManifest.xml configuration:
```xml
<application>
    <!-- Branch init -->
    <meta-data android:name="io.branch.sdk.BranchKey" android:value="key_live_xxxx"/>
    <meta-data android:name="io.branch.sdk.BranchKey.test" android:value="key_test_xxxx"/>
    
    <!-- Branch install referrer -->
    <receiver android:name="io.branch.referral.InstallListener" android:exported="true">
        <intent-filter>
            <action android:name="com.android.vending.INSTALL_REFERRER"/>
        </intent-filter>
    </receiver>
</application>
```

### iOS Setup

```swift
// AppDelegate.swift
import Branch

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    Branch.getInstance().initSession(launchOptions: launchOptions) { (params, error) in
        // handle deep link data
    }
    return true
}
```

## Deep Linking Implementation

### Creating Deep Links

```javascript
// Web SDK
branch.link({
    tags: ['tag1', 'tag2'],
    channel: 'facebook',
    feature: 'sharing',
    stage: 'new user',
    data: {
        custom_data: 'data',
        $desktop_url: 'http://desktop.url',
        $ios_url: 'http://ios.url',
        $android_url: 'http://android.url',
        $fallback_url: 'http://fallback.url'
    }
}, function(err, link) {
    console.log(link);
});
```

### Handling Deep Links

Android:
```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
            if (error == null) {
                // handle deep link data
                val deepLinkData = branchUniversalObject.contentMetadata.customMetadata
            }
        }.withData(this.intent.data).init()
    }
}
```

iOS:
```swift
// SceneDelegate.swift
func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    Branch.getInstance().continue(userActivity)
}

func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url {
        Branch.getInstance().application(UIApplication.shared, open: url)
    }
}
```

## Analytics Implementation

### Standard Events

```javascript
// Web
branch.logEvent(
    "PURCHASE",
    {
        "transaction_id": "12345",
        "currency": "USD",
        "revenue": 180.2,
        "shipping": 10.5,
        "tax": 13.5,
        "coupon": "WINTER2020",
        "affiliation": "xyz-affiliation",
        "description": "Preferred purchase",
        "purchase_loc": "Palo Alto",
        "store_pickup": "unavailable"
    },
    function(err) { }
);
```

Android:
```kotlin
BranchEvent("PURCHASE")
    .setTransactionID("12345")
    .setCurrency(CurrencyType.USD)
    .setRevenue(180.2)
    .setShipping(10.5)
    .setTax(13.5)
    .setCoupon("WINTER2020")
    .setAffiliation("xyz-affiliation")
    .setDescription("Preferred purchase")
    .addCustomDataProperty("purchase_loc", "Palo Alto")
    .addCustomDataProperty("store_pickup", "unavailable")
    .logEvent(context)
```

iOS:
```swift
let event = BranchEvent.standardEvent(.purchase)
event.transactionID = "12345"
event.currency = .USD
event.revenue = 180.2
event.shipping = 10.5
event.tax = 13.5
event.coupon = "WINTER2020"
event.affiliation = "xyz-affiliation"
event.eventDescription = "Preferred purchase"
event.customData["purchase_loc"] = "Palo Alto"
event.customData["store_pickup"] = "unavailable"
event.logEvent()
```

## Advanced Features

### Content Sharing

Android:
```kotlin
val buo = BranchUniversalObject()
    .setCanonicalIdentifier("item/12345")
    .setTitle("My Content Title")
    .setContentDescription("My Content Description")
    .setContentImageUrl("https://example.com/image.png")
    .setContentIndexingMode(BranchUniversalObject.CONTENT_INDEX_MODE.PUBLIC)
    .setLocalIndexMode(BranchUniversalObject.CONTENT_INDEX_MODE.PUBLIC)

val lp = LinkProperties()
    .setChannel("facebook")
    .setFeature("sharing")
    .setCampaign("content 123")
    .setStage("new user")
    .addControlParameter("\$desktop_url", "http://example.com/desktop")

buo.generateShortUrl(this, lp) { url, error ->
    if (error == null) {
        Log.i("BRANCH", "Got link: $url")
    }
}
```

### QR Code Generation

```javascript
// Web SDK
branch.qrCode({
    width: 300,
    centerImage: "https://example.com/logo.png",
    backgroundColor: "#ffffff",
    foregroundColor: "#000000",
    imageFormat: "PNG",
    data: {
        "$canonical_url": "https://example.com/content/123",
        "custom_data": "data"
    }
}, function(err, qrCode) {
    console.log(qrCode.url);
});
```

## Troubleshooting Guide

### Universal Links Issues

1. Check Associated Domains configuration:
```xml
<!-- iOS entitlements -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:example.app.link</string>
    <string>applinks:example-alternate.app.link</string>
</array>
```

2. Verify AASA file is accessible:
```bash
curl https://example.app.link/.well-known/apple-app-site-association
```

### App Links Issues

1. Verify Digital Asset Links file:
```bash
curl https://example.app.link/.well-known/assetlinks.json
```

2. Check Android manifest:
```xml
<activity>
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="example.app.link" />
    </intent-filter>
</activity>
```

## Testing Tools

### Debug Mode

Android:
```kotlin
Branch.enableDebugMode()
```

iOS:
```swift
Branch.getInstance().enableDebugMode()
```

### Test Deep Links

1. Universal Link:
```
https://example.app.link/content/123
```

2. Custom Scheme:
```
myapp://content/123
```

3. Test Branch Key:
```
key_test_xxxxxxxxxxxx
```

## Data & Privacy

### GDPR Compliance

```javascript
// Web SDK
branch.trackingDisabled = true; // Disable tracking
branch.trackingDisabled = false; // Enable tracking
```

Android:
```kotlin
Branch.getInstance().disableTracking(true) // Disable tracking
Branch.getInstance().disableTracking(false) // Enable tracking
```

iOS:
```swift
Branch.getInstance().disableTracking(true) // Disable tracking
Branch.getInstance().disableTracking(false) // Enable tracking
```

## Best Practices Implementation

### Error Handling

```kotlin
// Android
Branch.sessionBuilder(this).withCallback { branchUniversalObject, linkProperties, error ->
    when {
        error != null -> {
            when (error.errorCode) {
                BranchError.ERR_NO_CONNECTIVITY -> // Handle no internet
                BranchError.ERR_BRANCH_KEY_INVALID -> // Handle invalid key
                else -> // Handle other errors
            }
        }
        branchUniversalObject != null -> {
            try {
                // Process deep link data
            } catch (e: Exception) {
                // Handle processing errors
            }
        }
    }
}.init()
```

### Retry Logic

```kotlin
private fun initBranch(maxRetries: Int = 3, currentRetry: Int = 0) {
    Branch.sessionBuilder(this).withCallback { _, _, error ->
        if (error != null && currentRetry < maxRetries) {
            Handler().postDelayed({
                initBranch(maxRetries, currentRetry + 1)
            }, 1000 * (currentRetry + 1))
        }
    }.init()
}
