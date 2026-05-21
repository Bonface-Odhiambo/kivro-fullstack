-- Fix inbox structure by ensuring proper sender references
-- This handles the check_single_sender constraint properly

-- First, let's see what we're working with
SELECT 
    ms.id,
    ms.name,
    ms.sender_type,
    'Available senders' as status
FROM public.message_senders ms
ORDER BY ms.sender_type, ms.name;

-- Clear any existing data in user_inbox to start fresh
DELETE FROM public.user_inbox WHERE user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Clear existing government_senders and company_senders to avoid conflicts
DELETE FROM public.government_senders WHERE id IN (SELECT id FROM public.message_senders);
DELETE FROM public.company_senders WHERE id IN (SELECT id FROM public.message_senders);

-- Create government_senders with proper structure
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
    ms.id,
    ms.name as organization_name,
    CASE 
        WHEN ms.name ILIKE '%revenue%' THEN 'KRA'
        WHEN ms.name ILIKE '%transport%' THEN 'NTSA'
        WHEN ms.name ILIKE '%county%' THEN 'NCC'
        WHEN ms.name ILIKE '%communication%' THEN 'CAK'
        ELSE UPPER(LEFT(ms.name, 3))
    END as organization_code,
    ms.email as contact_email,
    ms.phone as contact_phone,
    ms.logo_url,
    COALESCE(ms.is_verified, true) as is_active,
    COALESCE(ms.created_at, NOW()) as created_at,
    COALESCE(ms.created_at, NOW()) as updated_at
FROM public.message_senders ms 
WHERE ms.sender_type = 'government';

-- Create company_senders with proper structure
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
    ms.id,
    ms.name as company_name,
    CASE 
        WHEN ms.name ILIKE '%safaricom%' THEN 'SAF'
        WHEN ms.name ILIKE '%power%' THEN 'KPLC'
        WHEN ms.name ILIKE '%equity%' THEN 'EQB'
        WHEN ms.name ILIKE '%jumia%' THEN 'JUM'
        WHEN ms.name ILIKE '%water%' THEN 'NWSC'
        WHEN ms.name ILIKE '%kaplan%' THEN 'KSA'
        ELSE UPPER(LEFT(ms.name, 3))
    END as company_code,
    ms.email as contact_email,
    ms.phone as contact_phone,
    ms.logo_url,
    CASE 
        WHEN ms.sender_type = 'business' THEN 'Telecommunications'
        WHEN ms.sender_type = 'legal' THEN 'Legal Services'
        WHEN ms.sender_type = 'utility' THEN 'Utilities'
        ELSE 'General Business'
    END as industry,
    COALESCE(ms.is_verified, true) as is_active,
    COALESCE(ms.created_at, NOW()) as created_at,
    COALESCE(ms.created_at, NOW()) as updated_at
FROM public.message_senders ms 
WHERE ms.sender_type != 'government' OR ms.sender_type IS NULL;

-- Verify senders were created
SELECT 'Government Senders' as type, COUNT(*) as count FROM public.government_senders;
SELECT 'Company Senders' as type, COUNT(*) as count FROM public.company_senders;

-- Now insert messages with guaranteed sender references
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
    -- Government sender: only set sender_id
    CASE 
        WHEN ms.sender_type = 'government' AND EXISTS(SELECT 1 FROM public.government_senders gs WHERE gs.id = im.sender_id)
        THEN im.sender_id 
        ELSE NULL 
    END as sender_id,
    -- Company sender: only set company_sender_id  
    CASE 
        WHEN (ms.sender_type != 'government' OR ms.sender_type IS NULL) AND EXISTS(SELECT 1 FROM public.company_senders cs WHERE cs.id = im.sender_id)
        THEN im.sender_id 
        ELSE NULL 
    END as company_sender_id,
    im.subject,
    im.message_content as message_body,
    COALESCE(im.message_type, 'notification') as message_type,
    COALESCE(im.priority, 'normal') as priority,
    CASE WHEN im.status = 'read' THEN true ELSE false END as is_read,
    false as is_archived,
    false as is_starred,
    im.reference_number,
    jsonb_build_object(
        'payment_required', COALESCE(im.payment_required, false),
        'payment_amount', im.payment_amount,
        'payment_due_date', im.payment_due_date
    ) as metadata,
    COALESCE(im.created_at, NOW()) as sent_at,
    COALESCE(im.created_at, NOW()) as created_at,
    COALESCE(im.updated_at, NOW()) as updated_at,
    CASE 
        WHEN ms.sender_type = 'government' THEN 'government'
        ELSE 'company'
    END as sender_type
FROM public.inbox_messages im
LEFT JOIN public.message_senders ms ON im.sender_id = ms.id
WHERE im.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Final verification
SELECT 
    'Final Results' as status,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sender_id IS NOT NULL THEN 1 END) as government_messages,
    COUNT(CASE WHEN company_sender_id IS NOT NULL THEN 1 END) as company_messages,
    COUNT(CASE WHEN sender_id IS NULL AND company_sender_id IS NULL THEN 1 END) as orphaned_messages
FROM public.user_inbox 
WHERE user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Show Gracia's messages with sender details
SELECT 
    ui.subject,
    COALESCE(gs.organization_name, cs.company_name, 'Unknown Sender') as sender_name,
    ui.sender_type,
    ui.priority,
    CASE WHEN ui.sender_id IS NOT NULL THEN 'Government' ELSE 'Company' END as sender_category,
    ui.sent_at
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
WHERE ui.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60'
ORDER BY ui.sent_at DESC;
