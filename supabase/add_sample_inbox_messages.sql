-- ============================================================================
-- Add Sample Inbox Messages for Test User
-- Email: principalresearcher138@gmail.com
-- ============================================================================

-- Get user ID for the email
DO $$
DECLARE
    v_user_id UUID;
    v_police_sender_id UUID;
    v_health_sender_id UUID;
    v_tax_sender_id UUID;
    v_telecom_sender_id UUID;
    v_bank_sender_id UUID;
BEGIN
    -- Get user ID
    SELECT user_id INTO v_user_id
    FROM public.profiles
    WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'principalresearcher138@gmail.com'
    )
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email principalresearcher138@gmail.com not found';
    END IF;

    RAISE NOTICE 'Found user ID: %', v_user_id;

    -- Get or create government senders
    INSERT INTO public.government_senders (organization_name, organization_code, organization_type, contact_email, contact_phone, logo_url)
    VALUES 
        ('Somalia Police Force', 'POLICE', 'law_enforcement', 'traffic@police.gov.so', '+252612345001', NULL),
        ('Ministry of Health', 'HEALTH_MIN', 'health', 'info@health.gov.so', '+252612345002', NULL),
        ('Somalia Revenue Authority', 'SRA', 'tax', 'info@sra.gov.so', '+252612345003', NULL)
    ON CONFLICT (organization_code) DO NOTHING;

    SELECT id INTO v_police_sender_id FROM public.government_senders WHERE organization_code = 'POLICE' LIMIT 1;
    SELECT id INTO v_health_sender_id FROM public.government_senders WHERE organization_code = 'HEALTH_MIN' LIMIT 1;
    SELECT id INTO v_tax_sender_id FROM public.government_senders WHERE organization_code = 'SRA' LIMIT 1;

    -- Get or create company senders
    INSERT INTO public.company_senders (company_name, company_code, industry, contact_email, contact_phone, logo_url)
    VALUES 
        ('Hormuud Telecom', 'HORMUUD', 'telecommunications', 'support@hormuud.com', '+252612345100', NULL),
        ('Salaam Bank', 'SALAAM_BANK', 'banking', 'info@salaambank.com', '+252612345200', NULL)
    ON CONFLICT (company_code) DO NOTHING;

    SELECT id INTO v_telecom_sender_id FROM public.company_senders WHERE company_code = 'HORMUUD' LIMIT 1;
    SELECT id INTO v_bank_sender_id FROM public.company_senders WHERE company_code = 'SALAAM_BANK' LIMIT 1;

    -- MESSAGE 1: Traffic Violation (Urgent)
    INSERT INTO public.user_inbox (
        user_id, sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_police_sender_id,
        'government',
        'Traffic Violation Notice - Speeding',
        'Dear Citizen,

This is an official notice regarding a traffic violation detected on your vehicle.

Violation Details:
- Date: October 15, 2025
- Time: 14:30 PM
- Location: Maka Al-Mukarama Road, Mogadishu
- Violation: Exceeding speed limit (85 km/h in a 60 km/h zone)
- Vehicle: Registered to your KIVRO address

Fine Amount: $75 USD
Payment Due: November 15, 2025

You have the right to appeal this fine within 14 days. To pay or appeal, please visit our office or use the KIVRO payment system.

Somalia Police Force
Traffic Department',
        'fine',
        'urgent',
        'SPF-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '2 days',
        FALSE,
        '{"fine_amount": 75, "currency": "USD", "due_date": "2025-11-15", "can_appeal": true}'::JSONB
    );

    -- MESSAGE 2: Health Certificate (Normal)
    INSERT INTO public.user_inbox (
        user_id, sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_health_sender_id,
        'government',
        'COVID-19 Vaccination Certificate Available',
        'Dear Citizen,

Your COVID-19 vaccination certificate is now available for download.

Vaccination Details:
- Vaccine: Pfizer-BioNTech
- Dose 1: August 10, 2025
- Dose 2: September 7, 2025
- Booster: October 5, 2025
- Certificate Number: VAX-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '

This certificate is valid for international travel and can be used as proof of vaccination.

You can download your certificate from the KIVRO platform or visit any Ministry of Health office.

Ministry of Health
Republic of Somalia',
        'certificate',
        'normal',
        'HEALTH-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '5 days',
        FALSE,
        '{"certificate_type": "vaccination", "valid_until": "2026-10-05"}'::JSONB
    );

    -- MESSAGE 3: Tax Reminder (High Priority)
    INSERT INTO public.user_inbox (
        user_id, sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_tax_sender_id,
        'government',
        'Annual Tax Return Reminder - Due Soon',
        'Dear Taxpayer,

This is a reminder that your annual tax return for 2025 is due soon.

Tax Return Details:
- Tax Year: 2025
- Taxpayer ID: TIN-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '
- Filing Deadline: November 30, 2025
- Estimated Tax Due: $450 USD

Required Documents:
✓ Income statements
✓ Business receipts (if applicable)
✓ Previous year tax return
✓ KIVRO address verification

You can file your return online through the KIVRO platform or visit any SRA office.

Failure to file by the deadline may result in penalties.

Somalia Revenue Authority
Tax Department',
        'notification',
        'high',
        'SRA-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '1 day',
        FALSE,
        '{"tax_year": 2025, "deadline": "2025-11-30", "estimated_amount": 450}'::JSONB
    );

    -- MESSAGE 4: Telecom Bill (Normal)
    INSERT INTO public.user_inbox (
        user_id, company_sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_telecom_sender_id,
        'company',
        'Your Monthly Bill is Ready - October 2025',
        'Dear Valued Customer,

Your Hormuud Telecom bill for October 2025 is now available.

📱 Bill Summary:
- Account Number: ' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0') || '
- Billing Period: October 1-31, 2025
- Total Amount Due: $35 USD
- Due Date: November 10, 2025

