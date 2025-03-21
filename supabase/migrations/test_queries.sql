-- Test 1: Verify profiles table creation and structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Test 2: Verify foreign key constraint to auth.users
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles';

-- Test 3: Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Test 4: Test RLS Policies
-- First, create a test user
INSERT INTO auth.users (id, email)
VALUES ('test-user-id', 'test@example.com');

-- Create their profile
INSERT INTO public.profiles (
  id,
  email,
  password_hash,
  full_name,
  is_admin,
  is_active
) VALUES (
  'test-user-id',
  'test@example.com',
  'test-hash',
  'Test User',
  false,
  true
);

-- Test 4.1: Test as the user (should succeed)
SET request.jwt.claims = '{"sub": "test-user-id"}';
SELECT * FROM profiles WHERE id = 'test-user-id';

-- Test 4.2: Test accessing another user's data (should fail)
SET request.jwt.claims = '{"sub": "test-user-id"}';
SELECT * FROM profiles WHERE id != 'test-user-id';

-- Test 5: Clean up test data
DELETE FROM public.profiles WHERE id = 'test-user-id';
DELETE FROM auth.users WHERE id = 'test-user-id';

-- Test 6: Verify DEFAULT values
INSERT INTO public.profiles (
  id,
  email,
  password_hash
) VALUES (
  'default-test-id',
  'default@test.com',
  'hash'
);

SELECT 
  is_admin,
  is_active,
  created_at,
  updated_at
FROM profiles 
WHERE id = 'default-test-id';

-- Clean up default test
DELETE FROM public.profiles WHERE id = 'default-test-id';

-- Test 7: Verify unique email constraint
\set ON_ERROR_STOP on

-- Should succeed
INSERT INTO public.profiles (id, email, password_hash)
VALUES ('user1', 'unique@test.com', 'hash1');

-- Should fail due to unique constraint
INSERT INTO public.profiles (id, email, password_hash)
VALUES ('user2', 'unique@test.com', 'hash2');

-- Clean up unique test
DELETE FROM public.profiles WHERE id IN ('user1', 'user2');

-- Test 8: Verify timestamps are being set
INSERT INTO public.profiles (
  id,
  email,
  password_hash
) VALUES (
  'timestamp-test',
  'timestamp@test.com',
  'hash'
);

SELECT 
  EXTRACT(EPOCH FROM (NOW() - created_at)) < 1 as created_recently,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) < 1 as updated_recently
FROM profiles 
WHERE id = 'timestamp-test';

-- Clean up timestamp test
DELETE FROM public.profiles WHERE id = 'timestamp-test';
