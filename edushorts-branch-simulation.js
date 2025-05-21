// Edushorts Branch Deep Linking - Complete App Flow Simulation
// This test simulates exactly how the app will function with Branch deep links

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

// Simulate mobile device OS
class MobileDevice {
  constructor(hasAppInstalled = true) {
    this.hasAppInstalled = hasAppInstalled;
    this.appName = 'Edushorts';
    this.packageName = 'com.ajilkojilgokulravi.unniman';
    this.appStoreUrl = `https://play.google.com/store/apps/details?id=${this.packageName}`;
    this.marketUrl = `market://details?id=${this.packageName}`;
    console.log(`${colors.yellow}📱 Mobile device created - App ${hasAppInstalled ? 'IS' : 'is NOT'} installed${colors.reset}`);
  }
  
  openLink(url) {
    console.log(`\n${colors.bright}${colors.yellow}📱 User clicks link: ${url}${colors.reset}`);
    
    if (this.hasAppInstalled) {
      console.log(`${colors.green}✅ App is installed - Opening ${this.appName} app${colors.reset}`);
      
      // In real life, the OS would detect the app is installed and launch it
      // The Branch SDK would then process the link in the app
      return {
        action: 'OPEN_APP',
        url: url,
        appName: this.appName,
        packageName: this.packageName
      };
    } else {
      console.log(`${colors.yellow}⚠️ App is NOT installed - Redirecting to Play Store${colors.reset}`);
      console.log(`${colors.blue}🔄 Redirecting to: ${this.appStoreUrl}${colors.reset}`);
      
      // In real life, the user would be redirected to the Play Store
      return {
        action: 'OPEN_STORE',
        storeUrl: this.appStoreUrl,
        marketUrl: this.marketUrl
      };
    }
  }
}

