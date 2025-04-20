# Edushorts Mobile App

## Overview
Edushorts is a news application focused on international students, providing personalized educational news and updates.

## Features
- User authentication with email and Google sign-in
- Email verification with deep linking
- Password reset functionality
- News article bookmarking
- Personalized news feed
- Profile management
- Analytics and error tracking
- Performance monitoring

## Development

### Prerequisites
- Node.js >= 16
- Expo CLI
- iOS Simulator or Android Emulator
- Supabase account

### Setup
```bash
# Install dependencies
npm install

# Start development server
expo start
```

### Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Branch.io Configuration
BRANCH_LIVE_KEY=your_branch_live_key
BRANCH_TEST_KEY=your_branch_test_key
BRANCH_APP_DOMAIN=your_app_domain.app.link
BRANCH_ALT_DOMAIN=your_app_domain-alternate.app.link
```

For Branch.io setup details, see [Branch.io Testing Guide](./docs/branch-testing-guide.md)

### Deep Linking
The app supports deep linking for authentication flows:

```bash
# Test deep linking setup
./scripts/test-deep-links.sh

# Manual testing
expo url edushorts://auth/confirm?token=test-token

# Development URLs
exp://localhost:19000/--/auth/confirm?token=test-token
exp://localhost:19000/--/auth/reset-password?token=test-token

# Production URLs
edushorts://auth/confirm?token=test-token
edushorts://auth/reset-password?token=test-token
```

For detailed information, see [Deep Linking Documentation](./docs/deep-linking.md)

### Testing

#### Unit Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run tests with coverage
npm run test:coverage
```

#### Deep Link Testing
```bash
# Test Android deep links
npm run test:deeplinks:android

# Test iOS deep links
npm run test:deeplinks:ios
```

For detailed information about deep link testing, see:
- [Branch.io Testing Guide](./docs/branch-testing-guide.md)
- [Deep Linking Documentation](./docs/deep-linking.md)

### Build and Deploy
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit
```

## Documentation
- [Auth Implementation](./docs/auth-implementation.md)
- [Deep Linking](./docs/deep-linking.md)
- [Google OAuth Setup](./docs/google-oauth-setup.md)
- [Monitoring Service](./docs/monitoring-service.md)

## Testing

### Unit Tests
```bash
npm test
```

### Deep Link Testing
```bash
npm run test:deeplinks:android
npm run test:deeplinks:ios
```

### Monitoring Tests
```bash
# Run monitoring service tests
npm run test:monitoring
```

## Scripts
- `scripts/test-deep-links.sh` - Test deep linking functionality
- `scripts/rollback/rollback.sh` - Rollback configuration changes
- `scripts/migration.ts` - Database migration script

## Error Handling
The app uses a combination of:
- Toast notifications for user feedback
- Sentry for error monitoring
- Console logging in development

## Contributing
1. Create a new branch
2. Make your changes
3. Submit a pull request
4. Ensure CI passes

## License
MIT License
