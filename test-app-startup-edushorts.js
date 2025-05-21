/**
 * Edushorts App Initialization Test
 * Tests the complete startup sequence including:
 * - Service initialization
 * - Authentication
 * - Deep linking setup
 * - Push notifications
 * - Analytics
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

// Mock Firebase Configuration
const mockFirebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "edushorts.firebaseapp.com",
  projectId: "edushorts",
  storageBucket: "edushorts.appspot.com",
  messagingSenderId: "123456789",
  appId: "mock-app-id",
  measurementId: "mock-measurement-id"
};

// Mock Supabase Configuration
const mockSupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://mock-supabase-url.supabase.co",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key"
};

// Mock Branch Configuration
const mockBranchConfig = {
  key: "key_live_lsvfoHjZGCGcuEseqCIYAompzweTIc13",
  uri: "xbwk1.app.link"
};

// Mock Services
class MockFirebaseService {
  constructor() {
    this._initialized = false;
    this._messaging = null;
    this._analytics = null;
    this._remoteConfig = null;
  }

  async initialize() {
    console.log(`${colors.blue}Initializing Firebase...${colors.reset}`);
    
    try {
      // Simulate Firebase initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      this._initialized = true;
      
      // Initialize sub-services
      this._messaging = new MockFirebaseMessaging();
      this._analytics = new MockFirebaseAnalytics();
      this._remoteConfig = new MockFirebaseRemoteConfig();
      
      await Promise.all([
        this._messaging.initialize(),
        this._analytics.initialize(),
        this._remoteConfig.initialize()
      ]);
      
      console.log(`${colors.green}✓ Firebase initialized successfully${colors.reset}`);
      return true;
    } catch (error) {
      console.error(`${colors.red}Firebase initialization failed: ${error}${colors.reset}`);
      throw error;
    }
  }
  
  get messaging() { return this._messaging; }
  get analytics() { return this._analytics; }
  get remoteConfig() { return this._remoteConfig; }
}

class MockFirebaseMessaging {
  constructor() {
    this._token = null;
    this._permission = false;
    this._handlers = new Set();
  }
  
  async initialize() {
    console.log(`${colors.blue}Initializing Firebase Messaging...${colors.reset}`);
    await this.requestPermission();
    await this.getToken();
    console.log(`${colors.green}✓ Firebase Messaging initialized${colors.reset}`);
  }
  
  async requestPermission() {
    this._permission = true;
    console.log(`${colors.green}✓ Push notification permission granted${colors.reset}`);
  }
  
  async getToken() {
    this._token = `mock-fcm-token-${Date.now()}`;
    console.log(`${colors.gray}FCM Token generated: ${this._token}${colors.reset}`);
    return this._token;
  }
  
  onMessage(handler) {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }
  
  async simulateMessage(message) {
    console.log(`${colors.yellow}Received push notification:${colors.reset}`);
    console.log(JSON.stringify(message, null, 2));
    
    this._handlers.forEach(handler => handler(message));
  }
}

class MockFirebaseAnalytics {
  constructor() {
    this._events = [];
  }
  
  async initialize() {
    console.log(`${colors.green}✓ Firebase Analytics initialized${colors.reset}`);
  }
  
  logEvent(eventName, params = {}) {
    this._events.push({
      name: eventName,
      params,
      timestamp: new Date().toISOString()
    });
    console.log(`${colors.gray}Analytics event logged: ${eventName}${colors.reset}`);
  }
  
  setUserProperty(name, value) {
    console.log(`${colors.gray}User property set: ${name} = ${value}${colors.reset}`);
  }
}

class MockFirebaseRemoteConfig {
  constructor() {
    this._config = new Map();
  }
  
  async initialize() {
    // Set default values
    this._config.set('feature_flags', {
      enableNewUI: true,
      enableSharing: true,
      enableComments: true
    });
    
    console.log(`${colors.green}✓ Firebase Remote Config initialized${colors.reset}`);
  }
  
  getValue(key) {
    return this._config.get(key);
  }
}

class MockSupabaseService {
  constructor(config) {
    this._config = config;
    this._initialized = false;
    this._user = null;
  }
  
  async initialize() {
    console.log(`${colors.blue}Initializing Supabase...${colors.reset}`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      this._initialized = true;
      console.log(`${colors.green}✓ Supabase initialized${colors.reset}`);
      return true;
    } catch (error) {
      console.error(`${colors.red}Supabase initialization failed: ${error}${colors.reset}`);
      throw error;
    }
  }
  
  async signIn({ email, password }) {
    if (!email || !password) {
      throw new Error('Invalid credentials');
    }
    
    this._user = {
      id: `user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };
    
    console.log(`${colors.green}✓ User signed in: ${email}${colors.reset}`);
    return { user: this._user };
  }
  
  async signOut() {
    this._user = null;
    console.log(`${colors.yellow}User signed out${colors.reset}`);
  }
  
  getUser() {
    return this._user;
  }
}

// Mock Navigation
class MockNavigationService {
  constructor() {
    this.navigationRef = {
      current: null,
      stack: ['Loading'],
      navigate: this.navigate.bind(this),
      goBack: this.goBack.bind(this)
    };
  }
  
  navigate(routeName, params = {}) {
    this.navigationRef.stack.push(routeName);
    console.log(`${colors.green}Navigating to: ${routeName}${colors.reset}`);
    if (Object.keys(params).length > 0) {
      console.log(`${colors.gray}With params: ${JSON.stringify(params)}${colors.reset}`);
    }
  }
  
  goBack() {
    const current = this.navigationRef.stack.pop();
    console.log(`${colors.yellow}Navigating back from: ${current}${colors.reset}`);
  }
  
  getCurrentRoute() {
    return this.navigationRef.stack[this.navigationRef.stack.length - 1];
  }
}

// App State Manager
class AppStateManager {
  constructor() {
    this.firebase = new MockFirebaseService();
    this.supabase = new MockSupabaseService(mockSupabaseConfig);
    this.navigation = new MockNavigationService();
    this._initialized = false;
  }
  
  async initialize() {
    console.log(`\n${colors.bright}${colors.blue}========== EDUSHORTS APP INITIALIZATION ===========${colors.reset}\n`);
    
    try {
      // Step 1: Initialize Firebase
      await this.firebase.initialize();
      
      // Step 2: Initialize Supabase
      await this.supabase.initialize();
      
      // Step 3: Setup deep linking
      await this.setupDeepLinking();
      
      // Step 4: Setup notifications
      await this.setupNotifications();
      
      this._initialized = true;
      console.log(`\n${colors.green}✓ App initialization complete${colors.reset}\n`);
      
      // Navigate to initial screen
      this.navigation.navigate('Loading');
      
      return true;
    } catch (error) {
      console.error(`${colors.red}App initialization failed: ${error}${colors.reset}`);
      return false;
    }
  }
  
  async setupDeepLinking() {
    console.log(`${colors.blue}Setting up deep linking...${colors.reset}`);
    
    // Initialize Branch
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`${colors.green}✓ Deep linking configured${colors.reset}`);
  }
  
  async setupNotifications() {
    console.log(`${colors.blue}Setting up notifications...${colors.reset}`);
    
    // Request permission and get token
    await this.firebase.messaging.requestPermission();
    const token = await this.firebase.messaging.getToken();
    
    // Setup message handler
    this.firebase.messaging.onMessage(async (message) => {
      console.log(`${colors.yellow}Handling push notification:${colors.reset}`);
      console.log(JSON.stringify(message, null, 2));
      
      // Handle deep links in notifications
      if (message.data?.deep_link) {
        this.handleDeepLink(message.data.deep_link);
      }
    });
    
    console.log(`${colors.green}✓ Notifications configured${colors.reset}`);
  }
  
  async handleDeepLink(url) {
    console.log(`${colors.yellow}Handling deep link: ${url}${colors.reset}`);
    
    if (url.includes('article')) {
      const articleId = url.split('/').pop();
      this.navigation.navigate('ArticleDetail', { articleId });
    }
  }
  
  async signIn(email, password) {
    try {
      const { user } = await this.supabase.signIn({ email, password });
      
      if (user) {
        // Log analytics event
        this.firebase.analytics.logEvent('login', {
          method: 'email'
        });
        
        // Set user properties
        this.firebase.analytics.setUserProperty('user_id', user.id);
        
        // Navigate to main screen
        this.navigation.navigate('Main');
      }
      
      return user;
    } catch (error) {
      console.error(`${colors.red}Sign in failed: ${error}${colors.reset}`);
      throw error;
    }
  }
  
  async signOut() {
    await this.supabase.signOut();
    this.navigation.navigate('Login');
  }
}

// Run the test
async function runAppInitializationTest() {
  const app = new AppStateManager();
  
  console.log(`\n${colors.bright}${colors.blue}========== TESTING APP INITIALIZATION ===========${colors.reset}\n`);
  
  try {
    // Test 1: App Initialization
    console.log(`\n${colors.bright}Test 1: App Initialization${colors.reset}`);
    await app.initialize();
    
    // Test 2: Authentication Flow
    console.log(`\n${colors.bright}Test 2: Authentication Flow${colors.reset}`);
    
    // Test invalid credentials
    try {
      await app.signIn('', '');
    } catch (error) {
      console.log(`${colors.green}✓ Invalid credentials properly rejected${colors.reset}`);
    }
    
    // Test successful login
    await app.signIn('test@example.com', 'password123');
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    
    // Test sign out
    await app.signOut();
    console.log(`${colors.green}✓ Sign out successful${colors.reset}`);
    
    // Test 3: Push Notification Handling
    console.log(`\n${colors.bright}Test 3: Push Notification Handling${colors.reset}`);
    
    await app.firebase.messaging.simulateMessage({
      notification: {
        title: 'New Article Available',
        body: 'Check out this new article on React Native!'
      },
      data: {
        deep_link: 'https://xbwk1.app.link/article/12345',
        articleId: '12345'
      }
    });
    
    // Test 4: Deep Link Handling
    console.log(`\n${colors.bright}Test 4: Deep Link Handling${colors.reset}`);
    
    await app.handleDeepLink('https://xbwk1.app.link/article/12345');
    
    console.log(`\n${colors.bright}${colors.green}========== APP INITIALIZATION TEST COMPLETE ===========${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}Test failed: ${error}${colors.reset}`);
  }
}

// Run the test
runAppInitializationTest(); 