-- Check what inbox-related tables actually exist in the database

-- List all tables that contain 'inbox' or 'message'
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%inbox%' OR table_name LIKE '%message%')
ORDER BY table_name;

-- Check structure of inbox_messages table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'inbox_messages'
ORDER BY ordinal_position;

-- Check structure of message_senders table  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'message_senders'
ORDER BY ordinal_position;

-- Check if user_inbox table exists (what backend expects)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_inbox'
ORDER BY ordinal_position;
