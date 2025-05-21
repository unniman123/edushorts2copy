/**
 * App Startup Test Script
 * 
 * This script simulates the startup and login flow of the app,
 * including all service initializations, Branch SDK setup, and navigation.
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m", 
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m"
};

// Mock implementations of app services and modules
const mockBranch = {
  debug: (enabled) => {
    console.log(`${colors.gray}Branch debug mode ${enabled ? 'enabled' : 'disabled'}${colors.reset}`);
    return true;
  },
  init: () => {
    console.log(`${colors.blue}Branch SDK initialized${colors.reset}`);
    return Promise.resolve();
  },
  subscribe: (callback) => {
    console.log(`${colors.blue}Branch subscription set up${colors.reset}`);
    mockBranch._callback = callback;
    return () => {
      console.log(`${colors.gray}Branch subscription cleaned up${colors.reset}`);
      mockBranch._callback = null;
    };
  },
  _callback: null,
  // Simulate receiving a deep link
  simulateDeepLink: (articleId) => {
    console.log(`\n${colors.yellow}Simulating Branch deep link click with articleId: ${articleId}${colors.reset}`);
    if (mockBranch._callback) {
      mockBranch._callback({
        error: null,
        params: {
          '+clicked_branch_link': true,
          articleId: articleId
        },
        uri: `https://xbwk1.app.link/article/${articleId}`
      });
      return true;
    }
    console.log(`${colors.red}No Branch callback registered${colors.reset}`);
    return false;
  }
};

// Mock for navigation container
class MockNavigationContainer {
  constructor() {
    this.currentScreen = 'Loading';
    this.params = {};
    this.current = {
      navigate: this.navigate.bind(this),
      getCurrentRoute: () => ({ name: this.currentScreen }),
    };
    this.listeners = [];
  }

  navigate(screenName, params = {}) {
    console.log(`${colors.green}Navigating to: ${screenName}${colors.reset}`);
    if (params && Object.keys(params).length > 0) {
      console.log(`${colors.gray}With params: ${JSON.stringify(params)}${colors.reset}`);
    }
    this.currentScreen = screenName;
    this.params = params;
    
    // Notify listeners
    this.listeners.forEach(listener => {
      if (listener.event === 'state') {
        listener.callback({
          data: { state: { routes: [{ name: screenName }] } }
        });
      }
    });
    
    return true;
  }

  addListener(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(l => l.callback !== callback);
    };
  }
}

// Mock services
class MockMonitoringService {
  static instance;
  
  static getInstance() {
    if (!MockMonitoringService.instance) {
      MockMonitoringService.instance = new MockMonitoringService();
    }
    return MockMonitoringService.instance;
  }
  
  async initialize() {
    console.log(`${colors.blue}Monitoring service initialized${colors.reset}`);
    return Promise.resolve();
  }
  
  cleanup() {
    console.log(`${colors.gray}Monitoring service cleaned up${colors.reset}`);
  }
}

class MockNotificationBridge {
  static instance;
  
  static getInstance() {
    if (!MockNotificationBridge.instance) {
      MockNotificationBridge.instance = new MockNotificationBridge();
    }
    return MockNotificationBridge.instance;
  }
  
  async initialize() {
    console.log(`${colors.blue}Notification bridge initialized${colors.reset}`);
    return Promise.resolve();
  }
  
  async processNotification(notification) {
    console.log(`${colors.gray}Processing notification: ${JSON.stringify(notification)}${colors.reset}`);
    return Promise.resolve();
  }
  
  cleanup() {
    console.log(`${colors.gray}Notification bridge cleaned up${colors.reset}`);
  }
}

class MockDeepLinkHandler {
  static instance;
  navigationRef = null;
  branchUnsubscribe = null;
  
  static getInstance() {
    if (!MockDeepLinkHandler.instance) {
      MockDeepLinkHandler.instance = new MockDeepLinkHandler();
    }
    return MockDeepLinkHandler.instance;
  }
  
  setNavigationRef(ref) {
    this.navigationRef = ref;
    console.log(`${colors.blue}Deep link handler navigation reference set${colors.reset}`);
  }
  
  setupDeepLinkListeners() {
    console.log(`${colors.blue}Deep link listeners set up${colors.reset}`);
    
    try {
      // Mock Linking listeners setup
      console.log(`${colors.gray}Setting up Linking event listeners${colors.reset}`);
      
      // Setup Branch
      mockBranch.debug(true);
      mockBranch.init();
      
      this.branchUnsubscribe = mockBranch.subscribe(({ error, params, uri }) => {
        if (error) {
          console.error(`${colors.red}Branch error: ${error}${colors.reset}`);
          return;
        }
        
        if (params && params['+clicked_branch_link']) {
          const articleId = params.articleId || params.article_id;
          
          if (articleId && this.navigationRef?.current) {
            console.log(`${colors.green}Navigating to article via Branch deep link: ${articleId}${colors.reset}`);
            this.navigationRef.current.navigate('ArticleDetail', { 
              articleId,
              branch: true 
            });
          }
        }
      });
    } catch (error) {
      console.error(`${colors.red}Error setting up deep link listeners: ${error}${colors.reset}`);
    }
  }
  
  cleanupBranchListeners() {
    if (this.branchUnsubscribe) {
      this.branchUnsubscribe();
      this.branchUnsubscribe = null;
      console.log(`${colors.gray}Branch listeners cleaned up${colors.reset}`);
    }
  }
  
  async handleDeepLink(url) {
    console.log(`${colors.yellow}Handling deep link: ${url}${colors.reset}`);
    
    try {
      // Extract articleId from url
      const match = url.match(/articles\/([^\/]+)/);
      if (match && match[1]) {
        const articleId = match[1];
        console.log(`${colors.green}Extracted articleId: ${articleId}${colors.reset}`);
        
        if (this.navigationRef?.current) {
          this.navigationRef.current.navigate('ArticleDetail', { articleId });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`${colors.red}Error handling deep link: ${error}${colors.reset}`);
      return false;
    }
  }
}

// Mock for RemoteConfig
const mockRemoteConfigService = {
  async initialize() {
    console.log(`${colors.blue}Remote config service initialized${colors.reset}`);
    return Promise.resolve();
  }
};

// Mock for authentication
const mockAuthService = {
  user: null,
  
  signIn: async (email, password) => {
    console.log(`${colors.yellow}Authenticating user: ${email}${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    if (email && password) {
      mockAuthService.user = {
        id: 'test-user-id-123',
        email: email,
        displayName: 'Test User'
      };
      console.log(`${colors.green}Authentication successful${colors.reset}`);
      return { user: mockAuthService.user };
    } else {
      console.error(`${colors.red}Authentication failed${colors.reset}`);
      throw new Error('Invalid credentials');
    }
  },
  
  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    mockAuthService.user = null;
    console.log(`${colors.yellow}User signed out${colors.reset}`);
  },
  
  getCurrentUser: () => {
    return mockAuthService.user;
  }
};

// Main test function
async function runAppStartupTest() {
  console.log(`\n${colors.bright}${colors.blue}========== STARTING APP INITIALIZATION TEST ===========${colors.reset}\n`);
  
  // Step 1: Create the navigation container
  console.log(`${colors.bright}Step 1: Creating Navigation Container${colors.reset}`);
  const navigationRef = new MockNavigationContainer();
  console.log(`${colors.green}✓ Navigation container created${colors.reset}`);
  
  // Step 2: Initialize app services
  console.log(`\n${colors.bright}Step 2: Initializing App Services${colors.reset}`);
  
  // Initialize services with proper scoping so they can be accessed in cleanup
  let notificationBridge;
  let monitoringService;
  let deepLinkHandler;
  
  try {
    // Initialize auth
    console.log(`${colors.gray}Initializing authentication service...${colors.reset}`);
    
    // Initialize notification services
    notificationBridge = MockNotificationBridge.getInstance();
    await notificationBridge.initialize();
    console.log(`${colors.green}✓ NotificationBridge initialized${colors.reset}`);
    
    monitoringService = MockMonitoringService.getInstance();
    await monitoringService.initialize();
    console.log(`${colors.green}✓ MonitoringService initialized${colors.reset}`);
    
    // Initialize deep link handler with navigation ref
    deepLinkHandler = MockDeepLinkHandler.getInstance();
    deepLinkHandler.setNavigationRef(navigationRef);
    deepLinkHandler.setupDeepLinkListeners();
    console.log(`${colors.green}✓ DeepLinkHandler initialized${colors.reset}`);
    
    // Initialize remote config
    await mockRemoteConfigService.initialize();
    console.log(`${colors.green}✓ RemoteConfigService initialized${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error during service initialization: ${error}${colors.reset}`);
  }
  
  // Step 3: Authentication flow
  console.log(`\n${colors.bright}Step 3: Testing Authentication Flow${colors.reset}`);
  
  try {
    // Start on the loading screen
    console.log(`${colors.gray}App starting at LoadingScreen${colors.reset}`);
    navigationRef.navigate('LoadingScreen');
    
    // Since we have no user, navigate to login
    console.log(`${colors.yellow}No active session, navigating to login${colors.reset}`);
    navigationRef.navigate('Login');
    
    // Simulate user entering credentials and login
    console.log(`${colors.yellow}User entering credentials...${colors.reset}`);
    await mockAuthService.signIn('test@example.com', 'password123');
    
    // On successful login, navigate to the Main/Home screen
    console.log(`${colors.green}Login successful, navigating to Main screen${colors.reset}`);
    navigationRef.navigate('Main', { screen: 'HomeTab' });
    
    console.log(`${colors.green}✓ Authentication flow completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error during authentication: ${error}${colors.reset}`);
  }
  
  // Step 4: Test Branch deep link handling
  console.log(`\n${colors.bright}Step 4: Testing Branch Deep Link Handling${colors.reset}`);
  
  try {
    // Simulate a Branch link being clicked
    const testArticleId = 'test-article-12345';
    mockBranch.simulateDeepLink(testArticleId);
    
    // Verify the navigation happened correctly
    if (navigationRef.currentScreen === 'ArticleDetail' && 
        navigationRef.params.articleId === testArticleId) {
      console.log(`${colors.green}✓ Deep link navigation successful${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Deep link navigation failed${colors.reset}`);
      console.log(`${colors.gray}Current screen: ${navigationRef.currentScreen}${colors.reset}`);
      console.log(`${colors.gray}Params: ${JSON.stringify(navigationRef.params)}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error during deep link test: ${error}${colors.reset}`);
  }
  
  // Step 5: Cleanup
  console.log(`\n${colors.bright}Step 5: Cleanup${colors.reset}`);
  
  try {
    if (notificationBridge) notificationBridge.cleanup();
    if (monitoringService) monitoringService.cleanup();
    if (deepLinkHandler) deepLinkHandler.cleanupBranchListeners();
    console.log(`${colors.green}✓ Services cleaned up${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error during cleanup: ${error}${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}${colors.green}========== APP INITIALIZATION TEST COMPLETE ===========${colors.reset}\n`);
}

// Run the test
runAppStartupTest().catch(error => {
  console.error(`${colors.red}Test failed with error: ${error}${colors.reset}`);
}); 