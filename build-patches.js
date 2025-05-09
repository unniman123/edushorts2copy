const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd(); // Assume the script is run from the project root in EAS
const log = (message) => console.log(`[Build Patches] ${message}`);
const logError = (message) => console.error(`[Build Patches Error] ${message}`);
const logDebug = (message) => console.log(`[Build Patches Debug] ${message}`);

log(`Project root (process.cwd()): ${projectRoot}`);
log(`Script directory (__dirname): ${__dirname}`);
log(`Node version: ${process.version}`);

// List directory contents to debug EAS build environment
const listDir = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      log(`Contents of ${dirPath}:`);
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        log(`  ${file} ${stats.isDirectory() ? '(dir)' : `(${stats.size} bytes)`}`);
      });
    } else {
      logError(`Directory not found: ${dirPath}`);
    }
  } catch (error) {
    logError(`Error listing directory ${dirPath}: ${error.message}`);
  }
};

// Utility to patch files with advanced pattern matching
const patchFile = (filePath, patterns, patchName) => {
  log(`Attempting to patch ${patchName}. File path: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    logError(`Patch failed: ${patchName} not found at ${filePath}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    logDebug(`Original file size: ${content.length} bytes`);
    
    let wasPatched = false;
    
    // Apply all patterns provided for this file
    patterns.forEach(({ search, replace, description }) => {
      let searchPattern;
      
      if (typeof search === 'string') {
        searchPattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      } else if (search instanceof RegExp) {
        searchPattern = search;
      } else {
        logError(`Invalid search pattern type for ${description}`);
        return;
      }
      
      if (searchPattern.test(content)) {
        log(`Found pattern for "${description}". Applying patch...`);
        const originalContent = content;
        content = content.replace(searchPattern, replace);
        
        if (content !== originalContent) {
          wasPatched = true;
          log(`✅ Successfully applied patch: ${description}`);
        } else {
          logError(`Pattern matched but no changes made for: ${description}`);
        }
      } else {
        logError(`Pattern not found for: ${description}`);
        // Output fragment of file for debugging
        logDebug(`File fragment (first 300 chars): ${content.substring(0, 300)}...`);
      }
    });
    
    if (wasPatched) {
      fs.writeFileSync(filePath, content);
      log(`✅ File saved with patches: ${patchName}`);
      return true;
    } else {
      logError(`No patches were applied to: ${patchName}`);
      return false;
    }
  } catch (error) {
    logError(`Error patching ${patchName}: ${error.message}`);
    return false;
  }
};

// Main patch function
const runPatches = async () => {
  log('Starting comprehensive build patch process...');
  
  // Check build environment
  listDir(projectRoot);
  listDir(path.join(projectRoot, 'node_modules'));
  
  // Construct paths relative to the determined project root
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  
  // 1. PATCH EXPO-BATTERY
  log('\n------- PATCHING EXPO-BATTERY -------');
  const batteryGradlePath = path.join(
    nodeModulesPath,
    'expo-battery',
    'android',
    'build.gradle'
  );
  
  const batteryPatterns = [
    {
      search: /classifier\s*=\s*['"]sources['"]/g,
      replace: "archiveClassifier = 'sources'",
      description: "Replace classifier with archiveClassifier"
    },
    {
      search: /task\s+androidSourcesJar\(type:\s+Jar\)/g,
      replace: "task androidSourcesJar(type: Jar)",
      description: "Fix androidSourcesJar task declaration"
    }
  ];
  
  const batterySuccess = patchFile(batteryGradlePath, batteryPatterns, 'expo-battery build.gradle');
  
  // 2. PATCH EXPO-MODULES-CORE
  log('\n------- PATCHING EXPO-MODULES-CORE -------');
  const modulesCorePluginPath = path.join(
    nodeModulesPath,
    'expo-modules-core',
    'android',
    'ExpoModulesCorePlugin.gradle'
  );
  
  const corePatterns = [
    {
      search: /components\.release/g,
      replace: 'components.findByName("release") ?: components.getByName("default")',
      description: "Fix SoftwareComponent container release property"
    }
  ];
  
  const coreSuccess = patchFile(modulesCorePluginPath, corePatterns, 'expo-modules-core plugin');
  
  // 3. CREATE FALLBACK PATCHES IF DIRECT PATCHING FAILED
  if (!batterySuccess || !coreSuccess) {
    log('\n------- CREATING FALLBACK PATCH FILES -------');
    
    // Create directory for patches
    const patchesDir = path.join(projectRoot, 'android', 'patches');
    try {
      if (!fs.existsSync(patchesDir)) {
        fs.mkdirSync(patchesDir, { recursive: true });
      }
      
      // Create init.gradle with patches to apply at build time
      const initGradleContent = `
allprojects {
    buildscript {
        repositories {
            // Build script repositories
            google()
            mavenCentral()
        }
    }
    repositories {
        // Module repositories
        google()
        mavenCentral()
    }
    
    // Apply global build script fixes
    afterEvaluate { project ->
        if (project.name == "expo-battery") {
            project.tasks.withType(Jar) { jarTask ->
                if (jarTask.name == 'androidSourcesJar') {
                    jarTask.archiveClassifier.set('sources')
                }
            }
        }
    }
}
`;
      
      const initGradlePath = path.join(patchesDir, 'init.gradle');
      fs.writeFileSync(initGradlePath, initGradleContent);
      log(`✅ Created fallback init.gradle patch at ${initGradlePath}`);
      
      // Set environment variable to use the init script
      process.env.GRADLE_USER_HOME = patchesDir;
      log(`Set GRADLE_USER_HOME to ${patchesDir} for init script loading`);
    } catch (error) {
      logError(`Error creating fallback patches: ${error.message}`);
    }
  }
  
  log('\nBuild patch process completed. Proceed with the build.');
};

// Execute the patching process with error handling
try {
  runPatches().catch(error => {
    logError(`Unhandled error during patching: ${error.message}`);
    logError(error.stack);
    process.exit(1);
  });
} catch (error) {
  logError(`Fatal error: ${error.message}`);
  logError(error.stack);
  process.exit(1);
}
