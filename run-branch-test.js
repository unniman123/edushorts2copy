// Helper script to run the Branch link tests
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.bright}${colors.blue}=== Branch Link Generation Test Runner ===${colors.reset}\n`);

try {
  // Check if the test file exists
  if (!fs.existsSync('./test-branch-links.js')) {
    console.error(`${colors.red}Error: test-branch-links.js not found in the current directory${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Setting up mock jest environment...${colors.reset}`);
  
  // Create a temporary test runner that includes all the necessary mocks
  const tempTestFile = path.join(__dirname, 'temp-test-runner.js');
  
  const setupCode = `
    // Mock required dependencies
    global.jest = { 
      fn: (implementation) => implementation || ((...args) => implementation) 
    };

    // Mock Platform from react-native
    global.Platform = {
      OS: 'android',
      select: (options) => options.android || options.default
    };

    // Mock Linking from expo-linking
    global.Linking = {
      parse: (url) => {
        const [scheme, path] = url.split('://');
        return { scheme, path };
      },
      createURL: (path, options) => {
        const params = options?.queryParams ? 
          '?' + Object.entries(options.queryParams)
            .map(([key, value]) => \`\${key}=\${encodeURIComponent(value)}\`)
            .join('&') 
          : '';
        return \`edushorts://\${path}\${params}\`;
      }
    };

    // Mock __DEV__ global
    global.__DEV__ = true;

    // Run the actual test
    require('./test-branch-links.js');
  `;
  
  fs.writeFileSync(tempTestFile, setupCode);
  
  console.log(`${colors.green}Running Branch link tests...${colors.reset}\n`);
  
  // Run the test script
  execSync(`node "${tempTestFile}"`, { stdio: 'inherit' });
  
  // Clean up the temporary file
  fs.unlinkSync(tempTestFile);
  
  console.log(`\n${colors.bright}${colors.green}✅ Tests completed successfully!${colors.reset}`);
  console.log(`\n${colors.yellow}Note: This is a simulation only. The actual Branch SDK implementation will behave differently in your real app environment. However, the logic for creating unique identifiers and retrying on errors should work the same way.${colors.reset}`);
  
} catch (error) {
  console.error(`\n${colors.bright}${colors.red}❌ Error running tests:${colors.reset}`, error.message);
  // Try to clean up the temporary file if it exists
  try {
    const tempTestFile = path.join(__dirname, 'temp-test-runner.js');
    if (fs.existsSync(tempTestFile)) {
      fs.unlinkSync(tempTestFile);
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
} 