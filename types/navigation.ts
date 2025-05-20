export type RootStackParamList = {
  Main: { screen: keyof MainTabParamList } | undefined;
  ArticleDetail: { articleId: string } | { id: string };
  Discover: undefined;
  Bookmarks: undefined;
  Profile: undefined;
  Settings: undefined;
  Login: { 
    emailConfirmed?: boolean; 
    pendingConfirmation?: boolean;
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
  BookmarksTab: undefined;
  ProfileTab: undefined;
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
