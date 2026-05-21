-- ============================================================================
-- STEP 1: Get User ID from Supabase
-- ============================================================================
-- Run this SQL first in your Supabase SQL Editor to find the user ID
-- Copy the user_id from the results to use in subsequent migrations

-- Option 1: Get all users with their profile information
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as account_created,
    p.display_name,
    p.phone_number,
    p.user_type,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
ORDER BY au.created_at DESC
LIMIT 20;

-- Option 2: Get user by email (replace with actual email)
/*
SELECT 
    au.id as user_id,
    au.email,
    p.display_name,
    p.phone_number,
    p.user_type
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'your-email@example.com';
*/

-- Option 3: Get user by phone number (if stored in profiles)
/*
SELECT 
    au.id as user_id,
    au.email,
    p.display_name,
    p.phone_number,
    p.user_type
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.phone_number = '+252-XX-XXXXXXX';
*/

-- Option 4: Get currently authenticated user (if running from authenticated context)
/*
SELECT 
    auth.uid() as user_id,
    au.email,
    p.display_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.id = auth.uid();
*/

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Run Option 1 to see all users
-- 2. Find your user in the results
-- 3. Copy the user_id (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
-- 4. Use this user_id in the next migration files
-- ============================================================================
