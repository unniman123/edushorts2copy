/**
 * Unified Build Patch Script
 * Consolidates all build system patches into a single, robust solution
 * 
 * This script replaces:
 * - master-patch.js
 * - build-patches.js
 * - android-gradle-fix.js
 * - patch-gradle-properties.js
 * 
 * SAFETY MEASURES:
 * - Preserves existing gradle.properties optimizations
 * - Implements rollback capability
 * - Comprehensive error handling
 * - Incremental patching with validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const log = (message) => console.log(`[Unified Patch] ${message}`);
const logError = (message) => console.error(`[Unified Patch Error] ${message}`);
const logSuccess = (message) => console.log(`[Unified Patch Success] ✅ ${message}`);

// Track all changes for rollback capability
const changeLog = [];

/**
 * Backup file before modification
 */
const backupFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    changeLog.push({ type: 'backup', original: filePath, backup: backupPath });
    log(`Backed up ${filePath} to ${backupPath}`);
    return backupPath;
  }
  return null;
};

/**
 * Safely modify file with pattern replacement
 */
const safeFileModify = (filePath, patterns, description) => {
  if (!fs.existsSync(filePath)) {
    logError(`File not found: ${filePath}`);
    return false;
  }

  const backupPath = backupFile(filePath);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let wasModified = false;

    patterns.forEach(({ search, replace, description: patternDesc }) => {
      const searchPattern = typeof search === 'string' 
        ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        : search;
      
      if (searchPattern.test(content)) {
        content = content.replace(searchPattern, replace);
        wasModified = true;
        log(`Applied pattern: ${patternDesc}`);
      }
    });

    if (wasModified) {
      fs.writeFileSync(filePath, content);
      changeLog.push({ type: 'modify', filePath, backup: backupPath });
      logSuccess(`${description} - Modified ${filePath}`);
      return true;
    } else {
      log(`${description} - No changes needed for ${filePath}`);
      return true;
    }
  } catch (error) {
    logError(`Error modifying ${filePath}: ${error.message}`);
    return false;
  }
};

/**
 * 1. GRADLE PROPERTIES OPTIMIZATION
 * Preserves Step 1 optimizations and adds compatibility fixes
 */
const optimizeGradleProperties = () => {
  log('\n==== GRADLE PROPERTIES OPTIMIZATION ====');
  
  const gradlePropsPath = path.join(projectRoot, 'android', 'gradle.properties');
  
  if (!fs.existsSync(gradlePropsPath)) {
    logError('gradle.properties not found');
    return false;
  }

  let content = fs.readFileSync(gradlePropsPath, 'utf8');
  
  // Remove deprecated properties that cause build failures
  const deprecatedProps = [
    'android.disableAutomaticComponentCreation'
  ];

  deprecatedProps.forEach(prop => {
    const propRegex = new RegExp(`^${prop}=.*\\n?`, 'm');
    if (propRegex.test(content)) {
      content = content.replace(propRegex, '');
      log(`Removed deprecated property: ${prop}`);
    }
  });

  // Add essential compatibility properties (only if not already present)
  const essentialProps = [
    { key: 'android.enableJetifier', value: 'true' },
    { key: 'android.useAndroidX', value: 'true' },
    { key: 'org.gradle.internal.publish.checksums.insecure', value: 'true' }
  ];

  essentialProps.forEach(({ key, value }) => {
    const propRegex = new RegExp(`^${key}=.*`, 'm');
    if (!propRegex.test(content)) {
      content += `\n${key}=${value}`;
      log(`Added essential property: ${key}=${value}`);
    }
  });

  // CRITICAL: Preserve Step 1 optimizations - DO NOT MODIFY JVM ARGS OR PERFORMANCE SETTINGS
  // Verify our Step 1 optimizations are still present
  const step1Optimizations = [
    'org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+UseG1GC',
    'org.gradle.parallel=true',
    'org.gradle.caching=true',
    'org.gradle.configureondemand=true'
  ];

  let preservationCheck = true;
  step1Optimizations.forEach(optimization => {
    if (!content.includes(optimization)) {
      logError(`CRITICAL: Step 1 optimization missing: ${optimization}`);
      preservationCheck = false;
    } else {
      log(`✅ Step 1 optimization preserved: ${optimization}`);
    }
  });

  if (!preservationCheck) {
    logError('ABORTING: Step 1 optimizations would be lost. Skipping gradle.properties modification.');
    return false;
  }
  
  fs.writeFileSync(gradlePropsPath, content);
  changeLog.push({ type: 'modify', filePath: gradlePropsPath });
  logSuccess('Gradle properties optimized while preserving Step 1 improvements');
  return true;
};

