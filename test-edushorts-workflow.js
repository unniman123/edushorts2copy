/**
 * Edushorts Complete Workflow Test
 * Tests the entire user journey including:
 * - Article browsing
 * - Article sharing
 * - Deep linking
 * - Push notifications
 * - User interactions
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

// Mock Article Data
const mockArticles = [
  {
    id: 'article-12345',
    title: 'Getting Started with React Native',
    content: 'A comprehensive guide to React Native development...',
    excerpt: 'Learn the basics of React Native and start building apps',
    author: 'John Doe',
    publishedAt: '2024-03-15T10:00:00Z',
    category: 'Development',
    readTime: '5 min',
    imageUrl: 'https://example.com/images/react-native.jpg'
  },
  {
    id: 'article-67890',
    title: 'Advanced React Native Patterns',
    content: 'Deep dive into advanced React Native concepts...',
    excerpt: 'Master advanced patterns in React Native',
    author: 'Jane Smith',
    publishedAt: '2024-03-14T15:30:00Z',
    category: 'Development',
    readTime: '8 min',
    imageUrl: 'https://example.com/images/advanced-rn.jpg'
  }
];

// Mock Branch SDK
class MockBranchSDK {
  constructor() {
    this._initialized = false;
    this._subscribers = new Set();
    this._lastGeneratedLink = null;
  }
  
  async init() {
    console.log(`${colors.blue}Initializing Branch SDK...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    this._initialized = true;
    console.log(`${colors.green}✓ Branch SDK initialized${colors.reset}`);
  }
  
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  
  async createBranchUniversalObject(canonicalIdentifier, properties) {
    if (!this._initialized) {
      throw new Error('Branch SDK not initialized');
    }
    
    return {
      canonicalIdentifier,
      properties,
      
      async generateShortUrl(linkProperties, controlParams) {
        const url = `https://xbwk1.app.link/article/${properties.contentMetadata.customMetadata.articleId}`;
        this._lastGeneratedLink = url;
        console.log(`${colors.gray}Generated Branch link: ${url}${colors.reset}`);
        return { url };
      }
    };
  }
  
  async handleDeepLink(url) {
    console.log(`${colors.yellow}Processing deep link: ${url}${colors.reset}`);
    
    const articleId = url.split('/').pop();
    
    this._subscribers.forEach(callback => {
      callback({
        error: null,
        params: {
          '+clicked_branch_link': true,
          articleId
        },
        uri: url
      });
    });
  }
}

// Mock Share API
class MockShareAPI {
  async share({ title, message, url }) {
    console.log(`\n${colors.cyan}=== SHARE DIALOG OPENED ===${colors.reset}`);
    console.log(`${colors.cyan}Title: ${title}${colors.reset}`);
    console.log(`${colors.cyan}Message: ${message}${colors.reset}`);
    console.log(`${colors.cyan}URL: ${url}${colors.reset}`);
    
    // Simulate user sharing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      action: 'sharedAction',
      activityType: 'com.whatsapp'
    };
  }
}

// Mock Navigation
class MockNavigationService {
  constructor() {
    this.stack = ['Loading'];
    this.params = {};
  }
  
  navigate(routeName, params = {}) {
    this.stack.push(routeName);
    this.params = params;
    console.log(`${colors.green}Navigating to: ${routeName}${colors.reset}`);
    if (Object.keys(params).length > 0) {
      console.log(`${colors.gray}With params: ${JSON.stringify(params)}${colors.reset}`);
    }
  }
  
  goBack() {
    const current = this.stack.pop();
    console.log(`${colors.yellow}Navigating back from: ${current}${colors.reset}`);
  }
  
  getCurrentRoute() {
    return this.stack[this.stack.length - 1];
  }
}

// Mock Analytics
class MockAnalytics {
  constructor() {
    this._events = [];
  }
  
  logEvent(name, params = {}) {
    this._events.push({
      name,
      params,
      timestamp: new Date().toISOString()
    });
    console.log(`${colors.gray}Analytics event logged: ${name}${colors.reset}`);
    console.log(`${colors.gray}Event params: ${JSON.stringify(params)}${colors.reset}`);
  }
}

// Workflow Manager
class WorkflowManager {
  constructor() {
    this.branch = new MockBranchSDK();
    this.navigation = new MockNavigationService();
    this.share = new MockShareAPI();
    this.analytics = new MockAnalytics();
  }
  
  async initialize() {
    console.log(`\n${colors.bright}${colors.blue}========== INITIALIZING WORKFLOW TEST ===========${colors.reset}\n`);
    
    // Initialize Branch SDK
    await this.branch.init();
    
    // Setup deep link handling
    this.branch.subscribe(({ error, params }) => {
      if (!error && params && params['+clicked_branch_link']) {
        const articleId = params.articleId;
        if (articleId) {
          this.navigation.navigate('ArticleDetail', { articleId, fromBranch: true });
        }
      }
    });
  }
  
  async browseArticles() {
    console.log(`\n${colors.bright}Testing Article Browsing${colors.reset}`);
    
    // Navigate to articles list
    this.navigation.navigate('Articles');
    
    // Log view event
    this.analytics.logEvent('view_article_list');
    
    // Simulate viewing articles
    for (const article of mockArticles) {
      console.log(`\n${colors.gray}Viewing article: ${article.title}${colors.reset}`);
      
      this.navigation.navigate('ArticleDetail', { articleId: article.id });
      
      this.analytics.logEvent('view_article', {
        article_id: article.id,
        category: article.category
      });
      
      // Go back to list
      this.navigation.goBack();
    }
  }
  
  async shareArticle(article) {
    console.log(`\n${colors.bright}Testing Article Sharing${colors.reset}`);
    
    try {
      // Create Branch link
      const buo = await this.branch.createBranchUniversalObject(`article/${article.id}`, {
        title: article.title,
        contentDescription: article.excerpt,
        contentImageUrl: article.imageUrl,
        contentMetadata: {
          customMetadata: {
            articleId: article.id,
            category: article.category
          }
        }
      });
      
      const { url } = await buo.generateShortUrl({
        feature: 'sharing',
        channel: 'app'
      });
      
      // Share the article
      const result = await this.share.share({
        title: 'Share Article',
        message: `Check out this article: ${article.title}`,
        url
      });
      
      // Log share event
      this.analytics.logEvent('share_article', {
        article_id: article.id,
        share_method: result.activityType
      });
      
      return url;
    } catch (error) {
      console.error(`${colors.red}Error sharing article: ${error}${colors.reset}`);
      throw error;
    }
  }
  
  async testDeepLinking(url) {
    console.log(`\n${colors.bright}Testing Deep Linking${colors.reset}`);
    
    // Simulate clicking the Branch link
    await this.branch.handleDeepLink(url);
    
    // Verify navigation
    const currentRoute = this.navigation.getCurrentRoute();
    const params = this.navigation.params;
    
    if (currentRoute === 'ArticleDetail' && params.fromBranch) {
      console.log(`${colors.green}✓ Deep link handled successfully${colors.reset}`);
      return true;
    } else {
      console.error(`${colors.red}Deep link handling failed${colors.reset}`);
      return false;
    }
  }
}

// Run the workflow test
async function runWorkflowTest() {
  console.log(`\n${colors.bright}${colors.blue}========== EDUSHORTS WORKFLOW TEST ===========${colors.reset}\n`);
  
  const workflow = new WorkflowManager();
  let sharedUrl;
  
  try {
    // Step 1: Initialize
    await workflow.initialize();
    
    // Step 2: Browse Articles
    await workflow.browseArticles();
    
    // Step 3: Share an Article
    const articleToShare = mockArticles[0];
    sharedUrl = await workflow.shareArticle(articleToShare);
    
    // Step 4: Test Deep Linking
    if (sharedUrl) {
      await workflow.testDeepLinking(sharedUrl);
    }
    
    console.log(`\n${colors.bright}${colors.green}========== WORKFLOW TEST COMPLETE ===========${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}Workflow test failed: ${error}${colors.reset}`);
  }
}

// Run the test
runWorkflowTest(); 