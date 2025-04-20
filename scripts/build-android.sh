#!/bin/bash

# Clean up
rm -rf node_modules
rm -rf android/app/build
rm -rf .expo
rm -f yarn.lock
rm -f package-lock.json

# Install dependencies
npm install --legacy-peer-deps

# Generate Android files
npx expo prebuild --platform android --clean

# Navigate to Android directory
cd android

# Clean Android build
./gradlew clean

# Build release APK
./gradlew assembleRelease

echo "APK should be available at: android/app/build/outputs/apk/release/app-release.apk"
