/**
 * Script to check and patch the Android app build.gradle file
 * This addresses compatibility issues with Gradle 8.0+
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');

console.log(`Checking Android app build.gradle at: ${appBuildGradlePath}`);

try {
  if (!fs.existsSync(appBuildGradlePath)) {
    console.error(`Android app build.gradle not found at: ${appBuildGradlePath}`);
    process.exit(1);
  }

  // Read the current content
  let content = fs.readFileSync(appBuildGradlePath, 'utf8');
  console.log(`Successfully read Android app build.gradle (${content.length} bytes)`);

  // Check if we need to make any modifications
  const originalContent = content;
  
  // 1. Check and ensure proper plugin application order
  // The error often occurs when the Android plugin is not properly applied
  if (!content.includes("apply plugin: 'com.android.application'")) {
    // If application plugin is missing, add it at the beginning
    console.log("Adding Android application plugin at the top of build.gradle");
    content = "apply plugin: 'com.android.application'\n" + content;
  }

  // 2. Ensure no deprecated namespace configurations
  // In Gradle 8.0+, namespace must be properly set
  if (content.includes('android {') && !content.includes('namespace')) {
    console.log("Adding namespace configuration to android block");
    
    // Extract applicationId to use as namespace
    const applicationIdMatch = content.match(/applicationId\s+['"]([^'"]+)['"]/);
    const namespace = applicationIdMatch ? applicationIdMatch[1] : "com.ajilkojilgokulravi.unniman";
    
    // Add namespace to android block
    content = content.replace(
      /android\s*\{/,
      `android {\n    namespace "${namespace}"`
    );
  }

  // 3. Update dependency configurations for Gradle 8.0+
  // Replace deprecated compile/provided with implementation/compileOnly
  content = content.replace(/compile\s+/g, 'implementation ');
  content = content.replace(/provided\s+/g, 'compileOnly ');
  
  // 4. Fix any deprecated classpaths in buildscript block
  if (content.includes('buildscript {')) {
    // Make sure all classpaths have explicit versions
    content = content.replace(
      /classpath\s+['"]com\.android\.tools\.build:gradle['"]/g,
      "classpath 'com.android.tools.build:gradle:8.0.2'"
    );
  }

  // Save the file if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(appBuildGradlePath, content);
    console.log('✅ Successfully updated Android app build.gradle');
  } else {
    console.log('No changes needed in Android app build.gradle');
  }
  
  // Check for problematic build.gradle files in the project
  console.log('\nChecking for problematic build.gradle files in the project...');
  
  const checkGradleFiles = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Check subdirectories, but avoid node_modules which is huge
        if (file !== 'node_modules') {
          checkGradleFiles(filePath);
        }
      } else if (file === 'build.gradle') {
        // Check all build.gradle files for the deprecated property
        const gradleContent = fs.readFileSync(filePath, 'utf8');
        if (gradleContent.includes('disableAutomaticComponentCreation')) {
          console.log(`Found deprecated property in: ${filePath}`);
          
          // Remove or comment out the problematic property
          const updatedContent = gradleContent.replace(
            /android\.disableAutomaticComponentCreation\s*=\s*true/g,
            '// android.disableAutomaticComponentCreation=true (removed - deprecated in Gradle 8.0+)'
          );
          
          if (updatedContent !== gradleContent) {
            fs.writeFileSync(filePath, updatedContent);
            console.log(`✅ Fixed deprecated property in: ${filePath}`);
          }
        }
      }
    }
  };
  
  // Start checking from android directory
  checkGradleFiles(path.join(projectRoot, 'android'));
  
  console.log('Android Gradle fix process completed');
} catch (error) {
  console.error(`Error fixing Android Gradle files: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} 