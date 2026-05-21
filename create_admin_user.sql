-- Create Admin User Script
-- INSTRUCTIONS:
-- 1. First, register/login to create a user account at http://localhost:8080
-- 2. Then run the query below to find your user ID
-- 3. Copy the user ID and use it in the admin creation script

-- Step 1: Find your user ID (run this first)
-- Look for your email in the results and copy the 'id' value
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.display_name,
  p.user_type
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- Step 2: Once you have the user ID, replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- Example UUID format: 12345678-1234-1234-1234-123456789012

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1
/*
INSERT INTO public.profiles (user_id, display_name, phone_number, user_type, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE', -- Replace this with actual UUID from Step 1
  'Admin User',
  '+254712345678',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  user_type = 'admin',
  updated_at = NOW();

-- Step 3: Create an active subscription for the admin (optional)
INSERT INTO public.user_subscriptions (user_id, status, expires_at, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE', -- Same user ID as above
  'active',
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET 
  status = 'active',
  expires_at = NOW() + INTERVAL '1 year',
  updated_at = NOW();
*/

-- Step 3: Verify the admin user was created
SELECT 
  p.user_id,
  p.display_name,
  p.phone_number,
  p.user_type,
  s.status as subscription_status,
  s.expires_at
FROM profiles p
LEFT JOIN user_subscriptions s ON p.user_id = s.user_id
WHERE p.user_type = 'admin';

-- Instructions:
-- 1. First, create a user account through the normal registration process
-- 2. Check the Supabase Auth dashboard to get the user's UUID
-- 3. Replace 'REPLACE_WITH_ACTUAL_USER_ID' with the actual UUID
-- 4. Run this script in Supabase SQL Editor
-- 5. Login with that user account to access the admin dashboard
