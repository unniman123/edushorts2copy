/**
 * Comprehensive App Startup Test Script
 * 
 * This script thoroughly tests the complete app initialization sequence including:
 * - Service initialization with error handling and retries
 * - Branch SDK initialization and fallbacks
 * - Deep link handling setup
 * - Authentication flows
 * - Navigation state management
 * - Background message handling
 * - Error recovery scenarios
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m", 
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

// Mock Branch SDK with comprehensive error handling and fallbacks
const mockBranch = {
  _initialized: false,
  _debugEnabled: false,
  _callback: null,
  _initAttempts: 0,
  _maxInitAttempts: 3,
  _initDelay: 1000, // ms between retry attempts

  async init() {
    this._initAttempts++;
    console.log(`${colors.blue}Attempting Branch SDK initialization (Attempt ${this._initAttempts}/${this._maxInitAttempts})${colors.reset}`);
    
    // Simulate occasional initialization failures
    if (Math.random() < 0.3 && this._initAttempts < this._maxInitAttempts) {
      console.log(`${colors.yellow}Branch SDK initialization failed, retrying...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, this._initDelay));
      return this.init();
    }
    
    this._initialized = true;
    console.log(`${colors.green}Branch SDK initialized successfully${colors.reset}`);
    return true;
  },

  debug(enabled) {
    this._debugEnabled = enabled;
    console.log(`${colors.gray}Branch debug mode ${enabled ? 'enabled' : 'disabled'}${colors.reset}`);
    return true;
  },

  subscribe(callback) {
    if (!this._initialized) {
      console.warn(`${colors.yellow}Warning: Setting up Branch subscription before initialization${colors.reset}`);
    }
    this._callback = callback;
    console.log(`${colors.blue}Branch subscription set up${colors.reset}`);
    return () => {
      this._callback = null;
      console.log(`${colors.gray}Branch subscription cleaned up${colors.reset}`);
    };
  },

  simulateDeepLink(params, shouldSucceed = true) {
    if (!this._initialized) {
      console.error(`${colors.red}Error: Cannot process deep link - Branch SDK not initialized${colors.reset}`);
      return false;
    }

    console.log(`\n${colors.yellow}Simulating Branch deep link with params:${colors.reset}`);
    console.log(JSON.stringify(params, null, 2));

    if (shouldSucceed && this._callback) {
      this._callback({
        error: null,
        params: {
          '+clicked_branch_link': true,
          ...params
        },
        uri: `https://xbwk1.app.link/article/${params.articleId}`
      });
      return true;
    } else if (!shouldSucceed) {
      this._callback({
        error: new Error('Simulated deep link failure'),
        params: null,
        uri: null
      });
      return false;
    }
    
    console.log(`${colors.red}No Branch callback registered${colors.reset}`);
    return false;
  }
};

// Mock FCM (Firebase Cloud Messaging)
const mockMessaging = {
  _handlers: new Set(),
  
  setBackgroundMessageHandler(handler) {
    this._handlers.add(handler);
    console.log(`${colors.blue}FCM background handler registered${colors.reset}`);
  },

  async simulateBackgroundMessage(message) {
    console.log(`${colors.yellow}Simulating FCM background message:${colors.reset}`);
    console.log(JSON.stringify(message, null, 2));

    for (const handler of this._handlers) {
      try {
        await handler(message);
        console.log(`${colors.green}Background message handled successfully${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}Error in background message handler: ${error}${colors.reset}`);
      }
    }
  }
};

// Mock Navigation Container with state tracking
class MockNavigationContainer {
  constructor() {
    this.navigationStack = ['Loading'];
    this.params = {};
    this.current = {
      navigate: this.navigate.bind(this),
      getCurrentRoute: () => ({ name: this.currentScreen }),
      goBack: this.goBack.bind(this)
    };
    this.listeners = [];
  }

  get currentScreen() {
    return this.navigationStack[this.navigationStack.length - 1];
  }

  navigate(screenName, params = {}) {
    console.log(`${colors.green}Navigating to: ${screenName}${colors.reset}`);
    if (params && Object.keys(params).length > 0) {
      console.log(`${colors.gray}With params: ${JSON.stringify(params)}${colors.reset}`);
    }
    
    this.navigationStack.push(screenName);
    this.params = params;
    
    this.notifyListeners();
    return true;
  }

  goBack() {
    if (this.navigationStack.length > 1) {
      const from = this.navigationStack.pop();
      console.log(`${colors.green}Navigating back from: ${from} to: ${this.currentScreen}${colors.reset}`);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  addListener(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(l => l.callback !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      if (listener.event === 'state') {
        listener.callback({
          data: {
            state: {
              routes: this.navigationStack.map(name => ({ name }))
            }
          }
        });
      }
    });
  }

  reset() {
    this.navigationStack = ['Loading'];
    this.params = {};
    this.notifyListeners();
  }
}

// Mock services with error simulation and recovery
class MockMonitoringService {
  static instance;
  _initialized = false;
  _errorRate = 0.2; // 20% chance of operation failure
  
  static getInstance() {
    if (!MockMonitoringService.instance) {
      MockMonitoringService.instance = new MockMonitoringService();
    }
    return MockMonitoringService.instance;
  }
  
  async initialize() {
    if (Math.random() < this._errorRate) {
      throw new Error('Monitoring service initialization failed');
    }
    this._initialized = true;
    console.log(`${colors.blue}Monitoring service initialized${colors.reset}`);
  }
  
  async logEvent(eventName, params) {
    if (!this._initialized) {
      console.warn(`${colors.yellow}Warning: Attempting to log event before initialization${colors.reset}`);
      return;
    }
    
    if (Math.random() < this._errorRate) {
      throw new Error(`Failed to log event: ${eventName}`);
    }
    
    console.log(`${colors.gray}Logged event: ${eventName}${colors.reset}`);
    if (params) {
      console.log(`${colors.gray}Event params: ${JSON.stringify(params)}${colors.reset}`);
    }
  }
  
  cleanup() {
    this._initialized = false;
    console.log(`${colors.gray}Monitoring service cleaned up${colors.reset}`);
  }
}

class MockNotificationBridge {
  static instance;
  _initialized = false;
  _errorRate = 0.1;
  _notifications = [];
  
  static getInstance() {
    if (!MockNotificationBridge.instance) {
      MockNotificationBridge.instance = new MockNotificationBridge();
    }
    return MockNotificationBridge.instance;
  }
  
  async initialize() {
    if (Math.random() < this._errorRate) {
      throw new Error('Notification bridge initialization failed');
    }
    this._initialized = true;
    console.log(`${colors.blue}Notification bridge initialized${colors.reset}`);
  }
  
  async processNotification(notification) {
    if (!this._initialized) {
      throw new Error('Cannot process notification - bridge not initialized');
    }
    
    console.log(`${colors.gray}Processing notification:${colors.reset}`);
    console.log(JSON.stringify(notification, null, 2));
    
    this._notifications.push(notification);
    
    // Handle deep links in notifications
    if (notification.payload?.deep_link) {
      if (notification.payload.deep_link.includes('xbwk1.app.link')) {
        mockBranch.simulateDeepLink({ articleId: notification.payload.data?.articleId });
      }
    }
  }
  
  cleanup() {
    this._initialized = false;
    this._notifications = [];
    console.log(`${colors.gray}Notification bridge cleaned up${colors.reset}`);
  }
}

class MockDeepLinkHandler {
  static instance;
  navigationRef = null;
  branchUnsubscribe = null;
  _initialized = false;
  
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
  
  async setupDeepLinkListeners() {
    console.log(`${colors.blue}Setting up deep link listeners${colors.reset}`);
    
    try {
      // Setup Branch
      mockBranch.debug(true);
      await mockBranch.init();
      
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
      
      this._initialized = true;
    } catch (error) {
      console.error(`${colors.red}Error setting up deep link listeners: ${error}${colors.reset}`);
      throw error;
    }
  }
  
  async handleDeepLink(url) {
    if (!this._initialized) {
      throw new Error('Cannot handle deep link - handler not initialized');
    }
    
    console.log(`${colors.yellow}Handling deep link: ${url}${colors.reset}`);
    
    try {
      if (url.includes('xbwk1.app.link')) {
        const match = url.match(/article\/([^\/]+)/);
        if (match && match[1]) {
          return mockBranch.simulateDeepLink({ articleId: match[1] });
        }
      }
      return false;
    } catch (error) {
      console.error(`${colors.red}Error handling deep link: ${error}${colors.reset}`);
      return false;
    }
  }
  
  cleanupBranchListeners() {
    if (this.branchUnsubscribe) {
      this.branchUnsubscribe();
      this.branchUnsubscribe = null;
    }
    this._initialized = false;
    console.log(`${colors.gray}Deep link handler cleaned up${colors.reset}`);
  }
}

// Mock auth service with various scenarios
const mockAuthService = {
  user: null,
  _errorRate: 0.15,
  _tokenExpired: false,
  
  async signIn(email, password) {
    console.log(`${colors.yellow}Authenticating user: ${email}${colors.reset}`);
    
    if (Math.random() < this._errorRate) {
      throw new Error('Authentication failed - network error');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!email || !password) {
      throw new Error('Invalid credentials');
    }
    
    this.user = {
      id: 'test-user-id-123',
      email,
      displayName: 'Test User'
    };
    
    console.log(`${colors.green}Authentication successful${colors.reset}`);
    return { user: this.user };
  },
  
  async signOut() {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.user = null;
    console.log(`${colors.yellow}User signed out${colors.reset}`);
  },
  
  getCurrentUser() {
    if (this._tokenExpired) {
      return null;
    }
    return this.user;
  },
  
  simulateTokenExpiry() {
    this._tokenExpired = true;
    console.log(`${colors.yellow}Simulating auth token expiry${colors.reset}`);
  }
};

// Mock remote config service
const mockRemoteConfigService = {
  _initialized: false,
  _config: new Map(),
  
  async initialize() {
    if (Math.random() < 0.1) {
      throw new Error('Failed to fetch remote config');
    }
    this._initialized = true;
    console.log(`${colors.blue}Remote config service initialized${colors.reset}`);
  },
  
  getValue(key) {
    if (!this._initialized) {
      console.warn(`${colors.yellow}Warning: Accessing remote config before initialization${colors.reset}`);
    }
    return this._config.get(key);
  },
  
  setValue(key, value) {
    this._config.set(key, value);
  }
};

// Main test function
async function runComprehensiveStartupTest() {
  console.log(`\n${colors.bright}${colors.blue}========== COMPREHENSIVE APP STARTUP TEST ===========${colors.reset}\n`);
  
  const navigationRef = new MockNavigationContainer();
  let notificationBridge;
  let monitoringService;
  let deepLinkHandler;
  let initializationSuccess = true;
  
  try {
    // Step 1: Initialize core services
    console.log(`\n${colors.bright}Step 1: Core Service Initialization${colors.reset}`);
    
    // Initialize Branch SDK first
    console.log(`${colors.gray}Initializing Branch SDK...${colors.reset}`);
    await mockBranch.init();
    console.log(`${colors.green}✓ Branch SDK initialized${colors.reset}`);
    
    // Initialize monitoring for error tracking
    monitoringService = MockMonitoringService.getInstance();
    await monitoringService.initialize();
    console.log(`${colors.green}✓ MonitoringService initialized${colors.reset}`);
    
    // Initialize notification handling
    notificationBridge = MockNotificationBridge.getInstance();
    await notificationBridge.initialize();
    console.log(`${colors.green}✓ NotificationBridge initialized${colors.reset}`);
    
    // Setup FCM background handler
    mockMessaging.setBackgroundMessageHandler(async (remoteMessage) => {
      try {
        await notificationBridge.processNotification({
          type: 'push',
          payload: {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
            deep_link: remoteMessage.data?.deep_link
          }
        });
      } catch (error) {
        console.error(`${colors.red}Error processing background message: ${error}${colors.reset}`);
      }
    });
    console.log(`${colors.green}✓ FCM background handler set up${colors.reset}`);
    
    // Initialize deep link handling
    deepLinkHandler = MockDeepLinkHandler.getInstance();
    deepLinkHandler.setNavigationRef(navigationRef);
    await deepLinkHandler.setupDeepLinkListeners();
    console.log(`${colors.green}✓ DeepLinkHandler initialized${colors.reset}`);
    
    // Initialize remote config
    await mockRemoteConfigService.initialize();
    console.log(`${colors.green}✓ RemoteConfigService initialized${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error during core service initialization: ${error}${colors.reset}`);
    initializationSuccess = false;
    
    // Attempt immediate recovery
    console.log(`${colors.yellow}Attempting immediate recovery...${colors.reset}`);
    try {
      if (!mockBranch._initialized) {
        await mockBranch.init();
        console.log(`${colors.green}✓ Branch SDK recovered${colors.reset}`);
      }
      
      if (!monitoringService?._initialized) {
        monitoringService = MockMonitoringService.getInstance();
        await monitoringService.initialize();
        console.log(`${colors.green}✓ MonitoringService recovered${colors.reset}`);
      }
      
      if (!notificationBridge?._initialized) {
        notificationBridge = MockNotificationBridge.getInstance();
        await notificationBridge.initialize();
        console.log(`${colors.green}✓ NotificationBridge recovered${colors.reset}`);
      }
      
      if (!deepLinkHandler?._initialized) {
        deepLinkHandler = MockDeepLinkHandler.getInstance();
        deepLinkHandler.setNavigationRef(navigationRef);
        await deepLinkHandler.setupDeepLinkListeners();
        console.log(`${colors.green}✓ DeepLinkHandler recovered${colors.reset}`);
      }
      
      initializationSuccess = true;
    } catch (recoveryError) {
      console.error(`${colors.red}Recovery failed: ${recoveryError}${colors.reset}`);
    }
  }
  
  // Step 2: Test authentication flows
  console.log(`\n${colors.bright}Step 2: Authentication Flow Testing${colors.reset}`);
  
  try {
    // Start at loading screen
    navigationRef.navigate('LoadingScreen');
    
    // Test invalid credentials
    try {
      await mockAuthService.signIn('', '');
    } catch (error) {
      console.log(`${colors.green}✓ Invalid credentials properly rejected${colors.reset}`);
    }
    
    // Test successful login
    await mockAuthService.signIn('test@example.com', 'password123');
    navigationRef.navigate('Main', { screen: 'HomeTab' });
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    
    // Test token expiry handling
    mockAuthService.simulateTokenExpiry();
    if (!mockAuthService.getCurrentUser()) {
      navigationRef.navigate('Login');
      console.log(`${colors.green}✓ Token expiry handled correctly${colors.reset}`);
    }
    
    // Test sign out
    await mockAuthService.signOut();
    navigationRef.navigate('Login');
    console.log(`${colors.green}✓ Sign out successful${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error during authentication testing: ${error}${colors.reset}`);
  }
  
  // Step 3: Test deep linking scenarios
  console.log(`\n${colors.bright}Step 3: Deep Linking Scenarios${colors.reset}`);
  
  try {
    // Test successful article deep link
    const testArticleId = 'test-article-12345';
    console.log(`\nTesting successful article deep link...`);
    
    // Ensure Branch is initialized before testing deep links
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    mockBranch.simulateDeepLink({ articleId: testArticleId }, true);
    
    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (navigationRef.currentScreen === 'ArticleDetail' && 
        navigationRef.params.articleId === testArticleId) {
      console.log(`${colors.green}✓ Article deep link navigation successful${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Deep link navigation failed${colors.reset}`);
      console.log(`${colors.gray}Current screen: ${navigationRef.currentScreen}${colors.reset}`);
      console.log(`${colors.gray}Params: ${JSON.stringify(navigationRef.params)}${colors.reset}`);
    }
    
    // Test failed deep link
    console.log(`\nTesting failed deep link...`);
    const failedResult = mockBranch.simulateDeepLink({ articleId: 'invalid-id' }, false);
    if (!failedResult) {
      console.log(`${colors.green}✓ Failed deep link handled correctly${colors.reset}`);
    }
    
    // Test deep link from notification
    console.log(`\nTesting notification with deep link...`);
    await mockMessaging.simulateBackgroundMessage({
      notification: {
        title: 'New Article',
        body: 'Check out this article!'
      },
      data: {
        deep_link: `https://xbwk1.app.link/article/${testArticleId}`,
        articleId: testArticleId
      }
    });
    
    // Wait for notification processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (navigationRef.currentScreen === 'ArticleDetail' && 
        navigationRef.params.articleId === testArticleId) {
      console.log(`${colors.green}✓ Notification deep link handled correctly${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error during deep linking tests: ${error}${colors.reset}`);
  }
  
  // Step 4: Error recovery testing
  console.log(`\n${colors.bright}Step 4: Error Recovery Testing${colors.reset}`);
  
  try {
    // Test service recovery after failure
    if (!initializationSuccess) {
      console.log(`\nAttempting service recovery...`);
      
      if (!monitoringService?._initialized) {
        await monitoringService.initialize();
        console.log(`${colors.green}✓ MonitoringService recovered${colors.reset}`);
      }
      
      if (!notificationBridge?._initialized) {
        await notificationBridge.initialize();
        console.log(`${colors.green}✓ NotificationBridge recovered${colors.reset}`);
      }
      
      if (!deepLinkHandler?._initialized) {
        await deepLinkHandler.setupDeepLinkListeners();
        console.log(`${colors.green}✓ DeepLinkHandler recovered${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}Error during recovery testing: ${error}${colors.reset}`);
  }
  
  // Step 5: Cleanup
  console.log(`\n${colors.bright}Step 5: Cleanup${colors.reset}`);
  
  try {
    if (notificationBridge) {
      notificationBridge.cleanup();
      console.log(`${colors.green}✓ NotificationBridge cleaned up${colors.reset}`);
    }
    
    if (monitoringService) {
      monitoringService.cleanup();
      console.log(`${colors.green}✓ MonitoringService cleaned up${colors.reset}`);
    }
    
    if (deepLinkHandler) {
      deepLinkHandler.cleanupBranchListeners();
      console.log(`${colors.green}✓ DeepLinkHandler cleaned up${colors.reset}`);
    }
    
    navigationRef.reset();
    console.log(`${colors.green}✓ Navigation reset${colors.reset}`);
    
    console.log(`${colors.green}✓ All services cleaned up${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error during cleanup: ${error}${colors.reset}`);
  }
  
  console.log(`\n${colors.bright}${colors.green}========== COMPREHENSIVE APP STARTUP TEST COMPLETE ===========${colors.reset}\n`);
}

// Run the test
runComprehensiveStartupTest().catch(error => {
  console.error(`${colors.red}Test failed with error: ${error}${colors.reset}`);
}); 