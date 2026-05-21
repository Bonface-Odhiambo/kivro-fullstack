-- Check if inbox tables exist and are accessible
-- Run this first to verify database setup

-- Check if message_senders table exists
SELECT 
    COUNT(*) as existing_senders,
    'message_senders table exists' as status
FROM public.message_senders;

-- Check if inbox_messages table exists  
SELECT 
    COUNT(*) as existing_messages,
    'inbox_messages table exists' as status
FROM public.inbox_messages;

-- Check if user exists
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    'User found' as status
FROM auth.users u 
WHERE u.id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Check current message count for Gracia
SELECT 
    COUNT(*) as current_message_count,
    'Current messages for Gracia' as status
FROM public.inbox_messages 
WHERE user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';
