export const NOTIFICATION_CONFIG = {
  expo: {
    projectId: "cfa91622-46a9-49aa-86c3-177c0a05d850",
    apiUrl: 'https://exp.host/--/api/v2/push/send',
    accessToken: 'e3iKVqsYu9wOjtxxuhMvZl0AW4XcNZci6z2zwJH'
  },
  monitoring: {
    healthCheckInterval: 300000, // 5 minutes
    retryAttempts: 3,
    syncInterval: 60000, // 1 minute
    alertThresholds: {
      deliveryFailureRate: 0.1, // Alert if >10% failures
      tokenRefreshFailureRate: 0.05, // Alert if >5% refresh failures
      syncFailureRate: 0.1 // Alert if >10% sync failures
    }
  }
};

export const NOTIFICATION_TYPES = {
  WEB: 'web' as const,
  PUSH: 'push' as const,
  SCHEDULED: 'scheduled' as const,
  ARTICLE_LINK: 'article_link' as const,
  DEEP_LINK: 'deep_link' as const
};

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export const DELIVERY_STATUS = {
  PENDING: 'pending' as const,
  SENT: 'sent' as const,
  DELIVERED: 'delivered' as const,
  FAILED: 'failed' as const,
  READ: 'read' as const
};

export type DeliveryStatus = typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];
