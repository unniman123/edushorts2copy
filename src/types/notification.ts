export interface NotificationPreferences {
  push: boolean;
  email?: boolean;
  expo_push_token?: string;
  fcm_token?: string;
  push_enabled: boolean;
  subscriptions: string[];
}

export interface PushNotificationData {
  title: string;
  body: string;
  deep_link?: string;
  target_audience: 'all' | 'education' | 'visa' | 'scholarship' | 'course' | 'immigration';
}

export interface NotificationResponse {
  notification: {
    request: {
      content: {
        title: string;
        body: string;
        data?: {
          deep_link?: string;
          [key: string]: any;
        };
      };
    };
  };
}
