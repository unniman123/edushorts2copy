type ErrorTags = {
  screen?: string;
  action?: string;
  articleId?: string | number;
  [key: string]: any;
};

interface ErrorReport {
  error: Error | unknown;
  tags?: ErrorTags;
  message?: string;
  stackTrace?: string;
  timestamp: string;
  user?: string;
}

let errorQueue: ErrorReport[] = [];
const MAX_QUEUE_SIZE = 100;

export const logError = (error: Error | unknown, tags?: ErrorTags) => {
  if (__DEV__) {
    console.error('Error:', error);
    if (tags) console.error('Tags:', tags);
    return;
  }
  
  queueError({
    error,
    tags,
    timestamp: new Date().toISOString(),
    stackTrace: error instanceof Error ? error.stack : undefined,
    message: error instanceof Error ? error.message : String(error)
  });
};

const queueError = (errorReport: ErrorReport) => {
  // Add to queue
  errorQueue.push(errorReport);

  // If queue is too large, remove oldest items
  if (errorQueue.length > MAX_QUEUE_SIZE) {
    errorQueue = errorQueue.slice(-MAX_QUEUE_SIZE);
  }

  // TODO: Implement actual error reporting
  // This is where you would send to your error reporting service
  // Example:
  // if (Sentry.isInitialized()) {
  //   Sentry.captureException(errorReport.error, {
  //     tags: errorReport.tags,
  //     extra: {
  //       timestamp: errorReport.timestamp,
  //       stackTrace: errorReport.stackTrace
  //     }
  //   });
  // }
};

export const captureError = logError; // Alias for compatibility

export const logEvent = (eventName: string, properties?: Record<string, any>) => {
  if (__DEV__) {
    console.log('Event:', eventName, properties);
    return;
  }

  // TODO: Implement actual event logging
  // Example:
  // if (Analytics.isInitialized()) {
  //   Analytics.logEvent(eventName, properties);
  // }
};

export const flushQueue = async () => {
  if (errorQueue.length === 0) return;

  try {
    // TODO: Implement batch sending to error reporting service
    // Example:
    // await Promise.all(errorQueue.map(report => sendToErrorService(report)));
    errorQueue = [];
  } catch (error) {
    console.error('Failed to flush error queue:', error);
  }
};
