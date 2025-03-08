export interface AccessibilityProps {
  accessible: boolean;
  accessibilityLabel: string;
  accessibilityHint: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes, default 2MB
  allowedTypes?: string[]; // e.g. ['image/jpeg', 'image/png']
}

export interface ImageUploadResult {
  path: string;
  url: string;
  size: number;
}

export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

// Extending for React Native compatibility
export interface ImageFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

// User Preferences Types
export interface UserPreferences {
  user_id: string;
  notifications_enabled: boolean;
  dark_mode_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// Saved Articles Types
export interface SavedArticle {
  user_id: string;
  article_id: string;
  saved_at: string;
  article?: Article;  // For joined queries
}

// Article Type (extending existing interface)
export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_path: string;
  category_id: string;
  created_by: string;
  created_at: string;
  saved?: boolean;  // Client-side only, for UI state
}

// Article with all relations
export interface ArticleWithRelations extends Article {
  category?: {
    id: string;
    name: string;
  };
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// User Profile Type
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  preferences?: UserPreferences;  // For joined queries
}
