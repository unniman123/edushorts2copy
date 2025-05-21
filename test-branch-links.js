// Test script for verifying that Branch link creation uses unique IDs
// This helps prevent the "Unable to create a URL with that alias" error

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Branch Link Testing Script
const fetch = require('node-fetch');

// Branch API key (use the same key configured in your app)
const BRANCH_KEY = 'key_live_lsvfoHjZGCGcuEseqCIYAompzweTIc13';

// Test article data
const testArticle = {
  id: 'test-article-123',
  title: 'Test Article',
  summary: 'This is a test article for Branch link testing',
  image_path: 'https://example.com/test-image.jpg'
};

/**
 * Creates a Branch link using the Branch API directly
 * This simulates what your app would do but without needing to run the app
 */
async function createBranchLink(article) {
  console.log('Creating Branch link for article:', article.id);
  
  // Generate a unique alias using timestamp to avoid conflicts
  const timestamp = new Date().getTime();
  const uniqueId = `article-${article.id}-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
  
  const data = {
    branch_key: BRANCH_KEY,
    data: {
      '$og_title': article.title,
      '$og_description': article.summary,
      '$og_image_url': article.image_path,
      '$desktop_url': `https://edushorts.com/articles/${article.id}`,
      '$android_url': 'market://details?id=com.ajilkojilgokulravi.unniman',
      '$ios_url': 'itms-apps://itunes.apple.com/app/your-app-id',
      'articleId': article.id,
      'article_id': article.id,
      'feature': 'share',
      'channel': 'article',
      'campaign': 'article-sharing'
    },
    alias: uniqueId, // Use the unique ID as alias
    type: 2 // 2 is for one-time use links
  };

  try {
    const response = await fetch('https://api2.branch.io/v1/url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error creating Branch link:', result);
      // If there's an error with the alias, we could retry with a new unique ID
      if (result.error.code === 'already_exists') {
        console.log('Link with this alias already exists, retrying with a new ID...');
        // Retry with new ID by recursive call
        return createBranchLink(article);
      }
      return null;
    }
    
    console.log('Successfully created Branch link:', result.url);
    return result.url;
  } catch (error) {
    console.error('Network error creating Branch link:', error);
    return null;
  }
}

// Main test function
async function testBranchLinks() {
  console.log('Starting Branch link test...');
  
  try {
    // Test link creation
    const branchLink = await createBranchLink(testArticle);
    
    if (branchLink) {
      console.log('TEST PASSED: Branch link creation successful');
      console.log('Link:', branchLink);
      console.log('\nTo test this link:');
      console.log('1. Click the link on a mobile device');
      console.log('2. If app is installed, it should open to the article detail');
      console.log('3. If app is not installed, it should redirect to Play Store');
    } else {
      console.log('TEST FAILED: Unable to create Branch link');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testBranchLinks();
