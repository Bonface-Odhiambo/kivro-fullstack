-- Fixed migration script that handles the check_single_sender constraint
-- This ensures proper sender_id and company_sender_id assignment

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

-- Check the sender types in message_senders to understand the constraint
SELECT 
    sender_type,
    COUNT(*) as count
FROM public.message_senders
GROUP BY sender_type;

-- Now migrate the data with proper sender field assignment
-- The check_single_sender constraint requires either sender_id OR company_sender_id, not both

INSERT INTO public.user_inbox (
    id,
    user_id,
    sender_id,
    company_sender_id,
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
    -- Set sender_id only for government senders
    CASE 
        WHEN ms.sender_type = 'government' THEN im.sender_id 
        ELSE NULL 
    END as sender_id,
    -- Set company_sender_id for all non-government senders
    CASE 
        WHEN ms.sender_type != 'government' OR ms.sender_type IS NULL THEN im.sender_id 
        ELSE NULL 
    END as company_sender_id,
    NULL as category_id, -- We'll handle categories separately if needed
    im.subject,
    im.message_content as message_body,
    im.message_type,
    im.priority,
    CASE WHEN im.status = 'read' THEN true ELSE false END as is_read,
    false as is_archived,
    false as is_starred,
    im.reference_number,
    jsonb_build_object(
        'payment_required', im.payment_required,
        'payment_amount', im.payment_amount,
        'payment_due_date', im.payment_due_date
    ) as metadata,
    im.created_at as sent_at,
    im.created_at,
    im.updated_at,
    -- Set sender_type based on message_senders table
    CASE 
        WHEN ms.sender_type = 'government' THEN 'government'
        WHEN ms.sender_type IN ('business', 'legal', 'utility') THEN 'company'
        ELSE 'company'
    END as sender_type
FROM public.inbox_messages im
LEFT JOIN public.message_senders ms ON im.sender_id = ms.id;

-- Verify the migration
SELECT 
    COUNT(*) as migrated_messages,
    COUNT(CASE WHEN user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60' THEN 1 END) as gracia_messages,
    COUNT(CASE WHEN sender_id IS NOT NULL THEN 1 END) as government_messages,
    COUNT(CASE WHEN company_sender_id IS NOT NULL THEN 1 END) as company_messages,
    'Messages successfully migrated to user_inbox' as status
FROM public.user_inbox;

-- Show Gracia's messages in the correct table with sender info
SELECT 
    ui.subject,
    COALESCE(gs.organization_name, cs.company_name, ms.name) as sender_name,
    ui.message_type,
    ui.priority,
    ui.is_read,
    ui.sender_type,
    ui.sent_at,
    CASE 
        WHEN ui.sender_id IS NOT NULL THEN 'Government Sender'
        WHEN ui.company_sender_id IS NOT NULL THEN 'Company Sender'
        ELSE 'Unknown Sender'
    END as sender_category
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
LEFT JOIN public.message_senders ms ON (ui.sender_id = ms.id OR ui.company_sender_id = ms.id)
WHERE ui.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60'
ORDER BY ui.sent_at DESC;
