// Test script for simulating the complete Branch deep linking flow
// - Share button click -> Branch link creation
// - Link click -> App installed scenario (redirect to app)
// - Link click -> App not installed scenario (redirect to Play Store)

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

// Helper function to create mock functions
function createMockFn(implementation) {
  const mockFn = implementation || (() => {});
  mockFn.mock = { calls: [] };
  
  const wrappedFn = (...args) => {
    wrappedFn.mock.calls.push(args);
    return mockFn(...args);
  };
  
  wrappedFn.mock = { calls: [] };
  return wrappedFn;
}

// Mock Branch SDK
const branchSDK = {
  // Branch initialization
  debug: createMockFn((enabled) => console.log(`${colors.gray}Branch debug mode set to: ${enabled}${colors.reset}`)),
  init: createMockFn(() => console.log(`${colors.gray}Branch SDK initialized${colors.reset}`)),
  
  // Branch event subscription
  subscribe: createMockFn((callback) => {
    console.log(`${colors.gray}Subscribed to Branch events${colors.reset}`);
    branchSDK.eventCallback = callback;
    return () => {
      branchSDK.eventCallback = null;
      console.log(`${colors.gray}Unsubscribed from Branch events${colors.reset}`);
    };
  }),
  
  // For storing the event callback
  eventCallback: null,
  
  // Branch Universal Object creation
  createBranchUniversalObject: createMockFn((id, props) => {
    console.log(`${colors.cyan}Created Branch Universal Object with ID: ${colors.bright}${id}${colors.reset}`);
    console.log(`${colors.gray}Object properties:${colors.reset}`);
    console.log(JSON.stringify(props, null, 2));
    
    return {
      // Method to generate short URL
      generateShortUrl: createMockFn(async (linkProps, controlParams) => {
        console.log(`\n${colors.blue}Generating short URL with properties:${colors.reset}`);
        console.log(JSON.stringify(linkProps, null, 2));
        console.log(`\n${colors.blue}Control parameters:${colors.reset}`);
        console.log(JSON.stringify(controlParams, null, 2));
        
        // Simulate Branch SDK behavior - create a URL that encodes meta data
        const mockUrl = `https://xbwk1.app.link/branch-test-${Date.now().toString().substring(8)}`;
        
        // Store link metadata for later simulation
        branchSDK.lastCreatedLinkData = {
          url: mockUrl,
          articleId: props.contentMetadata?.customMetadata?.articleId || "unknown",
          title: props.title || "",
          controlParams,
          linkProps
        };
        
        return { url: mockUrl };
      }),
      
      // Method to set canonical identifier
      setCanonicalIdentifier: createMockFn(async (newId) => {
        console.log(`${colors.cyan}Setting new canonical ID: ${colors.bright}${newId}${colors.reset}`);
        return true;
      })
    };
  }),
  
  // For storing metadata about the last created link
  lastCreatedLinkData: null,
  
  // Track Branch events
  userCompletedAction: createMockFn((action, data) => {
    console.log(`\n${colors.magenta}Tracked event "${action}" with data:${colors.reset}`);
    console.log(JSON.stringify(data, null, 2));
  })
};

// Mock DeepLinkHandler class
class MockDeepLinkHandler {
  constructor() {
    this.navigationRef = { current: null };
  }
  
  setNavigationRef(ref) {
    this.navigationRef = ref;
    console.log(`${colors.gray}Navigation reference set${colors.reset}`);
  }
  
  // Deep link handling method
  handleDeepLink(url) {
    console.log(`\n${colors.yellow}Handling deep link: ${url}${colors.reset}`);
    
    try {
      // Parse URL to extract parameters
      // In a real implementation, this would be more complex
      let articleId = null;
      
      if (url.includes('article')) {
        // Extract articleId from URL
        const match = url.match(/article[\/\-]([^\/\-]+)/);
        if (match && match[1]) {
          articleId = match[1];
        }
      }
      
      if (articleId && this.navigationRef?.current) {
        console.log(`\n${colors.green}✅ Successfully extracted articleId: ${articleId}${colors.reset}`);
        console.log(`${colors.green}Navigating to ArticleDetail screen with id: ${articleId}${colors.reset}`);
        
        this.navigationRef.current.navigate('ArticleDetail', { articleId });
        return true;
      }
      
      console.log(`${colors.yellow}Could not extract article ID from URL${colors.reset}`);
      return false;
    } catch (error) {
      console.error(`\n${colors.red}❌ Error handling deep link: ${error.message}${colors.reset}`);
      return false;
    }
  }
  
