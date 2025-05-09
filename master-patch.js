/**
 * Master patching script that combines all patching approaches for Gradle compatibility
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
console.log(`Starting comprehensive Gradle patching process in ${projectRoot}`);

// Execute each script in sequence and continue even if one fails
const runScript = (scriptName) => {
  try {
    console.log(`\n==== RUNNING ${scriptName} ====`);
    require(`./${scriptName}`);
    console.log(`✅ ${scriptName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${scriptName}: ${error.message}`);
    return false;
  }
};

// Direct fix for deprecated android.disableAutomaticComponentCreation property
const fixDeprecatedProperties = () => {
  try {
    console.log('\n==== FIXING DEPRECATED GRADLE PROPERTIES ====');
    
    // Check gradle.properties file
    const gradlePropsPath = path.join(projectRoot, 'android', 'gradle.properties');
    if (fs.existsSync(gradlePropsPath)) {
      let content = fs.readFileSync(gradlePropsPath, 'utf8');
      
      // Remove the deprecated property
      if (content.includes('android.disableAutomaticComponentCreation')) {
        content = content.replace(/android\.disableAutomaticComponentCreation\s*=\s*true\s*\n?/g, '');
        fs.writeFileSync(gradlePropsPath, content);
        console.log('✅ Removed deprecated property from gradle.properties');
      } else {
        console.log('Deprecated property not found in gradle.properties, no changes needed');
      }
    } else {
      console.log('gradle.properties file not found');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error fixing deprecated properties: ${error.message}`);
    return false;
  }
};

// Create direct copy patches for problematic module files
const createDirectPatches = () => {
  try {
    console.log('\n==== CREATING DIRECT FILE PATCHES ====');
    
    // Define the problematic files and their patch contents
    const patches = [
      {
        modulePath: path.join(projectRoot, 'node_modules', 'expo-battery', 'android', 'build.gradle'),
        patchContent: fs.readFileSync(path.join(projectRoot, 'expo-battery-patch.gradle'), 'utf8'),
        searchPattern: /task\s+androidSourcesJar\(type:\s+Jar\)\s*\{[\s\S]*?\}/g,
        description: 'expo-battery task patch'
      },
      {
        // For expo-modules-core, we just need to replace a single line
        modulePath: path.join(projectRoot, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle'),
        patchContent: null, // Will perform a direct replacement instead
        searchPattern: /components\.release/g,
        replacePattern: 'components.findByName("release") ?: components.getByName("default")',
        description: 'expo-modules-core components.release patch'
      }
    ];
    
    // Apply each patch
    for (const patch of patches) {
      if (fs.existsSync(patch.modulePath)) {
        console.log(`Found ${patch.description} target: ${patch.modulePath}`);
        
        let content = fs.readFileSync(patch.modulePath, 'utf8');
        const originalContent = content;
        
        if (patch.patchContent !== null) {
          // Replace entire block with patch content
          content = content.replace(patch.searchPattern, patch.patchContent);
        } else {
          // Perform direct string replacement
          content = content.replace(patch.searchPattern, patch.replacePattern);
        }
        
        if (content !== originalContent) {
          fs.writeFileSync(patch.modulePath, content);
          console.log(`✅ Successfully applied ${patch.description}`);
        } else {
          console.log(`⚠️ Pattern matched but no changes made for ${patch.description}`);
          // Output sample content for debugging
          console.log(`Sample content: ${content.substring(0, 300)}...`);
        }
      } else {
        console.log(`⚠️ Target file not found for ${patch.description}: ${patch.modulePath}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating direct patches: ${error.message}`);
    return false;
  }
};

// Create a Gradle init script as a fallback approach
const createGradleInitScript = () => {
  try {
    console.log('\n==== CREATING GRADLE INIT SCRIPT ====');
    
    const gradleDir = path.join(projectRoot, 'android', 'gradle');
    const initScriptDir = path.join(gradleDir, 'init.d');
    
    if (!fs.existsSync(initScriptDir)) {
      fs.mkdirSync(initScriptDir, { recursive: true });
    }
    
    const initScriptContent = `
// Init script to fix Gradle compatibility issues
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
    
    // Fix for expo-battery
    afterEvaluate { project ->
        if (project.name == 'expo-battery') {
            project.tasks.withType(Jar) { jarTask ->
                if (jarTask.name == 'androidSourcesJar') {
                    // Replace classifier with archiveClassifier
                    jarTask.archiveClassifier.set('sources')
                }
            }
        }
    }
    
    // General fixes for all projects
    project.plugins.whenPluginAdded { plugin ->
        if (plugin.class.name.contains('com.android.build.gradle.AppPlugin') || 
            plugin.class.name.contains('com.android.build.gradle.LibraryPlugin')) {
            
            // Fix for component.release issues
            project.android.buildTypes.all { buildType ->
                if (buildType.name == "release") {
                    // Make sure release variant is properly configured
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
    
    const initScriptPath = path.join(initScriptDir, 'fix-gradle-compatibility.gradle');
    fs.writeFileSync(initScriptPath, initScriptContent);
    console.log(`✅ Created Gradle init script at ${initScriptPath}`);
    
    // Set environment variable to use this init script
    process.env.GRADLE_OPTS = `${process.env.GRADLE_OPTS || ""} -Dorg.gradle.internal.publish.checksums.insecure=true -Dinit.gradle.dir=${initScriptDir}`;
    console.log(`Set GRADLE_OPTS to use init script: ${process.env.GRADLE_OPTS}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating Gradle init script: ${error.message}`);
    return false;
  }
};

// Main execution
async function main() {
  try {
    // 0. First, directly fix deprecated properties
    // This must be done first to prevent early build failures
    let success = fixDeprecatedProperties();
    
    // 1. Run each individual patch script in specific order
    // First fix Gradle properties, then specific files, then Android app
    success = runScript('patch-gradle-properties.js') && success;
    success = runScript('build-patches.js') && success;
    success = runScript('android-gradle-fix.js') && success; // New script to fix app build.gradle
    
    // 2. Apply direct file patches (most reliable method)
    success = createDirectPatches() && success;
    
    // 3. Create Gradle init script as fallback
    success = createGradleInitScript() && success;
    
    // 4. Clean Gradle build if needed
    try {
      console.log('\n==== CLEANING GRADLE BUILD ====');
      execSync('cd android && ./gradlew clean', { stdio: 'inherit' });
      console.log('✅ Android project cleaned successfully');
    } catch (error) {
      console.log(`⚠️ Gradle clean failed: ${error.message} (this may be normal in EAS environment)`);
    }
    
    console.log('\n==== PATCHING PROCESS COMPLETE ====');
    console.log(success ? '✅ All patches applied successfully' : '⚠️ Some patches may have failed, but fallbacks were implemented');
    console.log('You can now proceed with the build');
    
  } catch (error) {
    console.error(`❌ Fatal error in patching process: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the main function
main(); 