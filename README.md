# Notification System

A comprehensive notification management system for React Native applications, providing support for push notifications, in-app notifications, and scheduled notifications with configurable quiet hours.

## Features

- Push notifications support (using Expo notifications)
- In-app notifications with customizable rendering
- Scheduled notifications with quiet hours
- Deep linking support
- Offline support with notification persistence
- Configurable notification settings
- Comprehensive monitoring and analytics
- TypeScript support

## Architecture

The notification system is built using a modular architecture with the following key components:

### Services

- `NotificationService`: Main service for handling notifications
- `NotificationBridge`: Bridge between Expo notifications and the app
- `NotificationStorage`: Handles offline storage and syncing
- `AppLifecycleHandler`: Manages notification behavior during app state changes
- `DeepLinkHandler`: Processes notification deep links
- `MonitoringService`: Tracks notification metrics and health

### Components

- `NotificationRenderer`: Renders notifications with customizable styling
- `NotificationSettingsScreen`: UI for managing notification preferences

### Hooks

- `useNotificationPermissions`: Manages notification permissions
- `useNotificationSettings`: Handles notification settings state

## Setup

1. Install dependencies:

```bash
npm install @react-native-community/async-storage @expo/vector-icons date-fns
npm install @react-native-community/datetimepicker
```

2. Configure the notification service in your app:

```typescript
// App.tsx
import { NotificationService, AppLifecycleHandler } from './services';

function App() {
  useEffect(() => {
    const notificationService = NotificationService.getInstance();
    const appLifecycleHandler = AppLifecycleHandler.getInstance();
    
    notificationService.initialize();
    appLifecycleHandler.initialize();

    return () => {
      notificationService.cleanup();
      appLifecycleHandler.cleanup();
    };
  }, []);

  return (
    <NotificationProvider>
      {/* Your app content */}
    </NotificationProvider>
  );
}
```

## Usage

### Sending Notifications

```typescript
const notificationService = NotificationService.getInstance();

// Send a push notification
await notificationService.sendNotification({
  title: 'New Message',
  body: 'You have a new message',
  data: { type: 'message', id: '123' }
});

// Schedule a notification
await notificationService.scheduleNotification({
  title: 'Reminder',
  body: 'Don\'t forget your appointment',
  scheduledFor: new Date('2025-04-26T10:00:00')
});
```

### Managing Settings

```typescript
const { settings, updateQuietHours, togglePushNotifications } = useNotificationSettings();

// Toggle push notifications
togglePushNotifications();

// Update quiet hours
updateQuietHours({
  enabled: true,
  start: '22:00',
  end: '07:00'
});
```

### Handling Deep Links

```typescript
const deepLinkHandler = DeepLinkHandler.getInstance();

deepLinkHandler.registerHandler('article', (params) => {
  navigation.navigate('ArticleDetail', { articleId: params.id });
});
```

## Monitoring

The system includes built-in monitoring for:

- Delivery success/failure rates
- Token health
- Sync status
- User engagement metrics
- Error tracking

Access monitoring data:

```typescript
const monitoringService = MonitoringService.getInstance();
const metrics = monitoringService.getMetrics();
```

## Testing

The system includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test suite
npm test notification
```

## Error Handling

The system includes robust error handling:

- Automatic retry for failed deliveries
- Offline queueing
- Token refresh on failure
- Error logging and monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Performance Testing

## Overview
The application includes comprehensive performance testing to ensure optimal user experience across different devices and conditions. The testing suite covers:

1. **App Launch Performance**
   - Cold start time (target: < 2s)
   - Warm start time (target: < 500ms)
   - Memory usage during launch

2. **Navigation Performance**
   - Screen transition time (target: < 300ms)
   - Animation frame rate (target: 60fps)
   - Memory impact of navigation stack

3. **Network Efficiency**
   - API response handling time (target: < 3s)
   - Data transfer size optimization
   - Caching effectiveness

4. **Memory Management**
   - Baseline memory consumption
   - Memory growth monitoring
   - Memory leak detection

5. **Battery Impact**
   - Background power usage (target: < 0.1%/hour)
   - Active usage power consumption (target: < 5%/hour)
   - Temperature monitoring

6. **Bundle Size**
   - JavaScript bundle size (target: < 5MB)
   - Asset optimization
   - Code splitting effectiveness

## Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Run performance tests in CI environment
npm run test:perf-ci

# Analyze bundle size
npm run analyze-bundle
```

## Performance Metrics Collection

The performance testing suite uses a custom reporter that collects and analyzes various metrics:
- Timing measurements
- Memory usage
- Render counts
- Battery consumption
- Bundle size statistics

Results are displayed in a formatted console output with color-coded thresholds for quick assessment.

## Best Practices

1. **Regular Testing**
   - Run performance tests before major releases
   - Monitor trends in performance metrics
   - Set up CI/CD pipeline alerts for performance regressions

2. **Optimization Guidelines**
   - Keep bundle size minimal through code splitting
   - Optimize image assets
   - Implement efficient caching strategies
   - Minimize unnecessary re-renders

3. **Performance Monitoring**
   - Track real-world performance metrics
   - Set up alerts for performance degradation
   - Regular performance audits

## Troubleshooting

If performance tests fail:

1. Check the test environment setup
2. Verify the app is built in release mode
3. Ensure all dependencies are installed
4. Review the performance reporter output for specific metrics
5. Check for memory leaks using the memory growth test
6. Verify bundle size optimization