/**
 * 2. EXPO MODULE PATCHES
 * Fix compatibility issues with expo-battery and expo-modules-core
 * Enhanced with graceful module detection and handling
 */
const patchExpoModules = () => {
  log('\n==== EXPO MODULE PATCHES ====');
  
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  let patchResults = [];
  
  // 2.1 Patch expo-battery (with graceful handling)
  const batteryModulePath = path.join(nodeModulesPath, 'expo-battery');
  const batteryGradlePath = path.join(batteryModulePath, 'android', 'build.gradle');
  
  if (fs.existsSync(batteryModulePath)) {
    log('expo-battery module detected - attempting to patch...');
    
    const batteryPatterns = [
      {
        search: /classifier\s*=\s*['"]sources['"]/g,
        replace: "archiveClassifier = 'sources'",
        description: "Replace classifier with archiveClassifier"
      },
      {
        search: /task\s+androidSourcesJar\(type:\s+Jar\)\s*\{[\s\S]*?\}/g,
        replace: fs.readFileSync(path.join(projectRoot, 'expo-battery-patch.gradle'), 'utf8'),
        description: "Replace androidSourcesJar task with fixed version"
      }
    ];
    
    const batterySuccess = safeFileModify(batteryGradlePath, batteryPatterns, 'Expo Battery Patch');
    patchResults.push({ module: 'expo-battery', success: batterySuccess, required: false });
  } else {
    log('expo-battery module not found - skipping patch (runtime fallback will handle compatibility)');
    patchResults.push({ module: 'expo-battery', success: true, required: false, skipped: true });
  }
  
  // 2.2 Patch expo-modules-core (usually required)
  const modulesCoreModulePath = path.join(nodeModulesPath, 'expo-modules-core');
  const modulesCorePluginPath = path.join(modulesCoreModulePath, 'android', 'ExpoModulesCorePlugin.gradle');
  
  if (fs.existsSync(modulesCoreModulePath)) {
    log('expo-modules-core module detected - attempting to patch...');
    
    const corePatterns = [
      {
        search: /components\.release/g,
        replace: 'components.findByName("release") ?: components.getByName("default")',
        description: "Fix SoftwareComponent container release property"
      }
    ];
    
    const coreSuccess = safeFileModify(modulesCorePluginPath, corePatterns, 'Expo Modules Core Patch');
    patchResults.push({ module: 'expo-modules-core', success: coreSuccess, required: true });
  } else {
    logError('expo-modules-core module not found - this may cause build issues');
    patchResults.push({ module: 'expo-modules-core', success: false, required: true, skipped: true });
  }
  
  // Enhanced result reporting
  const requiredPatches = patchResults.filter(result => result.required);
  const optionalPatches = patchResults.filter(result => !result.required);
  
  log('\n--- EXPO MODULE PATCH RESULTS ---');
  requiredPatches.forEach(result => {
    if (result.success) {
      logSuccess(`Required: ${result.module} - ${result.skipped ? 'SKIPPED (not found)' : 'PATCHED'}`);
    } else {
      logError(`Required: ${result.module} - FAILED`);
    }
  });
  
  optionalPatches.forEach(result => {
    if (result.success) {
      log(`Optional: ${result.module} - ${result.skipped ? 'SKIPPED (not found, runtime fallback available)' : 'PATCHED'}`);
    } else {
      log(`Optional: ${result.module} - FAILED (runtime fallback available)`);
    }
  });
  
  // Return success if all required patches succeeded
  const allRequiredSuccessful = requiredPatches.every(result => result.success);
  return allRequiredSuccessful;
};

/**
 * 3. ANDROID APP BUILD.GRADLE FIXES
 * Ensure proper Gradle 8.0+ compatibility
 */
const fixAndroidAppBuildGradle = () => {
  log('\n==== ANDROID APP BUILD.GRADLE FIXES ====');
  
  const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
  
  const appPatterns = [
    {
      search: /compile\s+/g,
      replace: 'implementation ',
      description: "Replace deprecated 'compile' with 'implementation'"
    },
    {
      search: /provided\s+/g,
      replace: 'compileOnly ',
      description: "Replace deprecated 'provided' with 'compileOnly'"
    }
  ];
  
  return safeFileModify(appBuildGradlePath, appPatterns, 'Android App Build.gradle Fix');
};

/**
 * 4. CREATE GRADLE INIT SCRIPT FALLBACK
 * Provides runtime fixes for any remaining issues
 */
const createGradleInitScript = () => {
  log('\n==== GRADLE INIT SCRIPT FALLBACK ====');
  
  const initScriptDir = path.join(projectRoot, 'android', 'gradle', 'init.d');
  
  if (!fs.existsSync(initScriptDir)) {
    fs.mkdirSync(initScriptDir, { recursive: true });
  }
  
  // Clean up legacy gradle init scripts to prevent duplication
  const legacyScripts = [
    'fix-gradle-compatibility.gradle',
    'gradle-compatibility-fix.gradle'
  ];
  
  legacyScripts.forEach(legacyScript => {
    const legacyPath = path.join(initScriptDir, legacyScript);
    if (fs.existsSync(legacyPath)) {
      log(`Removing legacy gradle init script: ${legacyScript}`);
      fs.unlinkSync(legacyPath);
      changeLog.push({ type: 'delete', filePath: legacyPath });
    }
  });
  
  const initScriptContent = `
// Unified Gradle Init Script - Runtime fixes for build compatibility
initscript {
    repositories {
        mavenCentral()
        google()
    }
}

allprojects {
    buildscript {
        repositories {
            google()
            mavenCentral()
        }
    }
    
    // Fix for expo-battery at runtime
    afterEvaluate { project ->
        if (project.name == 'expo-battery') {
            project.tasks.withType(Jar) { jarTask ->
                if (jarTask.name == 'androidSourcesJar') {
                    jarTask.archiveClassifier.set('sources')
                }
            }
        }
    }
    
    // General compatibility fixes
    project.plugins.whenPluginAdded { plugin ->
        if (plugin.class.name.contains('com.android.build.gradle.AppPlugin') || 
            plugin.class.name.contains('com.android.build.gradle.LibraryPlugin')) {
            
            project.android.buildTypes.all { buildType ->
                if (buildType.name == "release") {
                    project.tasks.withType(Jar) { task ->
                        if (task.name.contains('Release')) {
                            task.from(project.android.sourceSets.main.java.srcDirs)
                        }
                    }
                }
            }
        }
    }
}
`;
  
  const initScriptPath = path.join(initScriptDir, 'unified-build-fixes.gradle');
  fs.writeFileSync(initScriptPath, initScriptContent);
  changeLog.push({ type: 'create', filePath: initScriptPath });
  logSuccess('Gradle init script created');
  return true;
};

/**
 * 5. ROLLBACK CAPABILITY
 * Restore all files to their original state if needed
 */
const rollback = () => {
  log('\n==== ROLLBACK INITIATED ====');
  
  changeLog.reverse().forEach(change => {
    try {
      if (change.type === 'backup' && change.backup) {
        if (fs.existsSync(change.backup)) {
          fs.copyFileSync(change.backup, change.original);
          fs.unlinkSync(change.backup);
          log(`Restored ${change.original} from backup`);
        }
      } else if (change.type === 'create' && change.filePath) {
        if (fs.existsSync(change.filePath)) {
          fs.unlinkSync(change.filePath);
          log(`Removed created file ${change.filePath}`);
        }
      }
    } catch (error) {
      logError(`Error during rollback: ${error.message}`);
    }
  });
  
  logSuccess('Rollback completed');
};

/**
 * MAIN EXECUTION
 */
const main = async () => {
  log('Starting unified build patch process...');
  log(`Project root: ${projectRoot}`);
  
  try {
    // Execute all patches in sequence
    const results = [
      optimizeGradleProperties(),
      patchExpoModules(),
      fixAndroidAppBuildGradle(),
      createGradleInitScript()
    ];
    
    const allSuccessful = results.every(result => result === true);
    
    if (allSuccessful) {
      logSuccess('All patches applied successfully!');
      log('Build system is now optimized and ready for use.');
      
      // Clean up old backup files (keep only recent ones)
      const backupFiles = changeLog.filter(change => change.type === 'backup');
      if (backupFiles.length > 10) {
        log('Cleaning up old backup files...');
        backupFiles.slice(0, -5).forEach(backup => {
          if (fs.existsSync(backup.backup)) {
            fs.unlinkSync(backup.backup);
          }
        });
      }
    } else {
      logError('Some patches failed. Build system may still work, but consider manual review.');
    }
    
  } catch (error) {
    logError(`Fatal error during patching: ${error.message}`);
    log('Initiating rollback...');
    rollback();
    process.exit(1);
  }
};

// Handle rollback command
if (process.argv.includes('--rollback')) {
  rollback();
} else {
  main();
}

module.exports = { main, rollback }; 