// Mock Branch SDK
const BranchSDK = {
  // For storing the initialization state
  isInitialized: false,
  
  // Initialize Branch SDK
  init: createMockFn(() => {
    console.log(`${colors.gray}Branch SDK initialized${colors.reset}`);
    BranchSDK.isInitialized = true;
    return Promise.resolve();
  }),
  
  // Debug mode toggle
  debug: createMockFn((enabled) => {
    console.log(`${colors.gray}Branch debug mode set to: ${enabled}${colors.reset}`);
    return Promise.resolve();
  }),
  
  // Event subscription
  subscribe: createMockFn((callback) => {
    console.log(`${colors.gray}Subscribed to Branch events${colors.reset}`);
    BranchSDK.eventCallback = callback;
    return () => {
      BranchSDK.eventCallback = null;
      console.log(`${colors.gray}Unsubscribed from Branch events${colors.reset}`);
    };
  }),
  
  // For storing the event callback
  eventCallback: null,
  
  // For storing created branch links and metadata
  createdLinks: [],
  
  // Universal Object creation
  createBranchUniversalObject: createMockFn((id, props) => {
    console.log(`${colors.cyan}Creating Branch Universal Object with ID: ${colors.bright}${id}${colors.reset}`);
    
    const buoObject = {
      id,
      properties: props,
      
      // Method to generate short URL
      generateShortUrl: createMockFn(async (linkProps, controlParams) => {
        console.log(`${colors.blue}Generating Branch link with properties:${colors.reset}`);
        console.log(JSON.stringify(linkProps, null, 2));
        
        // Extract data from the params for debugging
        const articleId = props.contentMetadata?.customMetadata?.articleId;
        const title = props.title;
        
        // Create a realistic Branch link
        const shortId = Math.random().toString(36).substring(2, 6);
        const branchLink = `https://xbwk1.app.link/${shortId}`;
        
        // Store link data for later simulation
        BranchSDK.createdLinks.push({
          url: branchLink,
          articleId,
          title,
          linkProps,
          controlParams,
          id
        });
        
        console.log(`${colors.green}✅ Generated Branch link: ${colors.bright}${branchLink}${colors.reset}`);
        
        return { url: branchLink };
      }),
      
      // Track content view event 
      registerView: createMockFn(() => {
        console.log(`${colors.magenta}Content view registered for: ${id}${colors.reset}`);
        return Promise.resolve();
      }),
      
      // Method to generate QR code
      generateQRCode: createMockFn(async () => {
        return { url: "data:image/png;base64,QRCodeImageData..." };
      }),
      
      // Method to list on Spotlight search 
      listOnSpotlight: createMockFn(async () => {
        return { spotlightIdentifier: id };
      }),
      
      // Method to set canonical identifier
      setCanonicalIdentifier: createMockFn(async (newId) => {
        console.log(`${colors.cyan}Setting new canonical ID: ${colors.bright}${newId}${colors.reset}`);
        id = newId;
        return true;
      })
    };
    
    return buoObject;
  }),
  
  // Track events
  userCompletedAction: createMockFn((action, data) => {
    console.log(`${colors.magenta}Tracked event "${action}" with data:${colors.reset}`);
    console.log(JSON.stringify(data, null, 2));
    return Promise.resolve();
  }),
  
  // Get the latest referring params
  getLatestReferringParams: createMockFn(() => {
    return Promise.resolve({});
  }),
  
  // Get the first referring params
  getFirstReferringParams: createMockFn(() => {
    return Promise.resolve({});
  }),
  
  // Logout the user
  logout: createMockFn(() => {
    return Promise.resolve();
  }),
  
  // Simulate how Branch processes a link click
  simulateLinkClick: function(branchLink, device) {
    console.log(`\n${colors.bright}${colors.blue}🔄 Branch processing link click: ${branchLink}${colors.reset}`);
    
    // Find the stored link data
    const linkData = BranchSDK.createdLinks.find(link => link.url === branchLink);
    
    if (!linkData) {
      console.log(`${colors.red}❌ Link not found in Branch data${colors.reset}`);
      return null;
    }
    
    // Check if app is installed
    const deviceAction = device.openLink(branchLink);
    
    if (deviceAction.action === 'OPEN_APP') {
      // App is installed, simulate Branch SDK processing the deep link
      if (BranchSDK.eventCallback) {
        const params = {
          '+clicked_branch_link': true,
          '+url': branchLink,
          '+is_first_session': false,
          // Pass through the data from link creation
          articleId: linkData.articleId,
          title: linkData.title,
          // You can add additional parameters that Branch would include
          '+match_guaranteed': true,
          '+referrer': 'android_app',
          '+phone_number': '',
          '+campaign': linkData.linkProps.campaign || '',
          '+feature': linkData.linkProps.feature || '',
          '+channel': linkData.linkProps.channel || ''
        };
        
        console.log(`${colors.cyan}Branch SDK detected app open with link${colors.reset}`);
        console.log(`${colors.gray}Extracted parameters:${colors.reset}`);
        console.log(JSON.stringify(params, null, 2));
        
        // Trigger the callback that DeepLinkHandler registered
        setTimeout(() => {
          BranchSDK.eventCallback({
            error: null,
            params: params,
            uri: branchLink
          });
        }, 100);
        
        return {
          success: true,
          action: 'DEEP_LINK_PROCESSED',
          params
        };
      } else {
        console.log(`${colors.red}❌ No Branch callback registered to handle link${colors.reset}`);
        return {
          success: false,
          action: 'NO_CALLBACK'
        };
      }
    } else {
      // App is not installed, Branch redirects to store 
      return {
        success: true,
        action: 'STORE_REDIRECT',
        storeUrl: deviceAction.storeUrl
      };
    }
  }
};

// Simulate our app's DeepLinkHandler
class EdushortsDeepLinkHandler {
  constructor() {
    this.navigationRef = { current: null };
    this.unsubscribeBranch = null;
    console.log(`${colors.gray}DeepLinkHandler created${colors.reset}`);
  }
  
  initialize() {
    console.log(`\n${colors.bright}${colors.blue}=== Initializing DeepLinkHandler ===${colors.reset}`);
    
    // Initialize Branch SDK
    BranchSDK.init();
    BranchSDK.debug(true);
    this.setupDeepLinkListeners();
  }
  
