/**
 * Script to verify that problematic dependencies are properly removed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Verifying that problematic dependencies are removed...');

// Check if node_modules directory exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('node_modules directory not found. Run npm install first.');
  process.exit(0);
}

// List of problematic packages to check
const problematicPackages = [
  'expo-battery',
  // Add other problematic packages here if needed
];

// Check if any problematic packages are still installed
let foundProblematic = false;
for (const pkg of problematicPackages) {
  const pkgPath = path.join(nodeModulesPath, pkg);
  if (fs.existsSync(pkgPath)) {
    console.log(`⚠️ Problematic package still installed: ${pkg}`);
    foundProblematic = true;
  } else {
    console.log(`✅ Package successfully removed: ${pkg}`);
  }
}

// Check package.json to make sure dependencies are removed
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  for (const pkg of problematicPackages) {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      console.log(`⚠️ Problematic package still in package.json dependencies: ${pkg}`);
      foundProblematic = true;
    } else if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
      console.log(`⚠️ Problematic package still in package.json devDependencies: ${pkg}`);
      foundProblematic = true;
    } else {
      console.log(`✅ Package not found in package.json: ${pkg}`);
    }
  }
}

// Check if any import statements for problematic packages still exist
console.log('\nChecking for import statements...');

const checkForImports = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git') {
        checkForImports(filePath);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      // Only check JavaScript/TypeScript files
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pkg of problematicPackages) {
        if (content.includes(`import`) && content.includes(pkg)) {
          console.log(`⚠️ Found import for ${pkg} in ${filePath}`);
          foundProblematic = true;
        }
      }
    }
  }
};

// Start checking from current directory
try {
  checkForImports(path.join(process.cwd(), 'src'));
  checkForImports(path.join(process.cwd(), 'app'));
  checkForImports(path.join(process.cwd(), 'components'));
  checkForImports(path.join(process.cwd(), 'screens'));
  checkForImports(path.join(process.cwd(), 'utils'));
} catch (error) {
  console.error(`Error checking imports: ${error.message}`);
}

if (foundProblematic) {
  console.log('\n⚠️ Some problematic dependencies or imports still exist!');
  console.log('Please remove them manually or run `npm uninstall <package-name>` to clean up.');
} else {
  console.log('\n✅ All problematic dependencies have been successfully removed!');
  console.log('You can now build your app with the clean profile: npm run build:android:apk:clean');
}

// Check if a clean build can be done
console.log('\nTo build your app without problematic dependencies, run:');
console.log('npx eas build --platform android --profile production-apk-clean'); 