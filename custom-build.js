/**
 * Custom build script for handling Expo Gradle compatibility issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color formatting for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '';
  
  switch (type) {
    case 'success':
      prefix = `${colors.green}✓${colors.reset} `;
      break;
    case 'warning':
      prefix = `${colors.yellow}⚠${colors.reset} `;
      break;
    case 'error':
      prefix = `${colors.red}✗${colors.reset} `;
      break;
    case 'step':
      console.log(`\n${colors.cyan}${colors.bright}=== ${message} ===${colors.reset}\n`);
      return;
    default:
      prefix = `${colors.dim}[${timestamp}]${colors.reset} `;
  }
  
  console.log(`${prefix}${message}`);
}

// Main build process
async function main() {
  try {
    log('Starting comprehensive build process', 'step');
    
    // 1. Patch Expo modules with Gradle compatibility fixes
    log('Patching Expo modules for Gradle compatibility');
    
    // Define paths to files that need patching
    const batteryPath = path.join(process.cwd(), 'node_modules', 'expo-battery', 'android', 'build.gradle');
    const corePath = path.join(process.cwd(), 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');
    
    // Patch expo-battery build.gradle
    if (fs.existsSync(batteryPath)) {
      let content = fs.readFileSync(batteryPath, 'utf8');
      
      if (content.includes('classifier = \'sources\'') || content.includes('classifier = "sources"')) {
        content = content.replace(/classifier\s+=\s+['"]sources['"]/g, 'archiveClassifier = \'sources\'');
        fs.writeFileSync(batteryPath, content);
        log('Patched expo-battery build.gradle', 'success');
      } else {
        log('No matching pattern found in expo-battery, skipping patch', 'warning');
      }
    } else {
      log('expo-battery build.gradle not found', 'warning');
    }
    
    // Patch expo-modules-core plugin
    if (fs.existsSync(corePath)) {
      let content = fs.readFileSync(corePath, 'utf8');
      
      if (content.includes('components.release')) {
        content = content.replace(/components\.release/g, 'components.findByName("release") ?: components.getByName("default")');
        fs.writeFileSync(corePath, content);
        log('Patched expo-modules-core plugin', 'success');
      } else {
        log('No matching pattern found in expo-modules-core, skipping patch', 'warning');
      }
    } else {
      log('expo-modules-core plugin not found', 'warning');
    }
    
    // 2. Clean Android build
    log('Cleaning Android build', 'step');
    try {
      execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
      log('Android project cleaned successfully', 'success');
    } catch (error) {
      log('Error cleaning Android project: ' + error.message, 'error');
      log('Continuing with build process anyway...');
    }
    
    // 3. Start EAS build with optimized profile
    log('Starting EAS build with production-apk profile', 'step');
    execSync('eas build --platform android --profile production-apk --non-interactive', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        GRADLE_OPTS: "-Dorg.gradle.project.org.gradle.internal.publish.checksums.insecure=true"
      }
    });
    
    log('Build process completed! Check EAS dashboard for your APK.', 'success');
  } catch (error) {
    log('Build failed: ' + error.message, 'error');
    process.exit(1);
  }
}

// Run the build process
main(); 