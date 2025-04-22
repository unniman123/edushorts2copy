#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Generate a temporary JSON config
  const appConfig = require('./app.config.js');
  fs.writeFileSync(
    'temp-config.json',
    JSON.stringify({
      ...appConfig,
      expo: {
        ...appConfig,
        name: appConfig.name,
        slug: appConfig.slug,
        scheme: 'edushorts'
      }
    }, null, 2)
  );

  console.log('Running EAS update configure...');
  execSync(
    'npx --no-install eas update:configure --skip-credentials-check --non-interactive --json-config temp-config.json',
    { stdio: 'inherit' }
  );

  // Cleanup
  fs.unlinkSync('temp-config.json');
  console.log('Configuration completed successfully');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
