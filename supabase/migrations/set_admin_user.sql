-- ============================================================================
-- Set Admin User: siddikaligb@gmail.com
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current status
SELECT 
    '=== Current User Status ===' as info,
    au.id as user_id,
    au.email,
    p.display_name,
    p.user_type,
    p.phone_number,
    CASE 
        WHEN p.user_type = 'admin' THEN '✅ Already an admin'
        ELSE '❌ Not an admin - will be updated below'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'siddikaligb@gmail.com';

-- Step 2: Update user to admin (if not already)
UPDATE public.profiles 
SET user_type = 'admin',
    updated_at = NOW()
WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'siddikaligb@gmail.com'
);

-- Step 3: Verify the update
SELECT 
    '=== Updated User Status ===' as info,
    au.id as user_id,
    au.email,
    p.display_name,
    p.user_type,
    p.phone_number,
    CASE 
        WHEN p.user_type = 'admin' THEN '✅ Successfully set as admin!'
        ELSE '❌ Update failed - check if profile exists'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'siddikaligb@gmail.com';

-- Step 4: Check all admins in the system
SELECT 
    '=== All Admin Users ===' as info,
    au.email,
    p.display_name,
    p.user_type,
    p.created_at
FROM public.profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.user_type = 'admin'
ORDER BY p.created_at DESC;
