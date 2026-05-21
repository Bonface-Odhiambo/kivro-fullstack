-- Make siddikaligb@gmail.com an admin user
-- User ID: decd74a3-cf3e-4e20-8bbc-c29a5a033473

-- Step 1: Create/Update profile to admin
INSERT INTO public.profiles (user_id, display_name, phone_number, user_type, created_at, updated_at)
VALUES (
  'decd74a3-cf3e-4e20-8bbc-c29a5a033473',
  'Siddik Ali - Admin',
  '+254712345678',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  user_type = 'admin',
  display_name = 'Siddik Ali - Admin',
  updated_at = NOW();

-- Step 2: Give admin user an active subscription
INSERT INTO public.user_subscriptions (user_id, status, expires_at, created_at, updated_at)
VALUES (
  'decd74a3-cf3e-4e20-8bbc-c29a5a033473',
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

-- Step 3: Verify the admin user was created
SELECT 
  au.email,
  p.display_name,
  p.user_type,
  s.status as subscription_status,
  s.expires_at
FROM auth.users au
JOIN public.profiles p ON au.id = p.user_id
LEFT JOIN public.user_subscriptions s ON au.id = s.user_id
WHERE au.id = 'decd74a3-cf3e-4e20-8bbc-c29a5a033473';
