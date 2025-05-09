/**
 * Script to patch android/gradle.properties with compatibility settings
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const gradlePropertiesPath = path.join(projectRoot, 'android', 'gradle.properties');

console.log(`Patching gradle.properties at: ${gradlePropertiesPath}`);

try {
  // Read existing properties
  let content = '';
  if (fs.existsSync(gradlePropertiesPath)) {
    content = fs.readFileSync(gradlePropertiesPath, 'utf8');
    console.log('Successfully read gradle.properties file');
  } else {
    console.error('Warning: gradle.properties file not found');
  }

  // Remove deprecated property that causes build failures in Gradle 8.0+
  const deprecatedProps = [
    'android.disableAutomaticComponentCreation'
  ];

  // Remove each deprecated property if it exists
  for (const propName of deprecatedProps) {
    const propRegex = new RegExp(`^${propName}=.*\\n?`, 'm');
    if (propRegex.test(content)) {
      content = content.replace(propRegex, '');
      console.log(`Removed deprecated property: ${propName}`);
    }
  }

  // Add properties to fix Gradle compatibility issues
  const propertiesToAdd = [
    '\n# Properties added to fix Gradle compatibility issues',
    'android.enableJetifier=true',
    'android.useAndroidX=true',
    'org.gradle.internal.publish.checksums.insecure=true',
    'org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m'
    // Removed 'android.disableAutomaticComponentCreation=true' as it's deprecated in Gradle 8.0+
  ];

  // Add each property if it doesn't already exist
  for (const prop of propertiesToAdd) {
    if (!prop.includes('=')) continue; // Skip comments
    const propName = prop.split('=')[0];
    
    // Check if the property already exists
    const propRegex = new RegExp(`^${propName}=.*`, 'm');
    if (!propRegex.test(content)) {
      content += `\n${prop}`;
      console.log(`Added property: ${prop}`);
    } else {
      console.log(`Property already exists: ${propName}`);
    }
  }

  // Write back to the file
  fs.writeFileSync(gradlePropertiesPath, content);
  console.log('Successfully updated gradle.properties file');
} catch (error) {
  console.error(`Error patching gradle.properties: ${error.message}`);
  process.exit(1);
} 