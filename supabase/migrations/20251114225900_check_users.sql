-- Check existing users in the database
-- This will show us what users we have before creating sample messages

-- Show all users with their profile information
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at as user_created,
    p.display_name,
    p.phone_number,
    COUNT(ka.id) as address_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.kivro_addresses ka ON u.id = ka.user_id
GROUP BY u.id, u.email, u.email_confirmed_at, u.created_at, p.display_name, p.phone_number
ORDER BY u.created_at DESC;

-- Show summary statistics
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN u.email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN p.display_name IS NOT NULL THEN 1 END) as users_with_profiles,
    COUNT(CASE WHEN ka.id IS NOT NULL THEN 1 END) as users_with_addresses
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.kivro_addresses ka ON u.id = ka.user_id;

-- Show existing message senders (if any)
SELECT 
    COUNT(*) as existing_senders,
    COUNT(CASE WHEN sender_type = 'government' THEN 1 END) as government_senders,
    COUNT(CASE WHEN sender_type = 'business' THEN 1 END) as business_senders,
    COUNT(CASE WHEN sender_type = 'legal' THEN 1 END) as legal_senders
FROM public.message_senders;

-- Show existing messages (if any)
SELECT 
    COUNT(*) as existing_messages,
    COUNT(CASE WHEN message_type = 'government' THEN 1 END) as government_messages,
    COUNT(CASE WHEN message_type = 'business' THEN 1 END) as business_messages,
    COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_messages
FROM public.inbox_messages;
