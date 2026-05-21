-- Make siddikaligb@gmail.com an admin user
-- Run this AFTER the user has registered through the normal signup process

-- Step 1: Find the user ID for siddikaligb@gmail.com
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.display_name,
  p.user_type
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'siddikaligb@gmail.com';

-- Step 2: Create/Update profile to admin (run after Step 1 to get the user_id)
-- Replace 'USER_ID_FROM_STEP_1' with the actual UUID from the query above

/*
-- Uncomment and replace USER_ID_FROM_STEP_1 with actual UUID
INSERT INTO public.profiles (user_id, display_name, phone_number, user_type, created_at, updated_at)
VALUES (
  'USER_ID_FROM_STEP_1', -- Replace with actual UUID from Step 1
  'Siddik Ali Admin',
  '+254712345678',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  user_type = 'admin',
  display_name = 'Siddik Ali Admin',
  updated_at = NOW();

-- Step 3: Give admin user an active subscription
INSERT INTO public.user_subscriptions (user_id, status, expires_at, created_at, updated_at)
VALUES (
  'USER_ID_FROM_STEP_1', -- Same UUID as above
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

-- Step 4: Verify the admin user was created
SELECT 
  au.email,
  p.display_name,
  p.user_type,
  s.status as subscription_status,
  s.expires_at
FROM auth.users au
JOIN public.profiles p ON au.id = p.user_id
LEFT JOIN public.user_subscriptions s ON au.id = s.user_id
WHERE au.email = 'siddikaligb@gmail.com';
