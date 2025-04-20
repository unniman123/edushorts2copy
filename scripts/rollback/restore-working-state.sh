#!/bin/bash

# Script to restore the app to working state with Google Sign-In
echo "🔄 Starting restoration process..."

# Store current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Confirm with user
echo "⚠️ This will reset your current state to the last known working state with Google Sign-In"
echo "Current branch: $CURRENT_BRANCH"
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Restoration cancelled"
    exit 1
fi

# Backup current changes if any
echo "📦 Backing up any current changes..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
git stash save "backup_before_restore_$TIMESTAMP"

# Switch to backup branch and pull latest
echo "🔄 Switching to backup branch..."
git fetch origin backup/working-google-signin-april21
git checkout backup/working-google-signin-april21

# Clean and reinstall dependencies
echo "🧹 Cleaning project..."
rm -rf node_modules
rm -rf android/app/build

# Restore node_modules
echo "📥 Restoring node_modules..."
npm ci

# Rebuild Android
echo "🏗️ Rebuilding Android project..."
cd android && ./gradlew clean && cd ..

echo "✅ Restoration complete!"
echo "You can now run: npx expo start --dev-client"
