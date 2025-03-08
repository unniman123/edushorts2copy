import type { DBNotification } from './notifications';

export interface UserPreferences {
  user_id: string;
  dark_mode_enabled: boolean;
  notifications_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCategory {
  user_id: string;
  category_id: string;
}

// Base user profile type
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Extended user profile with relations
export interface UserProfileWithRelations extends UserProfile {
  preferences?: UserPreferences;
  notifications?: DBNotification[];
  categories?: string[]; // Category IDs
}

// Used for updates
export type UpdateUserPreferences = Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>>;
