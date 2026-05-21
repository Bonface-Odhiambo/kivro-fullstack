-- Create sample inbox messages and senders for KIVRO
-- Migration: 20251114230000_create_sample_inbox_data.sql

-- First, let's create sample senders (government agencies, businesses, etc.)
INSERT INTO public.message_senders (
    id, name, email, phone, sender_type, organization, 
    logo_url, is_verified, verification_level, created_at
) VALUES 
-- Government Senders
(
    gen_random_uuid(),
    'Kenya Revenue Authority',
    'notices@kra.go.ke',
    '+254-20-4999999',
    'government',
    'Kenya Revenue Authority',
    'https://www.kra.go.ke/images/kra-logo.png',
    true,
    'official',
    NOW() - INTERVAL '30 days'
),
(
    gen_random_uuid(),
    'National Transport and Safety Authority',
    'info@ntsa.go.ke',
    '+254-20-2717000',
    'government',
    'NTSA Kenya',
    'https://www.ntsa.go.ke/images/ntsa-logo.png',
    true,
    'official',
    NOW() - INTERVAL '25 days'
),
(
    gen_random_uuid(),
    'Nairobi City County',
    'info@nairobi.go.ke',
    '+254-20-2227461',
    'government',
    'Nairobi City County Government',
    'https://www.nairobi.go.ke/images/county-logo.png',
    true,
    'official',
    NOW() - INTERVAL '20 days'
),
(
    gen_random_uuid(),
    'Communications Authority of Kenya',
    'info@ca.go.ke',
    '+254-20-4242000',
    'government',
    'Communications Authority of Kenya',
    'https://www.ca.go.ke/images/ca-logo.png',
    true,
    'official',
    NOW() - INTERVAL '15 days'
),

-- Business Senders
(
    gen_random_uuid(),
    'Safaricom PLC',
    'customer.care@safaricom.co.ke',
    '+254-722-000000',
    'business',
    'Safaricom PLC',
    'https://www.safaricom.co.ke/images/safaricom-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '10 days'
),
(
    gen_random_uuid(),
    'Kenya Power',
    'customercare@kplc.co.ke',
    '+254-703-070707',
    'business',
    'Kenya Power and Lighting Company',
    'https://www.kplc.co.ke/images/kplc-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '8 days'
),
(
    gen_random_uuid(),
    'Equity Bank Kenya',
    'info@equitybank.co.ke',
    '+254-763-026000',
    'business',
    'Equity Bank Kenya Limited',
    'https://www.equitybank.co.ke/images/equity-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '12 days'
),
(
    gen_random_uuid(),
    'Jumia Kenya',
    'care@jumia.co.ke',
    '+254-709-299000',
    'business',
    'Jumia Kenya Limited',
    'https://www.jumia.co.ke/images/jumia-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '5 days'
),

-- Legal/Professional Senders
(
    gen_random_uuid(),
    'Kaplan & Stratton Advocates',
    'info@kaplanlegal.co.ke',
    '+254-20-2221234',
    'legal',
    'Kaplan & Stratton Advocates',
    null,
    true,
    'verified',
    NOW() - INTERVAL '18 days'
),
(
    gen_random_uuid(),
    'Nairobi Water and Sewerage Company',
    'customercare@nairobiwater.co.ke',
    '+254-20-557000',
    'utility',
    'Nairobi Water and Sewerage Company',
    'https://www.nairobiwater.co.ke/images/nwsc-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '7 days'
)
ON CONFLICT (email) DO NOTHING;

-- Create sample messages for all confirmed users
DO $$
DECLARE
    user_record RECORD;
    kra_sender_id UUID;
    ntsa_sender_id UUID;
    county_sender_id UUID;
    safaricom_sender_id UUID;
    kplc_sender_id UUID;
    equity_sender_id UUID;
    jumia_sender_id UUID;
    legal_sender_id UUID;
    water_sender_id UUID;
    message_count INTEGER := 0;