📊 Services Breakdown:
- Mobile Plan: $20
- Data Package (10GB): $10
- International Calls: $5

💳 Payment Methods:
You can pay your bill through:
✓ EVC Plus
✓ Mobile Money
✓ KIVRO Payment System
✓ Hormuud Branches

Thank you for choosing Hormuud Telecom!

Customer Service: +252612345100',
        'invoice',
        'normal',
        'HRM-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '3 days',
        TRUE,
        '{"bill_amount": 35, "currency": "USD", "due_date": "2025-11-10", "account_number": "' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0') || '"}'::JSONB
    );

    -- MESSAGE 5: Bank Statement (Normal)
    INSERT INTO public.user_inbox (
        user_id, company_sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_bank_sender_id,
        'company',
        'Monthly Account Statement - October 2025',
        'Dear Valued Customer,

Your Salaam Bank account statement for October 2025 is ready.

Account Summary:
- Account Number: ' || LPAD(FLOOR(RANDOM() * 99999999)::TEXT, 8, '0') || '
- Account Type: Savings Account
- Statement Period: October 1-31, 2025

💰 Balance Information:
- Opening Balance: $1,250.00
- Total Credits: $850.00
- Total Debits: $420.00
- Closing Balance: $1,680.00

📊 Transaction Summary:
- Number of Transactions: 15
- Largest Credit: $500.00
- Largest Debit: $150.00

You can view your detailed statement on the KIVRO platform or visit any Salaam Bank branch.

Thank you for banking with us!

Salaam Bank
Customer Service: +252612345200',
        'statement',
        'normal',
        'SLM-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '7 days',
        TRUE,
        '{"account_number": "' || LPAD(FLOOR(RANDOM() * 99999999)::TEXT, 8, '0') || '", "closing_balance": 1680, "currency": "USD"}'::JSONB
    );

    -- MESSAGE 6: Police Clearance Certificate (Normal)
    INSERT INTO public.user_inbox (
        user_id, sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_police_sender_id,
        'government',
        'Police Clearance Certificate Ready for Collection',
        'Dear Citizen,

Your Police Clearance Certificate application has been processed and approved.

Application Details:
- Application Number: PCC-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '
- Application Date: September 25, 2025
- Processing Status: APPROVED
- Certificate Number: CERT-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '

Your certificate is ready for collection at:
Somalia Police Force Headquarters
Maka Al-Mukarama Road, Mogadishu

Collection Hours: Sunday - Thursday, 8:00 AM - 4:00 PM

Please bring:
✓ Your KIVRO address verification
✓ National ID or Passport
✓ Application receipt

The certificate is valid for 6 months from the date of issue.

Somalia Police Force
Criminal Records Department',
        'certificate',
        'normal',
        'PCC-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '10 days',
        FALSE,
        '{"certificate_type": "police_clearance", "valid_until": "2026-04-22", "collection_required": true}'::JSONB
    );

    -- MESSAGE 7: Utility Bill (High Priority)
    INSERT INTO public.user_inbox (
        user_id, sender_id, sender_type, subject, message_body, message_type, priority,
        reference_number, sent_at, is_read, metadata
    ) VALUES (
        v_user_id,
        v_tax_sender_id,
        'government',
        'Water & Electricity Bill - Payment Overdue',
        'Dear Customer,

This is a notice regarding your overdue water and electricity bill.

Account Details:
- Customer Number: ' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '
- Service Address: Registered to your KIVRO address
- Billing Period: September 2025

💧 Water Charges: $15 USD
⚡ Electricity Charges: $45 USD
📋 Service Fee: $5 USD
━━━━━━━━━━━━━━━━━━━━━━━━
Total Amount Due: $65 USD

⚠️ IMPORTANT: This bill is now 15 days overdue.

Please make payment within 5 days to avoid service disconnection.

Payment Methods:
✓ KIVRO Payment System
✓ Mobile Money
✓ Utility Company Offices

For any queries, contact us at +252612345003

Mogadishu Water & Power Authority',
        'invoice',
        'high',
        'UTIL-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        NOW() - INTERVAL '15 days',
        FALSE,
        '{"bill_amount": 65, "currency": "USD", "days_overdue": 15, "disconnection_warning": true}'::JSONB
    );

    RAISE NOTICE '✅ Successfully added 7 sample messages for user: %', v_user_id;
    RAISE NOTICE '📧 Messages include: Traffic fine, Health certificate, Tax reminder, Telecom bill, Bank statement, Police clearance, Utility bill';
    
END $$;

-- Verify the messages were inserted
SELECT 
    ui.subject,
    CASE 
        WHEN ui.sender_type = 'government' THEN gs.organization_name
        WHEN ui.sender_type = 'company' THEN cs.company_name
    END as sender,
    ui.priority,
    ui.is_read,
    ui.sent_at
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
WHERE ui.user_id IN (
    SELECT user_id FROM public.profiles 
    WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'principalresearcher138@gmail.com')
)
ORDER BY ui.sent_at DESC;
