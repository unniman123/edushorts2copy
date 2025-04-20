# Monitoring Service Documentation

The monitoring service provides error tracking and event logging capabilities for the EduShorts app.

## Features

- Error tracking with context and tags
- Event logging for analytics
- Queue-based error collection
- Development mode logging

## Usage

### Error Tracking

```typescript
import * as monitoring from '../services/monitoring';

try {
  // Your code that might throw
} catch (error) {
  monitoring.logError(error, {
    screen: 'ScreenName',
    action: 'actionName',
    // Additional context tags
    articleId: '123',
    userId: 'user-456'
  });
}
```

### Event Logging

```typescript
import * as monitoring from '../services/monitoring';

// Log a user action
monitoring.logEvent('article_bookmarked', {
  articleId: '123',
  articleTitle: 'Article Title'
});

// Log performance metrics
monitoring.logEvent('article_detail_view_loaded', {
  articleId: '123',
  loadTimeMs: 850,
  hasImage: true
});
```

## Common Events

### Article Interactions
- `article_detail_view_started`
- `article_detail_view_loaded`
- `article_bookmarked`
- `article_unbookmarked`
- `article_external_link_clicked`
- `share_failed`

### Deep Linking
- `branch_link_created`
- `branch_link_opened`
- `branch_link_error`

## Error Tags

Common tags to include with errors:

- `screen`: Current screen name
- `action`: Action being performed
- `articleId`: Related article ID
- `userId`: Current user ID
- `url`: For network requests
- `errorCode`: Error code if available

## Development Mode

In development mode (`__DEV__ === true`):
- Errors are logged to console
- Events are logged to console
- Error queue is not used

## Production Mode

In production:
- Errors are queued for batch processing
- Events are sent to analytics service
- Queue is flushed periodically

## Queue Management

The error queue has a maximum size of 100 items. When exceeded, oldest items are removed.

To manually flush the queue:

```typescript
import { flushQueue } from '../services/monitoring';

// Before app background/shutdown
await flushQueue();
```

## Integration Points

1. Error Boundaries
2. API Error Handlers
3. Navigation Events
4. User Actions
5. Performance Metrics
6. Deep Link Handlers

## Best Practices

1. Always include relevant context in tags
2. Use consistent event names
3. Log start and end of important operations
4. Include timing information for performance tracking
5. Handle errors appropriately in async operations
6. Don't log sensitive information

## Future Improvements

1. Integration with Sentry/Crashlytics
2. Custom error grouping
3. Offline support
4. Automatic breadcrumbs
5. Session tracking
6. User journey analysis
