-- Create categories table first
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- Create articles table with references
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image_path TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up RLS policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage articles" ON articles 
FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

-- Set up storage bucket policies
CREATE POLICY "Admin Access" ON storage.objects 
FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');

-- Insert initial categories matching CategorySelector.tsx
INSERT INTO categories (name) VALUES
  ('All'),
  ('Education'),
  ('Scholarships'),
  ('Visas'),
  ('Immigration'),
  ('Study Abroad'),
