-- Get user ID for specific email: graciaariel777@gmail.com
-- This will return the user details for the target user

-- Get the specific user with all details
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at as user_created,
    u.updated_at as user_updated,
    p.display_name,
    p.phone_number,
    p.created_at as profile_created,
    COUNT(ka.id) as address_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.kivro_addresses ka ON u.id = ka.user_id
WHERE u.email = 'graciaariel777@gmail.com'
GROUP BY u.id, u.email, u.email_confirmed_at, u.created_at, u.updated_at, p.display_name, p.phone_number, p.created_at;

-- Also check if this user has any existing messages
SELECT 
    COUNT(*) as existing_messages,
    COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_messages,
    COUNT(CASE WHEN payment_required = true THEN 1 END) as payment_messages
FROM public.inbox_messages im
JOIN auth.users u ON im.user_id = u.id
WHERE u.email = 'graciaariel777@gmail.com';

-- Show the user ID clearly for easy copying
SELECT 
    u.id as "USER_ID_FOR_GRACIAARIEL777",
    'Copy this UUID for use in sample data scripts' as note
FROM auth.users u
WHERE u.email = 'graciaariel777@gmail.com';
