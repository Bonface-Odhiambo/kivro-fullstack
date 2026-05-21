-- Create the proper inbox structure that matches backend expectations
-- The backend expects government_senders and company_senders tables

-- First, let's clear any existing data in user_inbox to avoid conflicts
DELETE FROM public.user_inbox WHERE user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Create government_senders from our message_senders (government types)
INSERT INTO public.government_senders (
    id,
    organization_name,
    organization_code,
    contact_email,
    contact_phone,
    logo_url,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,
    name as organization_name,
    UPPER(LEFT(name, 3)) as organization_code, -- Generate code from name
    email as contact_email,
    phone as contact_phone,
    logo_url,
    is_verified as is_active,
    created_at,
    created_at as updated_at
FROM public.message_senders 
WHERE sender_type = 'government'
ON CONFLICT (id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    logo_url = EXCLUDED.logo_url,
    is_active = EXCLUDED.is_active;

-- Create company_senders from our message_senders (non-government types)
INSERT INTO public.company_senders (
    id,
    company_name,
    company_code,
    contact_email,
    contact_phone,
    logo_url,
    industry,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,
    name as company_name,
    UPPER(LEFT(name, 3)) as company_code, -- Generate code from name
    email as contact_email,
    phone as contact_phone,
    logo_url,
    CASE 
        WHEN sender_type = 'business' THEN 'Business Services'
        WHEN sender_type = 'legal' THEN 'Legal Services'
        WHEN sender_type = 'utility' THEN 'Utilities'
        ELSE 'General'
    END as industry,
    is_verified as is_active,
    created_at,
    created_at as updated_at
FROM public.message_senders 
WHERE sender_type != 'government'
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    logo_url = EXCLUDED.logo_url,
    industry = EXCLUDED.industry,
    is_active = EXCLUDED.is_active;

-- Now insert messages into user_inbox with proper sender references
INSERT INTO public.user_inbox (
    id,
    user_id,
    sender_id,
    company_sender_id,
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
    -- Set company_sender_id for non-government senders
    CASE 
        WHEN ms.sender_type != 'government' THEN im.sender_id 
        ELSE NULL 
    END as company_sender_id,
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
    ms.sender_type
FROM public.inbox_messages im
JOIN public.message_senders ms ON im.sender_id = ms.id;

-- Verify the setup
SELECT 
    'Government Senders Created' as status,
    COUNT(*) as count
FROM public.government_senders;

SELECT 
    'Company Senders Created' as status,
    COUNT(*) as count
FROM public.company_senders;

SELECT 
    'Messages in user_inbox' as status,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60' THEN 1 END) as gracia_messages
FROM public.user_inbox;

-- Show Gracia's messages with proper sender info
SELECT 
    ui.subject,
    COALESCE(gs.organization_name, cs.company_name) as sender_name,
    ui.sender_type,
    ui.priority,
    ui.is_read,
    ui.sent_at
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
WHERE ui.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60'
ORDER BY ui.sent_at DESC;