BEGIN
    -- Get sender IDs
    SELECT id INTO kra_sender_id FROM public.message_senders WHERE email = 'notices@kra.go.ke';
    SELECT id INTO ntsa_sender_id FROM public.message_senders WHERE email = 'info@ntsa.go.ke';
    SELECT id INTO county_sender_id FROM public.message_senders WHERE email = 'info@nairobi.go.ke';
    SELECT id INTO safaricom_sender_id FROM public.message_senders WHERE email = 'customer.care@safaricom.co.ke';
    SELECT id INTO kplc_sender_id FROM public.message_senders WHERE email = 'customercare@kplc.co.ke';
    SELECT id INTO equity_sender_id FROM public.message_senders WHERE email = 'info@equitybank.co.ke';
    SELECT id INTO jumia_sender_id FROM public.message_senders WHERE email = 'care@jumia.co.ke';
    SELECT id INTO legal_sender_id FROM public.message_senders WHERE email = 'info@kaplanlegal.co.ke';
    SELECT id INTO water_sender_id FROM public.message_senders WHERE email = 'customercare@nairobiwater.co.ke';
    
    -- Loop through all confirmed users and create sample messages
    FOR user_record IN 
        SELECT u.id as user_id, u.email, p.display_name
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        WHERE u.email_confirmed_at IS NOT NULL
        ORDER BY u.created_at DESC
    LOOP
        -- Insert sample messages for each user
        INSERT INTO public.inbox_messages (
            id, user_id, sender_id, subject, message_content, message_type,
            priority, status, payment_required, payment_amount, payment_due_date,
            reference_number, created_at, updated_at
        ) VALUES 
        
        -- Government Tax Notice
        (
            gen_random_uuid(),
            user_record.user_id,
            kra_sender_id,
            'Tax Return Filing Reminder - Due December 31, 2025',
            'Dear Taxpayer,

This is to remind you that your annual tax return for the year 2024 is due for filing by December 31, 2025.

Please ensure you file your returns on time to avoid penalties. You can file online through the iTax portal at www.itax.kra.go.ke

Required Documents:
- Employment certificates (P9 forms)
- Bank statements
- Investment income statements
- Business income records (if applicable)

Late filing penalties:
- Individual returns: KES 2,000 per month or part thereof
- Business returns: KES 5,000 per month or part thereof

For assistance, visit any KRA service center or call our helpline.

Thank you for your compliance.

Kenya Revenue Authority
Tax Compliance Department',
            'government',
            'high',
            'unread',
            false,
            null,
            null,
            'KRA/TAX/2025/' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0'),
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        ),
        
        -- Vehicle License Renewal
        (
            gen_random_uuid(),
            user_record.user_id,
            ntsa_sender_id,
            'Vehicle License Renewal Notice - KCA ' || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0') || 'A',
            'Dear Vehicle Owner,

Your vehicle license is due for renewal on January 15, 2026.

Vehicle Details:
- Registration: KCA ' || LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0') || 'A
- Make/Model: Toyota Corolla
- Year: 2018
- Engine: 1800cc

Renewal Requirements:
- Valid insurance certificate
- Inspection certificate (if applicable)
- Payment of renewal fees

You can renew online at www.ecitizen.go.ke or visit any NTSA office.

Failure to renew on time will result in penalties and your vehicle may be impounded.

National Transport and Safety Authority
Vehicle Registration Department',
            'government',
            'medium',
            'unread',
            true,
            4500.00,
            '2026-01-15',
            'NTSA/VL/2025/' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0'),
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '5 days'
        ),
        
        -- Safaricom Bill
        (
            gen_random_uuid(),
            user_record.user_id,
            safaricom_sender_id,
            'Your Safaricom Bill is Ready - KES ' || (2000 + (RANDOM() * 1000)::INTEGER),
            'Hello Valued Customer,

Your Safaricom bill for November 2025 is now ready.

Account Summary:
- Account Number: 0722' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0')
- Billing Period: November 1-30, 2025
- Amount Due: KES ' || (2000 + (RANDOM() * 1000)::INTEGER) || '
- Due Date: December 15, 2025

Services Used:
- Postpaid Voice: KES 1,200
- Data Bundle: KES 800
- SMS: KES 150
- Value Added Services: KES 300

Payment Options:
- M-PESA: Pay Bill 100100
- Banking: Account 1234567890
- Safaricom Shops
- Online: www.safaricom.co.ke

Thank you for choosing Safaricom.

Safaricom Customer Care
Twaweza!',
            'business',
            'medium',
            'unread',
            true,
            (2000 + (RANDOM() * 1000)::INTEGER)::DECIMAL,
            '2025-12-15',
            'SAF/BILL/2025/' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0'),
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '3 days'
        ),
        
        -- Jumia Delivery
        (
            gen_random_uuid(),
            user_record.user_id,
            jumia_sender_id,
            'Your Order is Out for Delivery - Order #JM' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0'),
            'Hi there!

Great news! Your Jumia order is out for delivery and will arrive today.

Order Details:
- Order Number: JM' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0') || '
- Items: Samsung Galaxy Earbuds, Phone Case
- Total: KES ' || (10000 + (RANDOM() * 5000)::INTEGER) || '
- Delivery Address: Nairobi

Tracking Information:
- Status: Out for Delivery
- Expected Delivery: Today, 2:00 PM - 6:00 PM
- Delivery Partner: Jumia Express

Our delivery agent will call you 30 minutes before arrival. Please ensure someone is available to receive the package.

Payment: Cash on Delivery

Track your order: www.jumia.co.ke/track

Thank you for shopping with Jumia!

Jumia Kenya
Customer Experience Team',
            'business',
            'low',
            'read',
            false,
            null,
            null,
            'JM' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0'),
            NOW() - INTERVAL '6 hours',
            NOW() - INTERVAL '4 hours'
        );
        
        message_count := message_count + 4;
    END LOOP;
    
    RAISE NOTICE 'Created % sample messages for % users', message_count, (message_count / 4);
    RAISE NOTICE 'Sample inbox data setup completed successfully!';
    
END $$;
