-- Migrate messages from inbox_messages to user_inbox table
-- This fixes the table name mismatch issue

-- First, let's see what we have in inbox_messages
SELECT 
    COUNT(*) as messages_in_inbox_messages,
    'Current messages in inbox_messages table' as status
FROM public.inbox_messages;

-- Check what's in user_inbox (should be empty)
SELECT 
    COUNT(*) as messages_in_user_inbox,
    'Current messages in user_inbox table' as status  
FROM public.user_inbox;

-- Now migrate the data from inbox_messages to user_inbox
-- We need to map the fields correctly based on the table structures

INSERT INTO public.user_inbox (
    id,
    user_id,
    sender_id,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    is_read,
    is_archived,
    is_starred,
    reference_number,
    metadata,
    sent_at,
    created_at,
    updated_at,
    sender_type
)
SELECT 
    im.id,
    im.user_id,
    im.sender_id,
    NULL as category_id, -- We'll need to handle categories separately
    im.subject,
    im.message_content as message_body, -- Field name mapping
    im.message_type,
    im.priority,
    CASE WHEN im.status = 'read' THEN true ELSE false END as is_read, -- Map status to boolean
    false as is_archived, -- Default value
    false as is_starred,  -- Default value
    im.reference_number,
    jsonb_build_object(
        'payment_required', im.payment_required,
        'payment_amount', im.payment_amount,
        'payment_due_date', im.payment_due_date
    ) as metadata, -- Combine payment fields into metadata
    im.created_at as sent_at, -- Use created_at as sent_at
    im.created_at,
    im.updated_at,
    'business' as sender_type -- Default sender type, we'll update this based on sender
FROM public.inbox_messages im;

-- Update sender_type based on sender information
UPDATE public.user_inbox 
SET sender_type = CASE 
    WHEN EXISTS (
        SELECT 1 FROM public.message_senders ms 
        WHERE ms.id = user_inbox.sender_id 
        AND ms.sender_type = 'government'
    ) THEN 'government'
    WHEN EXISTS (
        SELECT 1 FROM public.message_senders ms 
        WHERE ms.id = user_inbox.sender_id 
        AND ms.sender_type = 'business'
    ) THEN 'company'
    WHEN EXISTS (
        SELECT 1 FROM public.message_senders ms 
        WHERE ms.id = user_inbox.sender_id 
        AND ms.sender_type = 'legal'
    ) THEN 'company'
    WHEN EXISTS (
        SELECT 1 FROM public.message_senders ms 
        WHERE ms.id = user_inbox.sender_id 
        AND ms.sender_type = 'utility'
    ) THEN 'company'
    ELSE 'company'
END;

-- Verify the migration
SELECT 
    COUNT(*) as migrated_messages,
    COUNT(CASE WHEN user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60' THEN 1 END) as gracia_messages,
    'Messages successfully migrated to user_inbox' as status
FROM public.user_inbox;

-- Show Gracia's messages in the correct table
SELECT 
    ui.subject,
    ms.name as sender_name,
    ui.message_type,
    ui.priority,
    ui.is_read,
    ui.sender_type,
    ui.sent_at
FROM public.user_inbox ui
LEFT JOIN public.message_senders ms ON ui.sender_id = ms.id
WHERE ui.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60'
ORDER BY ui.sent_at DESC;