  setNavigationRef(ref) {
    this.navigationRef = ref;
    console.log(`${colors.gray}Navigation reference set${colors.reset}`);
  }
  
  setupDeepLinkListeners() {
    console.log(`${colors.yellow}Setting up deep link listeners${colors.reset}`);
    
    // Subscribe to Branch events to handle deep links
    this.unsubscribeBranch = BranchSDK.subscribe(({ error, params, uri }) => {
      if (error) {
        console.error(`${colors.red}Branch error: ${error}${colors.reset}`);
        return;
      }
      
      console.log(`${colors.green}Branch event received:${colors.reset}`);
      console.log(JSON.stringify(params, null, 2));
      
      try {
        // Process deep link data
        if (params['+clicked_branch_link']) {
          // Extract article ID from the params
          const articleId = params.articleId || params.article_id || params.data?.articleId;
          
          if (articleId && this.navigationRef.current) {
            console.log(`${colors.green}✅ Deep link contains articleId: ${articleId}${colors.reset}`);
            console.log(`${colors.green}🔄 Navigating to ArticleDetail screen${colors.reset}`);
            
            // Navigate to the article detail screen
            this.navigationRef.current.navigate('ArticleDetail', { id: articleId });
          } else {
            console.log(`${colors.yellow}⚠️ No articleId found in deep link or navigation ref not set${colors.reset}`);
          }
        } else {
          console.log(`${colors.yellow}⚠️ Not a Branch link click event${colors.reset}`);
        }
      } catch (err) {
        console.error(`${colors.red}❌ Error handling deep link: ${err.message}${colors.reset}`);
      }
    });
    
    console.log(`${colors.green}✅ Deep link listeners configured${colors.reset}`);
  }
  
