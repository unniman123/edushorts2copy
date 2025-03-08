export interface NotificationTargetAudience {
  roles: ('user' | 'admin')[];
  categories: string[];
}

export interface DBNotification {
  id: string;
  title: string;
  body: string;
  target_audience: NotificationTargetAudience;
  created_at: string;
  scheduled_at: string | null;
  user_id: string | null;
  read?: boolean; // Client-side only, populated from notification_reads
}

export interface NotificationRead {
  user_id: string;
  notification_id: string;
  read_at: string;
}

export interface CreateNotificationDTO {
  title: string;
  body: string;
  target_audience?: NotificationTargetAudience;
  user_id?: string;
  scheduled_at?: string;
}

export interface UpdateNotificationDTO {
  id: string;
  title?: string;
  body?: string;
  target_audience?: NotificationTargetAudience;
  scheduled_at?: string | null;
}

export interface NotificationFilters {
  read?: boolean;
  categories?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: string[];
}

// Response types for API endpoints
export interface NotificationsResponse {
  notifications: DBNotification[];
  unreadCount: number;
}

export interface NotificationError {
  message: string;
  code: string;
}

// Constants for notification categories
export const NOTIFICATION_CATEGORIES = [
  'Education',
  'Visas',
  'Immigration',
  'Housing',
  'Employment',
  'Events',
  'Announcements'
] as const;

export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[number];
