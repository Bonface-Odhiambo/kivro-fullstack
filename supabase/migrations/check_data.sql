-- Quick check to see if there's any data in the database
-- Run this in Supabase SQL Editor

-- 1. Check if there are any users
SELECT 'Users in profiles table:' as info, COUNT(*) as count FROM public.profiles;

-- 2. Check if there are any auth users
SELECT 'Users in auth.users:' as info, COUNT(*) as count FROM auth.users;

-- 3. Show sample users
SELECT 
    'Sample Users:' as info,
    au.id,
    au.email,
    p.display_name,
    p.user_type,
    p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
LIMIT 5;

-- 4. Check if current user is admin
-- Replace YOUR_EMAIL with your actual email
SELECT 
    'Your Admin Status:' as info,
    au.email,
    p.user_type,
    CASE 
        WHEN p.user_type = 'admin' THEN '✅ You are an admin'
        ELSE '❌ You are NOT an admin - need to update user_type'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- 5. If you need to make yourself admin, uncomment and run this:
-- UPDATE public.profiles 
-- SET user_type = 'admin' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
