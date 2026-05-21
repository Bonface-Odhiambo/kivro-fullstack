-- Check and Set User Type to Courier
-- Run this in Supabase SQL Editor

-- 1. First, check your current user_type
-- Replace 'your-email@example.com' with your actual email
SELECT 
    p.user_id,
    u.email,
    p.display_name,
    p.user_type,
    p.phone_number
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'graciaariel777@gmail.com';  -- Replace with your email

-- 2. If user_type is NULL or not 'courier', update it:
UPDATE public.profiles
SET user_type = 'courier'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'graciaariel777@gmail.com'  -- Replace with your email
);

-- 3. Verify the update
SELECT 
    p.user_id,
    u.email,
    p.display_name,
    p.user_type,
    p.phone_number
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'graciaariel777@gmail.com';  -- Replace with your email

-- 4. Also update the user metadata in auth.users
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"user_type": "courier"}'::jsonb
WHERE email = 'graciaariel777@gmail.com';  -- Replace with your email

-- You should see user_type = 'courier' in the results
-- After running this, refresh your dashboard and the Courier Dashboard tab should appear!
