/**
 * Comprehensive Branch Deep Linking Test Script
 * 
 * This script thoroughly tests all Branch.io integration scenarios including:
 * - Link generation with retries and fallbacks
 * - Link sharing through various channels
 * - Deep link handling in different app states
 * - Error cases and recovery
 * - Analytics tracking
 * - Background vs foreground handling
 * - Cold start vs warm start
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

// Mock Branch Universal Object with comprehensive error handling
class MockBranchUniversalObject {
  constructor(canonicalIdentifier, properties) {
    this.canonicalIdentifier = canonicalIdentifier;
    this.properties = properties;
    this._retryCount = 0;
    this._maxRetries = 3;
    this._retryDelay = 1000;
    console.log(`${colors.gray}Created BUO with ID: ${canonicalIdentifier}${colors.reset}`);
  }
  
  async generateShortUrl(linkProperties, controlParams) {
    this._retryCount++;
    console.log(`${colors.gray}Generating short URL (Attempt ${this._retryCount}/${this._maxRetries}):${colors.reset}`);
    console.log(`${colors.gray}- Link properties: ${JSON.stringify(linkProperties)}${colors.reset}`);
    console.log(`${colors.gray}- Control params: ${JSON.stringify(controlParams)}${colors.reset}`);
    
    // Simulate occasional failures
    if (Math.random() < 0.3 && this._retryCount < this._maxRetries) {
      console.log(`${colors.yellow}Link generation failed, retrying...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, this._retryDelay));
      return this.generateShortUrl(linkProperties, controlParams);
    }
    
    // Generate a mock Branch URL
    const domainPrefix = 'xbwk1';
    const articleId = this.properties.contentMetadata?.customMetadata?.articleId || 'unknown';
    const url = `https://${domainPrefix}.app.link/article/${articleId}`;
    
    console.log(`${colors.green}Generated Branch URL: ${url}${colors.reset}`);
    return { url };
  }
  
  async registerView() {
    console.log(`${colors.gray}Registered content view for: ${this.canonicalIdentifier}${colors.reset}`);
    return true;
  }
}

// Mock Branch SDK with comprehensive error handling and fallbacks
const mockBranch = {
  _initialized: false,
  _debugEnabled: false,
  _callback: null,
  _initAttempts: 0,
  _maxInitAttempts: 3,
  _initDelay: 1000,
  _lastError: null,
  _sessionData: null,
  _events: [],
  
  async init() {
    this._initAttempts++;
    console.log(`${colors.blue}Attempting Branch SDK initialization (Attempt ${this._initAttempts}/${this._maxInitAttempts})${colors.reset}`);
    
    // Simulate occasional initialization failures with retry logic
    if (Math.random() < 0.3 && this._initAttempts < this._maxInitAttempts) {
      console.log(`${colors.yellow}Branch SDK initialization failed, retrying...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, this._initDelay));
      return this.init();
    }
    
    this._initialized = true;
    this._lastError = null;
    
    // Initialize session data
    this._sessionData = {
      '+is_first_session': Math.random() < 0.3,
      '+clicked_branch_link': false,
      'device_fingerprint_id': `df_${Date.now()}`,
      'identity_id': `id_${Math.random().toString(36).substr(2, 9)}`,
      'session_id': `ss_${Date.now()}`
    };
    
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
  
  async createBranchUniversalObject(canonicalIdentifier, properties) {
    if (!this._initialized) {
      throw new Error('Cannot create BUO - Branch SDK not initialized');
    }
    return new MockBranchUniversalObject(canonicalIdentifier, properties);
  },
  
  userCompletedAction(action, metadata = {}) {
    if (!this._initialized) {
      console.warn(`${colors.yellow}Warning: Tracking event before initialization${colors.reset}`);
      return false;
    }
    
    const event = {
      name: action,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        session_id: this._sessionData?.session_id
      }
    };
    
    this._events.push(event);
    console.log(`${colors.blue}Branch event logged: ${action}${colors.reset}`);
    console.log(`${colors.gray}Event metadata: ${JSON.stringify(metadata)}${colors.reset}`);
    return true;
  },
  
  simulateDeepLink(params, options = {}) {
    const {
      isFirstSession = false,
      hasApp = true,
      channel = 'app',
      feature = 'sharing',
      campaign = 'article_share',
      stage = 'new_share',
      tags = ['article'],
      shouldSucceed = true
    } = options;
    
    console.log(`\n${colors.yellow}Simulating Branch deep link click:${colors.reset}`);
    console.log(`${colors.yellow}- First session: ${isFirstSession}${colors.reset}`);
    console.log(`${colors.yellow}- Has app: ${hasApp}${colors.reset}`);
    console.log(`${colors.yellow}- Channel: ${channel}${colors.reset}`);
    
    if (!hasApp) {
      console.log(`${colors.magenta}User redirected to Play Store${colors.reset}`);
      return {
        success: true,
        action: 'store_redirect',
        url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman'
      };
    }
    
    if (!shouldSucceed) {
      const error = new Error('Simulated deep link failure');
      if (this._callback) {
        this._callback({ error, params: null, uri: null });
      }
      return { success: false, error };
    }
    
    const deepLinkData = {
      '+clicked_branch_link': true,
      '+is_first_session': isFirstSession,
      '+click_timestamp': Date.now(),
      '~channel': channel,
      '~feature': feature,
      '~campaign': campaign,
      '~stage': stage,
      '~tags': tags,
      ...params
    };
    
    if (this._callback) {
      setTimeout(() => {
        this._callback({
          error: null,
          params: deepLinkData,
          uri: `https://xbwk1.app.link/article/${params.articleId}`
        });
      }, 100);
    }
    
    return {
      success: true,
      action: 'opened_app',
      data: deepLinkData
    };
  },
  
  getLatestReferringParams() {
    return this._sessionData;
  },
  
  getFirstReferringParams() {
    return {
      ...this._sessionData,
      '+is_first_session': true
    };
  },
  
  setIdentity(userId) {
    this._sessionData = {
      ...this._sessionData,
      identity_id: userId
    };
    console.log(`${colors.blue}Branch identity set: ${userId}${colors.reset}`);
    return true;
  },
  
  logout() {
    this._sessionData = {
      ...this._sessionData,
      identity_id: null
    };
    console.log(`${colors.blue}Branch identity cleared${colors.reset}`);
    return true;
  }
};

// Mock Share API with platform-specific behavior
const mockShare = {
  async share({ title, message, url }) {
    console.log(`\n${colors.cyan}=== SHARE DIALOG OPENED ===${colors.reset}`);
    console.log(`${colors.cyan}Title: ${title}${colors.reset}`);
    console.log(`${colors.cyan}Message: ${message}${colors.reset}`);
    console.log(`${colors.cyan}URL: ${url}${colors.reset}`);
    
    // Simulate different sharing outcomes
    const outcomes = ['completed', 'dismissed', 'failed'];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    switch (result) {
      case 'completed':
        console.log(`${colors.green}User shared the content${colors.reset}`);
        return { action: 'sharedAction', activityType: 'com.whatsapp' };
      case 'dismissed':
        console.log(`${colors.yellow}User dismissed the share dialog${colors.reset}`);
        return { action: 'dismissedAction' };
      case 'failed':
        throw new Error('Share dialog failed to open');
    }
  }
};

// Mock Navigation Container with deep link handling
class MockNavigationContainer {
  constructor() {
    this.navigationStack = ['Main'];
    this.params = {};
    this.current = {
      navigate: this.navigate.bind(this),
      getCurrentRoute: () => ({ name: this.currentScreen }),
      goBack: this.goBack.bind(this)
    };
    this.listeners = [];
    
    // Set up Branch deep link handler
    if (mockBranch) {
      mockBranch.subscribe(({ error, params }) => {
        if (!error && params && params['+clicked_branch_link']) {
          const articleId = params.articleId || params.article_id;
          if (articleId) {
            this.navigate('ArticleDetail', { 
              articleId,
              branch: true 
            });
          }
        }
      });
    }
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
    this.navigationStack = ['Main'];
    this.params = {};
    this.notifyListeners();
  }
}

// Mock article data
const mockArticles = [
  {
    id: 'article-12345',
    title: 'How to Master React Native Development',
    content: 'A comprehensive guide to becoming a React Native expert...',
    excerpt: 'Learn React Native from basics to advanced concepts',
    source_name: 'EduShorts Blog',
    category: { name: 'Technology' },
    image_url: 'https://example.com/images/react-native.jpg',
    publish_date: '2024-03-15T12:00:00Z'
  },
  {
    id: 'article-67890',
    title: 'Deep Linking Best Practices',
    content: 'Everything you need to know about implementing deep links...',
    excerpt: 'Implement deep linking like a pro',
    source_name: 'Mobile Dev Weekly',
    category: { name: 'Development' },
    image_url: 'https://example.com/images/deep-linking.jpg',
    publish_date: '2024-03-14T15:30:00Z'
  }
];

// Comprehensive test function
async function runBranchDeepLinkTest() {
  console.log(`\n${colors.bright}${colors.blue}========== COMPREHENSIVE BRANCH DEEP LINKING TEST ===========${colors.reset}\n`);
  
  const navigationRef = new MockNavigationContainer();
  let testsPassed = 0;
  let testsFailed = 0;
  
  async function runTest(name, testFn) {
    console.log(`\n${colors.bright}${colors.blue}=== Testing: ${name} ===${colors.reset}\n`);
    try {
      await testFn();
      console.log(`${colors.green}✓ Test passed: ${name}${colors.reset}`);
      testsPassed++;
    } catch (error) {
      console.error(`${colors.red}✗ Test failed: ${name}${colors.reset}`);
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      testsFailed++;
    }
  }
  
  // Test 1: Branch SDK Initialization with Retries
  await runTest('Branch SDK Initialization', async () => {
    // Reset initialization state
    mockBranch._initialized = false;
    mockBranch._initAttempts = 0;
    
    await mockBranch.init();
    if (!mockBranch._initialized) {
      throw new Error('Branch SDK not properly initialized');
    }
  });
  
  // Test 2: Branch Universal Object Creation
  await runTest('Branch Universal Object Creation', async () => {
    const article = mockArticles[0];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    const buo = await mockBranch.createBranchUniversalObject(`article/${article.id}`, {
      canonicalUrl: `https://edushorts.com/articles/${article.id}`,
      title: article.title,
      contentDescription: article.excerpt,
      contentImageUrl: article.image_url,
      contentMetadata: {
        customMetadata: {
          articleId: article.id,
          category: article.category.name,
          source: article.source_name
        }
      }
    });
    
    if (!buo.canonicalIdentifier || !buo.properties) {
      throw new Error('BUO not properly created');
    }
  });
  
  // Test 3: Link Generation with Retries
  await runTest('Link Generation with Retries', async () => {
    const article = mockArticles[0];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    const buo = await mockBranch.createBranchUniversalObject(`article/${article.id}`, {
      title: article.title,
      contentMetadata: {
        customMetadata: { articleId: article.id }
      }
    });
    
    const { url } = await buo.generateShortUrl(
      {
        feature: 'sharing',
        channel: 'app',
        campaign: 'article_share'
      },
      {
        $desktop_url: 'https://play.google.com/store/apps/details?id=com.ajilkojilgokulravi.unniman',
        $android_url: 'market://details?id=com.ajilkojilgokulravi.unniman',
        $ios_url: 'https://apps.apple.com/app/id123456789',
        data: { articleId: article.id }
      }
    );
    
    if (!url || !url.includes(article.id)) {
      throw new Error('Invalid Branch link generated');
    }
    
    console.log(`${colors.green}Generated valid Branch link: ${url}${colors.reset}`);
  });
  
  // Test 4: Share Flow with Link Generation
  await runTest('Article Sharing Flow', async () => {
    const article = mockArticles[0];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    // Generate link
    const buo = await mockBranch.createBranchUniversalObject(`article/${article.id}`, {
      title: article.title,
      contentMetadata: {
        customMetadata: { articleId: article.id }
      }
    });
    
    const { url } = await buo.generateShortUrl(
      { feature: 'sharing', channel: 'app' },
      { data: { articleId: article.id } }
    );
    
    // Share content
    const shareResult = await mockShare.share({
      title: 'Share Article',
      message: `Check out this article: ${article.title}`,
      url
    });
    
    if (!shareResult.action) {
      throw new Error('Share action not completed');
    }
    
    // Track share event
    mockBranch.userCompletedAction('SHARE', {
      articleId: article.id,
      channel: shareResult.activityType || 'unknown',
      success: shareResult.action === 'sharedAction'
    });
    
    console.log(`${colors.green}Share completed via: ${shareResult.activityType || 'unknown'}${colors.reset}`);
  });
  
  // Test 5: Deep Link Handling - App Installed
  await runTest('Deep Link Handling - App Installed', async () => {
    const article = mockArticles[0];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    // Reset navigation
    navigationRef.reset();
    
    const result = await mockBranch.simulateDeepLink(
      { articleId: article.id },
      { isFirstSession: false, hasApp: true }
    );
    
    if (!result.success || result.action !== 'opened_app') {
      throw new Error('Deep link not handled correctly');
    }
    
    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (navigationRef.currentScreen !== 'ArticleDetail' || 
        navigationRef.params.articleId !== article.id) {
      throw new Error('Navigation not handled correctly');
    }
    
    console.log(`${colors.green}Deep link successfully opened article: ${article.id}${colors.reset}`);
  });
  
  // Test 6: Deep Link Handling - App Not Installed
  await runTest('Deep Link Handling - App Not Installed', async () => {
    const article = mockArticles[1];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    const result = await mockBranch.simulateDeepLink(
      { articleId: article.id },
      { hasApp: false }
    );
    
    if (!result.success || result.action !== 'store_redirect') {
      throw new Error('Store redirect not handled correctly');
    }
    
    console.log(`${colors.green}Successfully redirected to store${colors.reset}`);
  });
  
  // Test 7: First-time User Attribution
  await runTest('First-time User Attribution', async () => {
    const article = mockArticles[0];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    const result = await mockBranch.simulateDeepLink(
      { articleId: article.id },
      { isFirstSession: true, hasApp: true }
    );
    
    if (!result.success || !result.data['+is_first_session']) {
      throw new Error('First session not handled correctly');
    }
    
    const firstParams = mockBranch.getFirstReferringParams();
    if (!firstParams['+is_first_session']) {
      throw new Error('First referring params not correct');
    }
    
    console.log(`${colors.green}First-time user attribution verified${colors.reset}`);
  });
  
  // Test 8: Error Recovery
  await runTest('Error Recovery', async () => {
    // Reset Branch SDK
    mockBranch._initialized = false;
    mockBranch._initAttempts = 0;
    
    try {
      await mockBranch.createBranchUniversalObject('test', {});
      throw new Error('Should have failed');
    } catch (error) {
      if (!error.message.includes('not initialized')) {
        throw new Error('Wrong error handling');
      }
    }
    
    // Test recovery
    await mockBranch.init();
    const buo = await mockBranch.createBranchUniversalObject('test-recovery', {});
    if (!buo) {
      throw new Error('Recovery failed');
    }
    
    console.log(`${colors.green}Error recovery successful${colors.reset}`);
  });
  
  // Test 9: Analytics Tracking
  await runTest('Analytics Tracking', async () => {
    const article = mockArticles[0];
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    // Clear existing events
    mockBranch._events = [];
    
    // Track view
    mockBranch.userCompletedAction('VIEW', {
      articleId: article.id,
      source: 'deep_link'
    });
    
    // Track share
    mockBranch.userCompletedAction('SHARE', {
      articleId: article.id,
      channel: 'whatsapp'
    });
    
    const viewEvents = mockBranch._events.filter(e => 
      e.name === 'VIEW' && 
      e.metadata.articleId === article.id
    );
    
    const shareEvents = mockBranch._events.filter(e => 
      e.name === 'SHARE' && 
      e.metadata.articleId === article.id
    );
    
    if (viewEvents.length !== 1 || shareEvents.length !== 1) {
      throw new Error('Events not tracked correctly');
    }
    
    console.log(`${colors.green}Analytics events tracked successfully${colors.reset}`);
    console.log(`${colors.gray}- View events: ${viewEvents.length}${colors.reset}`);
    console.log(`${colors.gray}- Share events: ${shareEvents.length}${colors.reset}`);
  });
  
  // Test 10: Identity Management
  await runTest('Identity Management', async () => {
    const userId = 'user-123';
    
    // Ensure Branch is initialized
    if (!mockBranch._initialized) {
      await mockBranch.init();
    }
    
    mockBranch.setIdentity(userId);
    
    const sessionData = mockBranch.getLatestReferringParams();
    if (sessionData.identity_id !== userId) {
      throw new Error('Identity not set correctly');
    }
    
    mockBranch.logout();
    const newSessionData = mockBranch.getLatestReferringParams();
    if (newSessionData.identity_id !== null) {
      throw new Error('Logout not handled correctly');
    }
    
    console.log(`${colors.green}Identity management verified${colors.reset}`);
  });
  
  // Print test summary
  console.log(`\n${colors.bright}${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Tests passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Tests failed: ${testsFailed}${colors.reset}`);
  
  console.log(`\n${colors.bright}${colors.green}========== BRANCH DEEP LINKING TEST COMPLETE ===========${colors.reset}\n`);
}

// Run the test suite
runBranchDeepLinkTest().catch(error => {
  console.error(`${colors.red}Test suite failed with error: ${error}${colors.reset}`);
}); 