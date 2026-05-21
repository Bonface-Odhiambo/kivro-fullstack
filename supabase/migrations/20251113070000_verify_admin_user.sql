-- Verification script: Check admin user creation
-- Purpose: Verify that kivroafrica@gmail.com admin user was created correctly

-- Step 1: Check auth.users table
SELECT 
    '=== AUTH USERS CHECK ===' as section,
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
        ELSE '❌ Email NOT Confirmed'
    END as email_status
FROM auth.users 
WHERE email = 'kivroafrica@gmail.com';

-- Step 2: Check profiles table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE '=== PROFILES TABLE CHECK ===';
        
        -- Check if admin profile exists
        PERFORM 1 FROM profiles p
        JOIN auth.users au ON au.id = p.user_id
        WHERE au.email = 'kivroafrica@gmail.com' AND p.user_type = 'admin';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Admin profile found';
        ELSE
            RAISE NOTICE '❌ Admin profile NOT found or user_type is not admin';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Profiles table does not exist';
    END IF;
END $$;

-- Step 3: Show detailed profile info (if profiles table exists)
SELECT 
    '=== PROFILE DETAILS ===' as section,
    p.user_id,
    p.full_name,
    p.display_name,
    p.user_type,
    au.email,
    p.created_at as profile_created,
    au.created_at as auth_created
FROM profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'kivroafrica@gmail.com';

-- Step 4: Count total users
SELECT 
    '=== USER COUNTS ===' as section,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'admin') as admin_profiles,
    (SELECT COUNT(*) FROM profiles) as total_profiles;

-- Step 5: Show all users (for debugging)
SELECT 
    '=== ALL USERS ===' as section,
    au.email,
    p.user_type,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
ORDER BY au.created_at DESC
LIMIT 10;
