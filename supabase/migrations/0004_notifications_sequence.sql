BEGIN;

-- Create user_categories table first (previously in 0005)
DROP TABLE IF EXISTS user_categories CASCADE;
CREATE TABLE user_categories (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, category_id)
);

-- Enable RLS and add policy for user_categories
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their category subscriptions" ON user_categories
  FOR ALL USING (auth.uid() = user_id);

-- Create index for user_categories
CREATE INDEX idx_user_categories_user ON user_categories(user_id);

-- Now create notifications table (from 0004)
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read targeted notifications" ON notifications;
DROP TABLE IF EXISTS notification_reads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with proper relationships and constraints
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (LENGTH(title) <= 120),
  body TEXT NOT NULL CHECK (LENGTH(body) <= 500),
  target_audience JSONB NOT NULL DEFAULT '{"roles": [], "categories": []}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  CONSTRAINT valid_notification_target CHECK (
    (user_id IS NULL AND jsonb_array_length(target_audience->'roles') > 0) OR
    (user_id IS NOT NULL)
  )
);

-- Create notification reads tracking table
CREATE TABLE notification_reads (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_id)
);

-- Create indices for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_reads_user_id ON notification_reads(user_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
  );

CREATE POLICY "Users can read targeted notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    (
      user_id IS NULL 
      AND EXISTS (
        SELECT 1 
        FROM user_preferences up
        WHERE up.user_id = auth.uid()
        AND up.notifications_enabled = true
        AND (
          auth.jwt() ->> 'role' = ANY(SELECT jsonb_array_elements_text(target_audience->'roles'))
          OR
          jsonb_array_length(target_audience->'categories') = 0 
          OR
          EXISTS (
            SELECT 1 
            FROM user_categories uc
            JOIN categories c ON uc.category_id = c.id
            WHERE uc.user_id = auth.uid()
            AND c.name = ANY(SELECT jsonb_array_elements_text(target_audience->'categories'))
          )
        )
      )
    )
  );

CREATE POLICY "Users manage their notification reads" ON notification_reads
  FOR ALL USING (auth.uid() = user_id);

-- Add table comments
COMMENT ON TABLE notifications IS 'System notifications with role and category-based targeting';
COMMENT ON TABLE notification_reads IS 'Tracks which notifications have been read by which users';
COMMENT ON TABLE user_categories IS 'Tracks user category subscriptions for notifications';

-- Add test data
DO $$ 
DECLARE
  test_user_id UUID;
  test_category_id UUID;
BEGIN
  -- Get a test user and category
  SELECT id INTO test_user_id FROM profiles WHERE NOT is_admin LIMIT 1;
  SELECT id INTO test_category_id FROM categories WHERE name = 'Education' LIMIT 1;

  -- Add test category subscription
  IF test_user_id IS NOT NULL AND test_category_id IS NOT NULL THEN
    INSERT INTO user_categories (user_id, category_id)
    VALUES (test_user_id, test_category_id)
    ON CONFLICT DO NOTHING;

    -- Add test notification
    INSERT INTO notifications (title, body, target_audience)
    VALUES (
      'Welcome to Category Notifications',
      'You will now receive notifications based on your category preferences.',
      '{"roles": ["user"], "categories": ["Education"]}'
    );
  END IF;
END $$;

COMMIT;
