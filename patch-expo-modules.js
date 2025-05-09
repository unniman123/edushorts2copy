/**
 * This script patches Expo modules to fix Gradle compatibility issues
 * Run this script before building the Android APK
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting Expo modules patch process...');

// Patch expo-battery build.gradle
const batteryGradlePath = path.join(
  __dirname, 
  'node_modules', 
  'expo-battery', 
  'android', 
  'build.gradle'
);

if (fs.existsSync(batteryGradlePath)) {
  console.log('Patching expo-battery build.gradle...');
  let content = fs.readFileSync(batteryGradlePath, 'utf8');
  
  // Replace classifier with archiveClassifier for Gradle 8+ compatibility
  if (content.includes('classifier = \'sources\'')) {
    content = content.replace(
      /classifier\s+=\s+['"]sources['"]/g,
      'archiveClassifier = \'sources\''
    );
    fs.writeFileSync(batteryGradlePath, content);
    console.log('✅ Successfully patched expo-battery build.gradle');
  } else {
    console.log('⚠️ No changes needed for expo-battery build.gradle');
  }
} else {
  console.log('⚠️ expo-battery build.gradle not found');
}

// Patch expo-modules-core ExpoModulesCorePlugin.gradle
const modulesCorePluginPath = path.join(
  __dirname,
  'node_modules',
  'expo-modules-core',
  'android',
  'ExpoModulesCorePlugin.gradle'
);

if (fs.existsSync(modulesCorePluginPath)) {
  console.log('Patching expo-modules-core plugin...');
  let content = fs.readFileSync(modulesCorePluginPath, 'utf8');
  
  // Fix SoftwareComponent container issue
  if (content.includes('components.release')) {
    content = content.replace(
      /components\.release/g,
      'components.findByName("release") ?: components.getByName("default")'
    );
    fs.writeFileSync(modulesCorePluginPath, content);
    console.log('✅ Successfully patched expo-modules-core plugin');
  } else {
    console.log('⚠️ No changes needed for expo-modules-core plugin');
  }
} else {
  console.log('⚠️ expo-modules-core plugin not found');
}

// Clean Gradle cache and project
try {
  console.log('Cleaning Android project...');
  execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
  console.log('✅ Android project cleaned successfully');
} catch (error) {
  console.error('⚠️ Error cleaning Android project:', error.message);
}

console.log('Patch process completed'); 