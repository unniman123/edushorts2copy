import { Article } from './supabase'; // Assuming supabase types are in the same directory or adjust path

export type RootStackParamList = {
  Main: { screen: keyof MainTabParamList } | undefined;
  Guest: { screen: keyof GuestTabParamList } | undefined;
  SingleArticleViewer: { articleId: string; articles?: Article[]; currentIndex?: number; source?: string; branch?: boolean; notification?: boolean; };
  SavedArticlePager: { articleId: string }; // Added for saved articles PagerView
  Discover: undefined;
  Bookmarks: undefined;
  Profile: undefined;
  Settings: undefined;
  Login: { 
    emailConfirmed?: boolean; 
    pendingConfirmation?: boolean;
    returnTo?: string; // Where to navigate after successful login
    context?: string; // Context for why login is required
  };
  Register: undefined;
  EmailConfirmation: {
    token?: string; // Token from deep link (optional now)
    email?: string; // Email passed from registration/login (optional)
  };
  ResetPassword: {
    token: string;
  };
  Notifications: undefined;
};

// Add these for bottom tab navigation
export type MainTabParamList = {
  HomeTab: undefined;
  DiscoverTab: undefined;
  BookmarksTab: undefined; // This is the screen that lists bookmarks
  ProfileTab: undefined;
};

// Guest mode tab navigation - read-only access
export type GuestTabParamList = {
  HomeTab: undefined;
  DiscoverTab: undefined;
  LoginPrompt: { context?: string; feature?: string; }; // Replaces Bookmarks for guests
  ProfilePrompt: { context?: string; }; // Replaces Profile for guests
};

// Define route params for easier type checking
export interface ArticleDetailParams {
  articleId?: string;
  id?: string;
  branch?: boolean;        // Indicates the article was opened from a Branch link
  notification?: boolean;  // Indicates the article was opened from a notification
  source?: string;         // General source parameter indicating where the link was opened from
}

export interface LoginScreenParams {
  emailConfirmed?: boolean;
  pendingConfirmation?: boolean;
}
