# CI/CD Pipeline Troubleshooting Guide

## Required GitHub Secrets Configuration

### 1. EAS_TOKEN
**Purpose**: Authenticates with Expo Application Services
**How to get it**:
```bash
# Install EAS CLI locally
npm install -g eas-cli

# Login to your Expo account
eas login

# Create a personal access token
eas account:token:create
```
**GitHub Secret Name**: `EAS_TOKEN`
**Value**: The token returned from the command above

### 2. FIREBASE_APP_ID
**Purpose**: Identifies your Firebase app for distribution
**How to get it**:
1. Go to Firebase Console
2. Select your project
3. Go to Project Settings > General
4. Find your Android app
5. Copy the App ID (format: `1:123456789:android:abcdef123456`)

**GitHub Secret Name**: `FIREBASE_APP_ID`
**Value**: Your Firebase Android App ID

### 3. FIREBASE_TOKEN
**Purpose**: Authenticates with Firebase CLI
**How to get it**:
```bash
# Install Firebase CLI locally
npm install -g firebase-tools

# Login and generate token
firebase login:ci
```
**GitHub Secret Name**: `FIREBASE_TOKEN`
**Value**: The token returned from the command above

### 4. GOOGLE_SERVICE_ACCOUNT_JSON
**Purpose**: Authenticates with Google Play Console for app submission
**How to get it**:
1. Go to Google Cloud Console
2. Select your project
3. Go to IAM & Admin > Service Accounts
4. Create a new service account or use existing
5. Download the JSON key file
6. Base64 encode the content:
```bash
base64 -i path/to/service-account.json
```
**GitHub Secret Name**: `GOOGLE_SERVICE_ACCOUNT_JSON`
**Value**: Base64 encoded JSON content

## Common Issues and Solutions

### Issue 1: "An Expo user account is required to proceed"
**Cause**: Missing or invalid EAS_TOKEN
**Solution**:
1. Verify EAS_TOKEN secret exists in GitHub
2. Regenerate the token using `eas account:token:create`
3. Update the GitHub secret with new token

### Issue 2: "URL rejected: Malformed input to a URL function"
**Cause**: EAS build command returns invalid JSON or empty URL
**Solutions**:
1. Check if EAS build profile exists in `eas.json`
2. Verify build completes successfully
3. Check build logs for errors
4. Ensure preview profile builds APK, not AAB

### Issue 3: Firebase distribution fails
**Cause**: Invalid Firebase configuration
**Solutions**:
1. Verify FIREBASE_APP_ID format
2. Check FIREBASE_TOKEN is valid
3. Ensure Firebase project has App Distribution enabled
4. Verify app is registered in Firebase

### Issue 4: Google Play submission fails
**Cause**: Invalid service account or first upload not done manually
**Solutions**:
1. Upload app manually to Google Play Console first (required)
2. Verify service account has Play Console permissions
3. Check Google Service Account JSON is properly base64 encoded
4. Ensure app bundle is signed correctly

## Testing Your Configuration

### Test EAS Authentication Locally
```bash
export EAS_TOKEN="your_token_here"
eas whoami
```

### Test Firebase Authentication Locally
```bash
export FIREBASE_TOKEN="your_token_here"
firebase projects:list
```

### Test Google Service Account Locally
```bash
# Decode and test service account
echo "your_base64_encoded_json" | base64 -d > test-service-account.json
gcloud auth activate-service-account --key-file=test-service-account.json
```

## Workflow Debugging

### Enable Debug Logging
Add this step to your workflow for detailed logs:
```yaml
- name: Enable Debug Mode
  run: echo "ACTIONS_STEP_DEBUG=true" >> $GITHUB_ENV
```

### Check Build Outputs
The improved workflow now includes:
- Authentication verification steps
- JSON validation
- URL format validation
- Detailed error messages
- Build output logging

## IDE Linter Warnings

### "Context access might be invalid" Warnings
These warnings occur when your IDE doesn't recognize GitHub Actions context variables.

**Solutions**:
1. **VS Code**: Install the "GitHub Actions" extension
2. **Add schema validation**: The `.vscode/settings.json` file includes GitHub Actions schema validation
3. **Environment variables**: Use job-level `env` declarations instead of inline secret access

### Fixed Issues in Latest Workflow
- ✅ Environment variables declared at job level
- ✅ Proper secret access patterns
- ✅ Schema validation configured
- ✅ Reduced redundant environment declarations

## Support Resources

- [EAS CLI Documentation](https://docs.expo.dev/build/setup/)
- [Firebase App Distribution](https://firebase.google.com/docs/app-distribution)
- [Google Play Console API](https://developers.google.com/android-publisher)
- [GitHub Actions Debugging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)
- [GitHub Actions Schema](https://json.schemastore.org/github-workflow.json) 