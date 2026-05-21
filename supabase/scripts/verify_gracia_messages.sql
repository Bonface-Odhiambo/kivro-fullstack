-- Verify messages were created for Gracia Ariel
-- User ID: 950cc6b4-95f0-4aca-ba20-791123c07f60

-- Check if messages were created successfully
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN message_type = 'government' THEN 1 END) as government_messages,
    COUNT(CASE WHEN message_type = 'business' THEN 1 END) as business_messages,
    COUNT(CASE WHEN message_type = 'legal' THEN 1 END) as legal_messages,
    COUNT(CASE WHEN message_type = 'utility' THEN 1 END) as utility_messages,
    COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_messages,
    COUNT(CASE WHEN payment_required = true THEN 1 END) as payment_messages,
    SUM(CASE WHEN payment_required = true THEN payment_amount ELSE 0 END) as total_payment_amount
FROM public.inbox_messages 
WHERE user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Show all messages for Gracia with details
SELECT 
    im.subject,
    ms.name as sender_name,
    im.message_type,
    im.priority,
    im.status,
    im.payment_required,
    im.payment_amount,
    im.payment_due_date,
    im.reference_number,
    im.created_at
FROM public.inbox_messages im
JOIN public.message_senders ms ON im.sender_id = ms.id
WHERE im.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60'
ORDER BY im.created_at DESC;

-- Check message senders were created
SELECT 
    COUNT(*) as total_senders,
    COUNT(CASE WHEN sender_type = 'government' THEN 1 END) as government_senders,
    COUNT(CASE WHEN sender_type = 'business' THEN 1 END) as business_senders,
    COUNT(CASE WHEN sender_type = 'legal' THEN 1 END) as legal_senders,
    COUNT(CASE WHEN sender_type = 'utility' THEN 1 END) as utility_senders,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_senders
FROM public.message_senders;
