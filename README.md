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
