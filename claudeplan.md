Expo Deep Linking Implementation Plan
Overview
This plan outlines how to implement deep linking in a React Native Expo app using EAS (Expo Application Services) for automated verification file hosting. When users share news links from your app, recipients will be directed to the specific content in-app (if installed) or to the app store (if not installed).
Step 1: Set Up EAS

Install EAS CLI:
bashnpm install -g eas-cli

Log in to your Expo account:
basheas login

Initialize EAS in your project:
basheas init
This adds a project ID to your app.json.

Step 2: Configure app.json
Update your app.json with deep linking configurations:
json{
  "expo": {
    "name": "YourNewsApp",
    "slug": "your-news-app",
    "scheme": "yournewsapp",
    "android": {
      "package": "com.yourcompany.yournewsapp"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.yournewsapp"
    },
    "plugins": [
      "expo-linking"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id" // Added by eas init
      }
    }
  }
}
Step 3: Create eas.json Configuration
Create an eas.json file in your project root:
json{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
Step 4: Configure Deep Linking
Run the EAS Update configuration command:
basheas update:configure
When prompted about enabling deep linking, select "Yes". This sets up the necessary configuration.
Step 5: Implement Link Handling in Your App

Install the expo-linking package if not already installed:
bashexpo install expo-linking

Create a link handler in your app (typically in App.js or navigation setup):

javascriptimport * as Linking from 'expo-linking';
import { useEffect } from 'react';

function App() {
  // Set up URL prefix for your deep links
  const prefix = Linking.createURL('/');
  
  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Handle deep links that launched the app
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    };
    
    getInitialURL();
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  const handleDeepLink = ({ url }) => {
    // Parse the URL to extract info (like news ID)
    const parsedUrl = Linking.parse(url);
    
    // Extract the news ID from the path
    if (parsedUrl.path && parsedUrl.path.includes('news')) {
      const newsId = extractNewsIdFromPath(parsedUrl.path);
      if (newsId) {
        // Navigate to the specific news article
        navigation.navigate('NewsDetail', { id: newsId });
      }
    }
  };
  
  const extractNewsIdFromPath = (path) => {
    // Parse paths like "/news/12345"
    const matches = path.match(/\/news\/([^\/]+)/);
    return matches ? matches[1] : null;
  };
  
  // Your app navigation setup here...
}
Step 6: Create Share Function
Implement a function to generate and share news links:
javascriptimport { Share } from 'react-native';
import * as Linking from 'expo-linking';

const shareNewsArticle = async (newsItem) => {
  // Create a URL using Expo's Linking API
  const shareUrl = Linking.createURL(`news/${newsItem.id}`);
  
  try {
    await Share.share({
      message: `Check out this news: ${newsItem.title} ${shareUrl}`,
      url: shareUrl, // iOS only
    });
  } catch (error) {
    console.error('Error sharing news:', error);
  }
};
Step 7: Build Your App with EAS

Start a build for the platforms you need:
basheas build --platform all

This triggers EAS to:

Generate the verification files (assetlinks.json and apple-app-site-association)
Host these files at https://your-app-slug.exp.direct/.well-known/
Configure your app to work with these hosted files



Step 8: Verify Your Deep Link Setup

Check that verification files are hosted correctly:
https://your-app-slug.exp.direct/.well-known/assetlinks.json
https://your-app-slug.exp.direct/.well-known/apple-app-site-association

Test your deep links by:

Generating a link with Linking.createURL('news/12345')
Opening this link on a device with your app installed
Opening the link on a device without your app



Step 9: Implement UI Component for Sharing
Add a share button to your news screens:
javascriptimport { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NewsDetailScreen = ({ newsItem }) => {
  return (
    <View style={styles.container}>
      {/* News content here */}
      
      <TouchableOpacity 
        style={styles.shareButton}
        onPress={() => shareNewsArticle(newsItem)}
      >
        <Ionicons name="share-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};
Additional Notes

No Manual Verification Files Needed: EAS handles generating and hosting the verification files automatically.
Custom Domains: If you want to use your own domain instead of exp.direct:

Add a custom domain in the Expo dashboard
Update your app.json with:
json"expo": {
  "associatedDomains": ["applinks:yourdomain.com"]
}

Follow the DNS setup instructions in the Expo dashboard


Testing Deep Links:

On iOS simulator: xcrun simctl openurl booted your-scheme://news/12345
On Android emulator: adb shell am start -W -a android.intent.action.VIEW -d "your-scheme://news/12345" com.yourcompany.yournewsapp
Or send yourself the link via email/message


Troubleshooting:

Verify build setup with eas diagnostics
Check link configuration with expo-cli url:login
Test parsing with Linking.parse(url) and log results


Production Considerations:

Link URLs persist even if you rebuild your app
For major changes to linking structure, consider a migration strategy...




please read this plan thoroughly as well .