-- Script to get user IDs for creating sample inbox messages
-- This will help us identify which users exist in the system

-- Get all users with their basic information
SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    p.display_name,
    p.phone_number,
    COUNT(ka.id) as address_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.kivro_addresses ka ON u.id = ka.user_id
WHERE u.email_confirmed_at IS NOT NULL  -- Only confirmed users
GROUP BY u.id, u.email, u.created_at, p.display_name, p.phone_number
ORDER BY u.created_at DESC;

-- Get count of total users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN u.email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN p.display_name IS NOT NULL THEN 1 END) as users_with_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- Show sample user for testing (most recent confirmed user)
SELECT 
    u.id as sample_user_id,
    u.email as sample_email,
    p.display_name as sample_name,
    p.phone_number as sample_phone
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 1;