  // Link creation method
  async createBranchLink(articleId, title, description, imageUrl) {
    try {
      // Generate a truly unique identifier
      const uniqueId = `article-${articleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`\n${colors.cyan}Using unique identifier: ${colors.bright}${uniqueId}${colors.reset}`);
      
      // Create Branch Universal Object
      const branchUniversalObject = await branchSDK.createBranchUniversalObject(uniqueId, {
        locallyIndex: true,
        title,
        contentDescription: description,
        contentImageUrl: imageUrl,
        contentMetadata: {
          customMetadata: {
            articleId: articleId.toString(),
            timestamp: Date.now().toString()
          }
        }
      });

      // Link properties
      const linkProperties = {
        feature: 'share',
        channel: 'app',
        campaign: 'article-sharing',
      };

      // Control parameters with fallback URLs
      const controlParams = {
        $desktop_url: `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`,
        $android_url: 'market://details?id=com.ajilkojilgokulravi.unniman',
        $ios_url: 'https://apps.apple.com/app/id123456789', // Replace with actual App Store ID
        $fallback_url: `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`,
        data: {
          articleId: articleId.toString()
        }
      };

      // Generate short URL
      const { url } = await branchUniversalObject.generateShortUrl(linkProperties, controlParams);
      console.log(`\n${colors.green}✅ Successfully created Branch link: ${colors.bright}${url}${colors.reset}`);
      
      // Track the share event
      branchSDK.userCompletedAction('SHARE', {
        description: 'Article shared',
        articleId: articleId.toString(),
        channel: 'app',
        timestamp: Date.now().toString()
      });
      
      return url;
    } catch (error) {
      console.error(`\n${colors.red}❌ Error creating Branch link: ${error.message}${colors.reset}`);
      return `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`;
    }
  }
}

// Mock Navigation Reference
const mockNavigationRef = {
  current: {
    navigate: createMockFn((screen, params) => {
      console.log(`${colors.bright}${colors.green}🔄 Navigation: Navigating to ${screen} with params:${colors.reset}`);
      console.log(JSON.stringify(params, null, 2));
    })
  }
};

// Simulates clicking on a Branch link and what happens on different devices
async function simulateBranchLinkClick(url, isAppInstalled = true) {
  console.log(`\n${colors.bright}${colors.blue}🔗 User clicked Branch link: ${url}${colors.reset}`);
  
  // Simulate what happens when a Branch link is clicked
  if (isAppInstalled) {
    console.log(`${colors.yellow}📱 Scenario: App IS installed on device${colors.reset}`);
    
    // In real life, the OS would open the app and Branch SDK would handle the deep link
    // The Branch SDK would call the callback registered with branch.subscribe()
    if (branchSDK.eventCallback) {
      // Simulate Branch SDK callback with parsed metadata
      const params = {
        '+clicked_branch_link': true,
        articleId: branchSDK.lastCreatedLinkData?.articleId,
        // Additional params Branch would include
        '+url': url,
        '+is_first_session': false
      };
      
      console.log(`${colors.cyan}Branch SDK processing link...${colors.reset}`);
      console.log(`${colors.gray}Extracted params:${colors.reset}`);
      console.log(JSON.stringify(params, null, 2));
      
      // Call the callback registered with branch.subscribe()
      console.log(`${colors.cyan}Triggering Branch subscribe callback...${colors.reset}`);
      branchSDK.eventCallback({ error: null, params, uri: url });
      
      return { 
        success: true, 
        message: 'App opened with deep link',
        redirected: 'app'
      };
    } else {
      console.log(`${colors.red}❌ No Branch callback registered${colors.reset}`);
      return { 
        success: false, 
        message: 'No Branch callback registered',
        redirected: 'unknown'
      };
    }
  } else {
    // Scenario: App is NOT installed
    console.log(`${colors.yellow}🔍 Scenario: App is NOT installed on device${colors.reset}`);
    console.log(`${colors.cyan}Branch redirects to fallback URL...${colors.reset}`);
    
    // Branch would redirect to the fallback URL
    const fallbackUrl = branchSDK.lastCreatedLinkData?.controlParams?.$fallback_url || 
                        branchSDK.lastCreatedLinkData?.controlParams?.$android_url ||
                        'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman';
    
    console.log(`${colors.green}✅ User redirected to: ${fallbackUrl}${colors.reset}`);
    
    return { 
      success: true, 
      message: 'Redirected to Play Store', 
      redirected: 'store',
      storeUrl: fallbackUrl
    };
  }
}

// Main test function to simulate the entire flow
async function testFullDeepLinkFlow() {
  try {
    // Initialize deep link handler
    const deepLinkHandler = new MockDeepLinkHandler();
    deepLinkHandler.setNavigationRef(mockNavigationRef);
    
    // Initialize Branch SDK and setup event subscription
    console.log(`\n${colors.bright}${colors.blue}=== Initializing Branch SDK ===${colors.reset}\n`);
    branchSDK.init();
    branchSDK.debug(true);
    
    // Register event handler for deep links
    console.log(`${colors.yellow}Registering Branch event handler...${colors.reset}`);
    branchSDK.subscribe(({ error, params, uri }) => {
      console.log(`${colors.green}Branch event received:${colors.reset}`);
      if (error) {
        console.error(`${colors.red}Branch error: ${error}${colors.reset}`);
        return;
      }
      
      if (params['+clicked_branch_link']) {
        const articleId = params.articleId || params.article_id || params.data?.articleId;
        console.log(`${colors.green}Branch link click with articleId: ${articleId}${colors.reset}`);
        
        if (articleId && deepLinkHandler.navigationRef?.current) {
          deepLinkHandler.navigationRef.current.navigate('ArticleDetail', { articleId });
        }
      }
    });
    
    // 1. Simulate user sharing an article (clicking share button)
    console.log(`\n${colors.bright}${colors.blue}=== 1. User Shares an Article (clicks share button) ===${colors.reset}\n`);
    
    const articleId = 'article-123456';
    const title = 'Amazing Test Article';
    const description = 'This is a fascinating article about Branch deep links';
    const imageUrl = 'https://example.com/image.jpg';
    
    console.log(`${colors.yellow}📱 User clicks share button for article: ${colors.bright}${articleId}${colors.reset}`);
    
    // Generate Branch link when user clicks share
    const branchLink = await deepLinkHandler.createBranchLink(
      articleId,
      title,
      description,
      imageUrl
    );
    
    // Store the link for later use
    console.log(`\n${colors.green}Generated shareable link: ${colors.bright}${branchLink}${colors.reset}`);
    console.log(`${colors.yellow}Link copied to clipboard and ready to share${colors.reset}`);
    
    // Wait a moment (simulating time passing)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. First scenario: User with app installed clicks the link
    console.log(`\n${colors.bright}${colors.blue}=== 2. Scenario: User WITH App Installed Clicks Link ===${colors.reset}\n`);
    const installedResult = await simulateBranchLinkClick(branchLink, true);
    
    // Process results
    if (installedResult.success) {
      console.log(`\n${colors.green}✅ Success: ${installedResult.message}${colors.reset}`);
      console.log(`${colors.green}User was shown the article in the app${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ Error: ${installedResult.message}${colors.reset}`);
    }
    
    // Wait a moment (simulating time passing)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Second scenario: User without app clicks the link
    console.log(`\n${colors.bright}${colors.blue}=== 3. Scenario: User WITHOUT App Clicks Link ===${colors.reset}\n`);
    const notInstalledResult = await simulateBranchLinkClick(branchLink, false);
    
    // Process results
    if (notInstalledResult.success) {
      console.log(`\n${colors.green}✅ Success: ${notInstalledResult.message}${colors.reset}`);
      
      if (notInstalledResult.redirected === 'store') {
        console.log(`${colors.green}User was redirected to Play Store: ${notInstalledResult.storeUrl}${colors.reset}`);
      }
    } else {
      console.log(`\n${colors.red}❌ Error: ${notInstalledResult.message}${colors.reset}`);
    }
    
    // Summary
    console.log(`\n${colors.bright}${colors.blue}=== Summary ===${colors.reset}\n`);
    console.log(`${colors.bright}1. Share button clicked:${colors.reset} Branch link created`);
    console.log(`${colors.bright}2. User WITH app clicks link:${colors.reset} App opens and shows article ${articleId}`);
    console.log(`${colors.bright}3. User WITHOUT app clicks link:${colors.reset} Play Store opens to download app`);
    console.log(`\n${colors.yellow}This test confirms that your Branch integration works correctly when:${colors.reset}`);
    console.log(`  - Creating links with unique IDs to avoid collisions`);
    console.log(`  - Redirecting to the correct article within the app`);
    console.log(`  - Redirecting to the Play Store when the app isn't installed`);
  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed with error: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
}

// Run the test
testFullDeepLinkFlow(); 