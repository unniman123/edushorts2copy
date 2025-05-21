/**
 * Branch Link Sharing and Deep Linking Test
 * Specifically tests:
 * 1. Branch link generation
 * 2. Share dialog functionality
 * 3. Analytics tracking
 * 4. Deep link processing
 * 5. Navigation handling
 * 6. Parameter passing
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m", 
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m"
};

// Test article data
const testArticle = {
  id: 'test-article-123',
  title: 'Test Article for Branch Sharing',
  excerpt: 'This is a test article to verify Branch sharing functionality',
  content: 'Detailed content of the test article...',
  author: 'Test Author',
  category: 'Test Category',
  imageUrl: 'https://example.com/test-image.jpg'
};

// Mock Branch SDK with detailed logging
class MockBranchSDK {
  constructor() {
    this._initialized = false;
    this._subscribers = new Set();
    this._links = new Map();
    this._linkAnalytics = new Map();
  }

  async init() {
    console.log(`${colors.blue}Initializing Branch SDK...${colors.reset}`);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      this._initialized = true;
      console.log(`${colors.green}✓ Branch SDK initialized successfully${colors.reset}`);
      return true;
    } catch (error) {
      console.error(`${colors.red}Branch SDK initialization failed: ${error}${colors.reset}`);
      throw error;
    }
  }

  async createBranchUniversalObject(identifier, metadata) {
    console.log(`\n${colors.cyan}Creating Branch Universal Object:${colors.reset}`);
    console.log(`${colors.gray}Identifier: ${identifier}${colors.reset}`);
    console.log(`${colors.gray}Metadata: ${JSON.stringify(metadata, null, 2)}${colors.reset}`);

    const self = this;
    return {
      identifier,
      metadata,
      async generateShortUrl(properties = {}, controlParams = {}) {
        const url = `https://xbwk1.app.link/${identifier}`;
        
        console.log(`\n${colors.cyan}Generating Branch Short URL:${colors.reset}`);
        console.log(`${colors.gray}Properties: ${JSON.stringify(properties, null, 2)}${colors.reset}`);
        console.log(`${colors.gray}Control Params: ${JSON.stringify(controlParams, null, 2)}${colors.reset}`);
        
        // Store link data for analytics
        self._links.set(url, {
          identifier,
          metadata,
          properties,
          controlParams,
          createdAt: new Date().toISOString()
        });

        console.log(`${colors.green}✓ Branch link generated: ${url}${colors.reset}`);
        return { url };
      }
    };
  }

  subscribe(callback) {
    console.log(`${colors.gray}Adding Branch deep link handler${colors.reset}`);
    this._subscribers.add(callback);
    return () => {
      console.log(`${colors.gray}Removing Branch deep link handler${colors.reset}`);
      this._subscribers.delete(callback);
    };
  }

  async handleDeepLink(url) {
    console.log(`\n${colors.yellow}Processing Branch deep link:${colors.reset}`);
    console.log(`${colors.gray}URL: ${url}${colors.reset}`);

    const linkData = this._links.get(url) || {};
    const articleId = url.split('/').pop();

    // Track link click
    this._linkAnalytics.set(url, {
      clicked: true,
      clickedAt: new Date().toISOString(),
      originalData: linkData
    });

    console.log(`${colors.green}✓ Deep link data extracted:${colors.reset}`);
    console.log(`${colors.gray}Article ID: ${articleId}${colors.reset}`);

    // Notify subscribers
    this._subscribers.forEach(callback => {
      callback({
        error: null,
        params: {
          '+clicked_branch_link': true,
          articleId,
          ...linkData.metadata
        },
        uri: url
      });
    });
  }

  getLinkAnalytics(url) {
    return this._linkAnalytics.get(url);
  }
}

// Mock Share API with user interaction simulation
class MockShareAPI {
  async share({ title, message, url }) {
    console.log(`\n${colors.cyan}=== SHARE DIALOG OPENED ===${colors.reset}`);
    console.log(`${colors.cyan}Title: ${title}${colors.reset}`);
    console.log(`${colors.cyan}Message: ${message}${colors.reset}`);
    console.log(`${colors.cyan}URL: ${url}${colors.reset}`);

    // Simulate user selecting share method
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`${colors.green}✓ User selected WhatsApp to share${colors.reset}`);
    
    return {
      action: 'sharedAction',
      activityType: 'com.whatsapp'
    };
  }
}

// Mock Navigation with state tracking
class MockNavigationService {
  constructor() {
    this.currentRoute = 'Home';
    this.history = ['Home'];
    this.params = {};
  }

  navigate(route, params = {}) {
    this.currentRoute = route;
    this.history.push(route);
    this.params = params;

    console.log(`\n${colors.cyan}Navigation:${colors.reset}`);
    console.log(`${colors.gray}Route: ${route}${colors.reset}`);
    console.log(`${colors.gray}Params: ${JSON.stringify(params, null, 2)}${colors.reset}`);
  }

  getCurrentState() {
    return {
      route: this.currentRoute,
      params: this.params,
      history: [...this.history]
    };
  }
}

// Mock Analytics
class MockAnalytics {
  constructor() {
    this._events = [];
  }

  logEvent(name, params = {}) {
    const event = {
      name,
      params,
      timestamp: new Date().toISOString()
    };
    
    this._events.push(event);
    
    console.log(`\n${colors.cyan}Analytics Event:${colors.reset}`);
    console.log(`${colors.gray}Name: ${name}${colors.reset}`);
    console.log(`${colors.gray}Params: ${JSON.stringify(params, null, 2)}${colors.reset}`);
  }

  getEvents() {
    return [...this._events];
  }
}

// Test Runner
async function runBranchSharingTest() {
  console.log(`\n${colors.bright}${colors.blue}========== BRANCH SHARING AND DEEP LINKING TEST ===========${colors.reset}\n`);

  const branch = new MockBranchSDK();
  const share = new MockShareAPI();
  const navigation = new MockNavigationService();
  const analytics = new MockAnalytics();
  let testPassed = true;

  try {
    // Test 1: Branch SDK Initialization
    console.log(`\n${colors.bright}Test 1: Branch SDK Initialization${colors.reset}`);
    await branch.init();

    // Test 2: Branch Link Generation
    console.log(`\n${colors.bright}Test 2: Branch Link Generation${colors.reset}`);
    const buo = await branch.createBranchUniversalObject(`article/${testArticle.id}`, {
      title: testArticle.title,
      contentDescription: testArticle.excerpt,
      contentImageUrl: testArticle.imageUrl,
      contentMetadata: {
        customMetadata: {
          articleId: testArticle.id,
          category: testArticle.category
        }
      }
    });

    const { url } = await buo.generateShortUrl({
      feature: 'sharing',
      channel: 'app',
      tags: ['test']
    });

    // Test 3: Share Dialog
    console.log(`\n${colors.bright}Test 3: Share Dialog${colors.reset}`);
    const shareResult = await share.share({
      title: 'Share Test Article',
      message: `Check out this article: ${testArticle.title}`,
      url
    });

    // Test 4: Analytics Tracking
    console.log(`\n${colors.bright}Test 4: Analytics Tracking${colors.reset}`);
    analytics.logEvent('share_article', {
      article_id: testArticle.id,
      share_method: shareResult.activityType,
      url
    });

    // Setup deep link handling
    branch.subscribe(({ error, params }) => {
      if (!error && params && params['+clicked_branch_link']) {
        const articleId = params.articleId;
        if (articleId) {
          navigation.navigate('ArticleDetail', { 
            articleId,
            fromBranch: true,
            category: params.contentMetadata?.customMetadata?.category
          });
        }
      }
    });

    // Test 5: Deep Link Processing
    console.log(`\n${colors.bright}Test 5: Deep Link Processing${colors.reset}`);
    await branch.handleDeepLink(url);

    // Test 6: Verify Navigation and Parameters
    console.log(`\n${colors.bright}Test 6: Navigation State Verification${colors.reset}`);
    const navState = navigation.getCurrentState();
    
    const expectedRoute = 'ArticleDetail';
    const expectedParams = {
      articleId: testArticle.id,
      fromBranch: true,
      category: testArticle.category
    };

    if (navState.route !== expectedRoute) {
      console.error(`${colors.red}❌ Navigation route mismatch${colors.reset}`);
      console.error(`${colors.red}Expected: ${expectedRoute}, Got: ${navState.route}${colors.reset}`);
      testPassed = false;
    }

    if (JSON.stringify(navState.params) !== JSON.stringify(expectedParams)) {
      console.error(`${colors.red}❌ Navigation params mismatch${colors.reset}`);
      console.error(`${colors.red}Expected: ${JSON.stringify(expectedParams)}${colors.reset}`);
      console.error(`${colors.red}Got: ${JSON.stringify(navState.params)}${colors.reset}`);
      testPassed = false;
    }

    // Test 7: Verify Analytics
    console.log(`\n${colors.bright}Test 7: Analytics Verification${colors.reset}`);
    const events = analytics.getEvents();
    const shareEvent = events.find(e => e.name === 'share_article');
    
    if (!shareEvent) {
      console.error(`${colors.red}❌ Share event not found in analytics${colors.reset}`);
      testPassed = false;
    }

    // Final Results
    if (testPassed) {
      console.log(`\n${colors.bright}${colors.green}✓ All Branch sharing and deep linking tests passed${colors.reset}`);
    } else {
      console.log(`\n${colors.bright}${colors.red}❌ Some tests failed${colors.reset}`);
    }

  } catch (error) {
    console.error(`\n${colors.red}Test failed with error: ${error}${colors.reset}`);
    testPassed = false;
  }

  console.log(`\n${colors.bright}${colors.blue}========== TEST COMPLETE ===========${colors.reset}\n`);
  return testPassed;
}

// Run the test
runBranchSharingTest(); 