Phase 1: Supabase Project Setup & Authentication
Objective: Replace mock authentication with Supabase Auth while preserving existing UI/UX.

1.1 Database Schema
File to create: supabase/migrations/0001_initial_schema.sql

sql
Copy
-- Users Table (Matches PRD)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Add RLS Policy (Allow users to read their own data)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own data" 
ON users FOR ALL USING (auth.uid() = id);
1.2 Supabase Client Configuration
File to create: lib/supabaseClient.ts

typescript
Copy
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
1.3 Auth Integration
File to modify: screens/LoginScreen.tsx

typescript
Copy
// Replace mock login with:
const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (data.user?.id) {
    navigation.navigate('Home');
  }
};
RLS Policies:

Enable RLS on users table with policies for admins (use Supabase Dashboard).

Phase 2: News & Category Management
Objective: Migrate mock news data to Supabase while retaining existing UI components.

2.1 Database Schema
Add to migration file:

sql
Copy
-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- Articles Table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- RLS Policies (Admins can edit, users can read)
CREATE POLICY "Admins manage articles" ON articles 
FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE POLICY "Public read access" ON articles 
FOR SELECT USING (true);
2.2 News Fetching
File to modify: screens/HomeScreen.tsx

typescript
Copy
// Replace mock data with:
const fetchNews = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  setNews(data || []);
};
2.3 Admin Panel Integration
File to modify: screens/AdminDashboardScreen.tsx

typescript
Copy
// For deleting articles:
const deleteArticle = async (id: string) => {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);
};
Phase 3: User Preferences & Saved Articles
Objective: Implement saved articles and preferences using Supabase relationships.

3.1 Database Schema
Add to migration file:

sql
Copy
-- Saved Articles Table
CREATE TABLE saved_articles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

-- User Preferences Table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  dark_mode_enabled BOOLEAN DEFAULT FALSE
);
3.2 Saved Articles Logic
File to modify: screens/BookmarksScreen.tsx

typescript
Copy
// Fetch saved articles:
const fetchSaved = async () => {
  const { data } = await supabase
    .from('saved_articles')
    .select('article_id')
    .eq('user_id', userId);
};
Phase 4: Notifications System
Objective: Add push notifications with Supabase edge functions.

4.1 Database Schema
Add to migration file:

sql
Copy
-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
4.2 Notification Service
File to create: supabase/functions/send-notification/index.ts

typescript
Copy
// Use Supabase Edge Functions to trigger notifications
// Integrate with Expo Notifications SDK
Phase 5: Metrics & RLS Finalization
Objective: Secure all tables and implement admin metrics.

5.1 RLS Policies
saved_articles: auth.uid() = user_id

notifications: Admins-only access

5.2 Admin Dashboard Metrics
File to modify: screens/AdminDashboardScreen.tsx

typescript
Copy
// Total users:
const { count } = await supabase
  .from('users')
  .select('*', { count: 'exact' });
Key Integration Notes
Environment Variables: Add .env file with Supabase credentials.

Dependencies: Ensure @supabase/supabase-js is installed (already in package.json).

No Routing Changes: All existing routes (screens/HomeScreen, screens/AdminDashboardScreen, etc.) remain untouched.

Backward Compatibility: Mock data in data/mockData.ts can be phased out gradually.