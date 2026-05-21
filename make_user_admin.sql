-- ============================================
-- MAKE USER ADMIN SCRIPT (WITH PROFILE FIX)
-- ============================================
-- This script will:
-- 1. Create profile if it doesn't exist
-- 2. Update user_type to 'admin' for kivroafrica@gmail.com
-- 3. Update the user's password to 'admin123'
-- 4. Verify the changes
-- ============================================

-- Step 1: Create profile if it doesn't exist (INSERT OR UPDATE)
INSERT INTO profiles (user_id, display_name, phone_number, user_type, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
  COALESCE(raw_user_meta_data->>'phone_number', '+252000000000'),
  'admin',
  now(),
  now()
FROM auth.users
WHERE email = 'kivroafrica@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  user_type = 'admin',
  updated_at = now();

-- Step 2: Update password for the admin user
-- Note: Supabase uses encrypted passwords, so we need to use the auth.users table
-- The password will be set to: admin123
UPDATE auth.users
SET 
  encrypted_password = crypt('admin123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'kivroafrica@gmail.com';

-- Step 3: Verify the changes
SELECT 
  p.user_id,
  u.email,
  p.phone_number,
  p.display_name,
  p.user_type,
  u.created_at as user_created,
  u.updated_at as password_updated,
  p.created_at as profile_created
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'kivroafrica@gmail.com';

-- ============================================
-- RESULT: 
-- Email: kivroafrica@gmail.com
-- Password: admin123
-- User Type: admin
-- Profile: Created/Updated
-- ============================================