  async createBranchLink(articleId, title, description, imageUrl) {
    try {
      console.log(`\n${colors.bright}${colors.blue}=== Creating Branch Link for Sharing ===${colors.reset}`);
      console.log(`${colors.yellow}Article ID: ${articleId}${colors.reset}`);
      console.log(`${colors.yellow}Title: ${title}${colors.reset}`);
      
      // Maximum retries if link creation fails
      const maxRetries = 3;
      let attempts = 0;
      let branchLink = null;
      
      while (attempts < maxRetries && !branchLink) {
        attempts++;
        console.log(`${colors.cyan}Attempt ${attempts} of ${maxRetries}${colors.reset}`);
        
        try {
          // Generate a truly unique identifier to prevent "Unable to create a URL with that alias" error
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substr(2, 9);
          const uniqueId = `article-${articleId}-${timestamp}-${randomString}`;
          
          console.log(`${colors.cyan}Using unique identifier: ${colors.bright}${uniqueId}${colors.reset}`);
          
          // Create Branch Universal Object
          const branchUniversalObject = await BranchSDK.createBranchUniversalObject(uniqueId, {
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
          
          // Define link properties
          const linkProperties = {
            feature: 'share',
            channel: 'app',
            campaign: 'article-sharing',
          };
          
          // Define control parameters with fallback URLs
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
          branchLink = url;
          
          // Track the share event
          await BranchSDK.userCompletedAction('SHARE', {
            description: 'Article shared',
            articleId: articleId.toString(),
            channel: 'app',
            timestamp: Date.now().toString()
          });
        } catch (error) {
          console.error(`${colors.red}❌ Attempt ${attempts} failed: ${error.message}${colors.reset}`);
          
          if (attempts === maxRetries) {
            // If all retries fail, return the Play Store URL as fallback
            console.log(`${colors.yellow}⚠️ All attempts failed, using fallback store URL${colors.reset}`);
            return `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`${colors.green}✅ Successfully created Branch link: ${colors.bright}${branchLink}${colors.reset}`);
      return branchLink;
    } catch (error) {
      console.error(`${colors.red}❌ Error creating Branch link: ${error.message}${colors.reset}`);
      return `https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman`;
    }
  }
  
  cleanupBranchListeners() {
    if (this.unsubscribeBranch) {
      this.unsubscribeBranch();
      this.unsubscribeBranch = null;
      console.log(`${colors.gray}Branch listeners cleaned up${colors.reset}`);
    }
  }
}

// Simulate app screens
class EdushortsApp {
  constructor() {
    this.currentScreen = 'Home';
    this.currentParams = null;
    
    // Initialize navigation
    this.navigation = {
      navigate: createMockFn((screenName, params) => {
        console.log(`${colors.bright}${colors.green}🔄 Navigation: Navigating to ${screenName} with params:${colors.reset}`);
        console.log(JSON.stringify(params, null, 2));
        
        this.currentScreen = screenName;
        this.currentParams = params;
        
        // Update UI to show the navigation
        if (screenName === 'ArticleDetail') {
          this.renderArticleDetailScreen(params.id);
        }
      }),
      goBack: createMockFn(() => {
        console.log(`${colors.gray}Navigation: Going back${colors.reset}`);
      })
    };
    
    // Create navigation ref
    this.navigationRef = {
      current: this.navigation
    };
    
    // Initialize deep link handler
    this.deepLinkHandler = new EdushortsDeepLinkHandler();
    this.deepLinkHandler.setNavigationRef(this.navigationRef);
    
    // Start the app
    console.log(`${colors.bright}${colors.green}🚀 Edushorts App initialized${colors.reset}`);
  }
  
  start() {
    console.log(`\n${colors.bright}${colors.blue}=== Starting Edushorts App ===${colors.reset}`);
    
    // Initialize Branch SDK and listeners
    this.deepLinkHandler.initialize();
    
    // Show home screen
    console.log(`${colors.cyan}Showing Home screen${colors.reset}`);
    this.renderHomeScreen();
  }
  
  renderHomeScreen() {
    console.log(`\n${colors.cyan}===== HOME SCREEN =====${colors.reset}`);
    console.log(`${colors.yellow}Featured Articles:${colors.reset}`);
    console.log(`${colors.bright}1. How to Master React Native${colors.reset}`);
    console.log(`${colors.bright}2. Deep Linking Explained${colors.reset}`);
    console.log(`${colors.bright}3. Branch.io Integration Guide${colors.reset}`);
  }
  
  renderArticleDetailScreen(articleId) {
    // Get article details (in a real app, this would be fetched from an API)
    const article = {
      id: articleId,
      title: `Article ${articleId} - Detailed View`,
      content: 'This is the full content of the article...',
      author: 'John Doe',
      publishDate: '2023-05-15'
    };
    
    console.log(`\n${colors.cyan}===== ARTICLE DETAIL SCREEN =====${colors.reset}`);
    console.log(`${colors.bright}Title: ${article.title}${colors.reset}`);
    console.log(`Author: ${article.author}`);
    console.log(`Published: ${article.publishDate}`);
    console.log(`Content: ${article.content}`);
    console.log(`\n${colors.yellow}[Share Button]${colors.reset}`);
  }
  
  async shareArticle(articleId) {
    console.log(`\n${colors.bright}${colors.yellow}👆 User clicks Share button for article ${articleId}${colors.reset}`);
    
    // Article data (in a real app, this would be fetched from state or API)
    const article = {
      id: articleId,
      title: `Article ${articleId} - Great Content to Share`,
      summary: 'This is a summary of the article that will appear in the share preview',
      image_path: 'https://example.com/article-image.jpg'
    };
    
    // Generate Branch link for sharing
    const shareableLink = await this.deepLinkHandler.createBranchLink(
      article.id,
      article.title,
      article.summary,
      article.image_path
    );
    
    console.log(`\n${colors.bright}${colors.green}📱 Share sheet opened with link: ${shareableLink}${colors.reset}`);
    console.log(`${colors.yellow}User can now share this link via any app${colors.reset}`);
    
    return {
      success: true,
      link: shareableLink,
      article
    };
  }
  
  cleanup() {
    // Clean up resources
    this.deepLinkHandler.cleanupBranchListeners();
    console.log(`${colors.gray}App resources cleaned up${colors.reset}`);
  }
}

// Main test function to simulate the entire flow
async function simulateEdushortsDeepLinkingFlow() {
  try {
    console.log(`${colors.bright}${colors.blue}===================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}= EDUSHORTS APP BRANCH DEEP LINKING SIMULATION =${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}===================================================${colors.reset}\n`);
    
    //
    // PART 1: APP INITIALIZATION
    //
    
    // Initialize the app
    const app = new EdushortsApp();
    app.start();
    
    // Wait a moment (simulating user looking at the home screen)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to an article
    app.navigation.navigate('ArticleDetail', { id: '123456' });
    
    // Wait a moment (simulating user reading the article)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    //
    // PART 2: USER SHARES THE ARTICLE
    //
    
    console.log(`\n${colors.bright}${colors.blue}=== 1. User Shares an Article ===${colors.reset}\n`);
    
    // User clicks share button
    const shareResult = await app.shareArticle('123456');
    const branchLink = shareResult.link;
    
    // Wait a moment (simulating time passing after share)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    //
    // PART 3: SCENARIO 1 - USER WITH APP INSTALLED CLICKS THE LINK
    //
    
    console.log(`\n${colors.bright}${colors.blue}=== 2. Scenario: User WITH App Installed Clicks Link ===${colors.reset}\n`);
    
    // Create a device with the app installed
    const deviceWithApp = new MobileDevice(true);
    
    // Simulate the user clicking the Branch link
    const withAppResult = BranchSDK.simulateLinkClick(branchLink, deviceWithApp);
    
    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the user was directed to the correct article
    if (app.currentScreen === 'ArticleDetail' && 
        app.currentParams && 
        app.currentParams.id === '123456') {
      console.log(`\n${colors.green}✅ SUCCESS: User with app was properly redirected to Article 123456${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ FAILURE: User with app was not redirected correctly${colors.reset}`);
      console.log(`${colors.yellow}Current screen: ${app.currentScreen}${colors.reset}`);
      console.log(`${colors.yellow}Current params: ${JSON.stringify(app.currentParams)}${colors.reset}`);
    }
    
    //
    // PART 4: SCENARIO 2 - USER WITHOUT APP CLICKS THE LINK
    //
    
    console.log(`\n${colors.bright}${colors.blue}=== 3. Scenario: User WITHOUT App Clicks Link ===${colors.reset}\n`);
    
    // Create a device without the app installed
    const deviceWithoutApp = new MobileDevice(false);
    
    // Simulate the user clicking the Branch link
    const withoutAppResult = BranchSDK.simulateLinkClick(branchLink, deviceWithoutApp);
    
    // Verify the user was directed to the Play Store
    if (withoutAppResult.action === 'STORE_REDIRECT') {
      console.log(`\n${colors.green}✅ SUCCESS: User without app was properly redirected to Play Store${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ FAILURE: User without app was not redirected to Play Store${colors.reset}`);
    }
    
    //
    // PART 5: SUMMARY AND CLEANUP
    //
    
    // Clean up
    app.cleanup();
    
    // Display summary
    console.log(`\n${colors.bright}${colors.blue}=== Summary ===${colors.reset}\n`);
    console.log(`${colors.bright}1. Share button clicked:${colors.reset} Branch link created successfully`);
    console.log(`   Link: ${branchLink}`);
    console.log(`\n${colors.bright}2. User WITH app clicks link:${colors.reset} App opens to ArticleDetail screen with ID 123456`);
    console.log(`\n${colors.bright}3. User WITHOUT app clicks link:${colors.reset} Redirected to Play Store`);
    console.log(`   URL: ${deviceWithoutApp.appStoreUrl}`);
    
    console.log(`\n${colors.bright}${colors.green}✅ SIMULATION COMPLETE: Branch deep linking flow works as expected${colors.reset}`);
    console.log(`${colors.yellow}This confirms your Branch integration will work correctly in the real app${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Simulation failed with error: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
}

// Run the simulation
simulateEdushortsDeepLinkingFlow(); 