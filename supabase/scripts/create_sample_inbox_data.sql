-- Create sample inbox messages and senders for KIVRO
-- This script populates realistic government, business, and legal messages

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

-- Now create sample messages for users
-- Note: Replace 'USER_ID_HERE' with actual user ID from get_user_ids.sql results

DO $$
DECLARE
    sample_user_id UUID;
    kra_sender_id UUID;
    ntsa_sender_id UUID;
    county_sender_id UUID;
    safaricom_sender_id UUID;
    kplc_sender_id UUID;
    equity_sender_id UUID;
    jumia_sender_id UUID;
    legal_sender_id UUID;
    water_sender_id UUID;
BEGIN
    -- Get a sample user (most recent confirmed user)
    SELECT u.id INTO sample_user_id
    FROM auth.users u
    WHERE u.email_confirmed_at IS NOT NULL
    ORDER BY u.created_at DESC
    LIMIT 1;
    
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
    
    -- Only proceed if we have a sample user
    IF sample_user_id IS NOT NULL THEN
        
        -- Insert sample messages
        INSERT INTO public.inbox_messages (
            id, user_id, sender_id, subject, message_content, message_type,
            priority, status, payment_required, payment_amount, payment_due_date,
            reference_number, created_at, updated_at
        ) VALUES 
        
        -- Government Messages
        (
            gen_random_uuid(),
            sample_user_id,
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
            'KRA/TAX/2025/001234',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        ),
        
        (
            gen_random_uuid(),
            sample_user_id,
            ntsa_sender_id,
            'Vehicle License Renewal Notice - KCA 123A',
            'Dear Vehicle Owner,

Your vehicle license for KCA 123A is due for renewal on January 15, 2026.

Vehicle Details:
- Registration: KCA 123A
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
            'NTSA/VL/2025/567890',
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '5 days'
        ),
        
        (
            gen_random_uuid(),
            sample_user_id,
            county_sender_id,
            'Business Permit Renewal - Westlands Business District',
            'Dear Business Owner,

Your business permit for WESTLANDS ELECTRONICS SHOP is due for renewal.

Permit Details:
- Business Name: Westlands Electronics Shop
- Location: Westlands, Nairobi
- Permit Number: NBC/BP/2024/12345
- Expiry Date: December 31, 2025

Renewal Fee: KES 15,000

Please visit Nairobi City Hall or use our online portal to complete the renewal process.

Required Documents:
- Copy of National ID
- Business registration certificate
- Tax compliance certificate
- Fire safety certificate

Nairobi City County
Business Licensing Department',
            'government',
            'high',
            'read',
            true,
            15000.00,
            '2025-12-31',
            'NBC/BP/2025/12345',
            NOW() - INTERVAL '10 days',
            NOW() - INTERVAL '8 days'
        ),
        
        -- Business Messages
        (
            gen_random_uuid(),
            sample_user_id,
            safaricom_sender_id,
            'Your Safaricom Bill is Ready - KES 2,450',
            'Hello Valued Customer,

Your Safaricom bill for November 2025 is now ready.

Account Summary:
- Account Number: 0722123456
- Billing Period: November 1-30, 2025
- Amount Due: KES 2,450
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
            2450.00,
            '2025-12-15',
            'SAF/BILL/2025/789012',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '3 days'
        ),
        
        (
            gen_random_uuid(),
            sample_user_id,
            kplc_sender_id,
            'Electricity Bill - November 2025',
            'Dear Customer,

Your electricity bill for November 2025 is ready.

Account Details:
- Account Number: 12345678901
- Meter Number: 87654321
- Property: Westlands Apartment 4B

Consumption Summary:
- Previous Reading: 15,420 kWh
- Current Reading: 15,680 kWh
- Units Consumed: 260 kWh
- Amount Due: KES 3,250

Payment Due: December 20, 2025

Payment Methods:
- M-PESA: Pay Bill 888880
- Bank: Kenya Power Account
- KPLC Offices
- Authorized agents

Avoid disconnection by paying on time.

Kenya Power and Lighting Company
Customer Service',
            'business',
            'medium',
            'read',
            true,
            3250.00,
            '2025-12-20',
            'KPLC/BILL/2025/345678',
            NOW() - INTERVAL '7 days',
            NOW() - INTERVAL '6 days'
        ),
        
        (
            gen_random_uuid(),
            sample_user_id,
            equity_sender_id,
            'Loan Payment Reminder - Personal Loan Account',
            'Dear Valued Customer,

This is a friendly reminder that your loan installment is due soon.

Loan Details:
- Loan Account: 1234567890123
- Loan Type: Personal Loan
- Monthly Installment: KES 8,500
- Due Date: December 10, 2025
- Outstanding Balance: KES 125,000

Please ensure your account has sufficient funds for auto-debit, or visit any Equity Bank branch to make payment.

Late payment may attract penalties and affect your credit score.

For inquiries, call 0763 026 000 or visit www.equitybank.co.ke

Thank you for banking with us.

Equity Bank Kenya Limited
Loan Services Department',
            'business',
            'high',
            'unread',
            true,
            8500.00,
            '2025-12-10',
            'EQB/LOAN/2025/456789',
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '1 day'
        ),
        
        (
            gen_random_uuid(),
            sample_user_id,
            jumia_sender_id,
            'Your Order is Out for Delivery - Order #JM789012',
            'Hi there!

Great news! Your Jumia order is out for delivery and will arrive today.

Order Details:
- Order Number: JM789012
- Items: Samsung Galaxy Earbuds, Phone Case
- Total: KES 12,500
- Delivery Address: Westlands, Nairobi

Tracking Information:
- Status: Out for Delivery
- Expected Delivery: Today, 2:00 PM - 6:00 PM
- Delivery Partner: Jumia Express

Our delivery agent will call you 30 minutes before arrival. Please ensure someone is available to receive the package.

Payment: Cash on Delivery (KES 12,500)

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
            'JM789012',
            NOW() - INTERVAL '6 hours',
            NOW() - INTERVAL '4 hours'
        ),
        
        -- Legal/Professional Messages
        (
            gen_random_uuid(),
            sample_user_id,
            legal_sender_id,
            'Legal Notice - Property Boundary Dispute Resolution',
            'Dear Client,

RE: PROPERTY BOUNDARY DISPUTE - PLOT LR NO. 12345/67

We write to update you on the progress of your property boundary dispute case.

Case Summary:
- Case Number: HC/MISC/2025/123
- Court: Environment and Land Court, Nairobi
- Next Hearing: January 20, 2026

Recent Developments:
1. Survey report has been completed by licensed surveyor
2. Opposing party has filed their response
3. Mediation session scheduled for December 18, 2025

Required Actions:
- Attend mediation session on December 18, 2025 at 10:00 AM
- Bring original title deed and survey documents
- Legal fees balance: KES 45,000 (due before hearing)

We remain optimistic about a favorable outcome. Please contact our office for any clarifications.

Yours faithfully,

Kaplan & Stratton Advocates
Legal Department
Tel: 020-2221234',
            'legal',
            'high',
            'unread',
            true,
            45000.00,
            '2025-12-15',
            'KSA/LEGAL/2025/789',
            NOW() - INTERVAL '4 days',
            NOW() - INTERVAL '4 days'
        ),
        
        (
            gen_random_uuid(),
            sample_user_id,
            water_sender_id,
            'Water Service Interruption Notice - Westlands Area',
            'Dear Customer,

PLANNED WATER SERVICE INTERRUPTION

We wish to notify you of a planned water service interruption in your area.

Details:
- Area: Westlands, Parklands, and Highridge
- Date: December 16, 2025
- Time: 8:00 AM to 6:00 PM
- Duration: Approximately 10 hours

Reason: Maintenance and upgrade of main water supply lines

Affected Areas:
- Westlands Shopping Mall area
- ABC Place and surroundings  
- Parklands Estate
- Highridge area

We apologize for any inconvenience caused. Please store adequate water for use during this period.

Normal supply will resume by 6:00 PM on December 16, 2025.

For emergencies, call 020-557000.

Nairobi Water and Sewerage Company
Operations Department',
            'utility',
            'medium',
            'unread',
            false,
            null,
            null,
            'NWSC/MAINT/2025/456',
            NOW() - INTERVAL '12 hours',
            NOW() - INTERVAL '12 hours'
        );
        
        RAISE NOTICE 'Sample messages created successfully for user: %', sample_user_id;
        
    ELSE
        RAISE NOTICE 'No confirmed users found. Please create a user account first.';
    END IF;
END $$;
