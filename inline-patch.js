/**
 * Direct inline patching script for Expo modules with Gradle compatibility issues
 */

const fs = require('fs');
const path = require('path');

// Define paths to files that need patching
const batteryPath = path.join(process.cwd(), 'node_modules', 'expo-battery', 'android', 'build.gradle');
const corePath = path.join(process.cwd(), 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

console.log('Starting direct patching of Expo modules...');

// Patch expo-battery build.gradle
if (fs.existsSync(batteryPath)) {
  console.log('Patching expo-battery build.gradle file...');
  let content = fs.readFileSync(batteryPath, 'utf8');
  
  if (content.includes('classifier = \'sources\'') || content.includes('classifier = "sources"')) {
    // Replace 'classifier' with 'archiveClassifier' for Gradle 8+ compatibility
    content = content.replace(/classifier\s+=\s+['"]sources['"]/g, 'archiveClassifier = \'sources\'');
    fs.writeFileSync(batteryPath, content);
    console.log('✅ Successfully patched expo-battery');
  } else {
    console.log('⚠️ No matching pattern found in expo-battery file');
    console.log('Content snippet:', content.substring(0, 500)); // Show beginning of file for debugging
  }
} else {
  console.log('⚠️ expo-battery build.gradle file not found at:', batteryPath);
}

// Patch expo-modules-core ExpoModulesCorePlugin.gradle
if (fs.existsSync(corePath)) {
  console.log('Patching expo-modules-core plugin file...');
  let content = fs.readFileSync(corePath, 'utf8');
  
  if (content.includes('components.release')) {
    // Fix SoftwareComponent container issue
    content = content.replace(/components\.release/g, 'components.findByName("release") ?: components.getByName("default")');
    fs.writeFileSync(corePath, content);
    console.log('✅ Successfully patched expo-modules-core');
  } else {
    console.log('⚠️ No matching pattern found in expo-modules-core file');
    console.log('Content snippet:', content.substring(0, 500)); // Show beginning of file for debugging
  }
} else {
  console.log('⚠️ expo-modules-core plugin file not found at:', corePath);
}

console.log('Patching complete. You can now proceed with the build.'); 