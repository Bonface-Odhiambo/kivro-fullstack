-- Create sample inbox messages for Gracia Ariel (graciaariel777@gmail.com)
-- User ID: 950cc6b4-95f0-4aca-ba20-791123c07f60

-- First, ensure we have the message senders (run this part first)
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

-- Now create the messages for Gracia Ariel
DO $$
DECLARE
    gracia_user_id UUID := '950cc6b4-95f0-4aca-ba20-791123c07f60';
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
    
    -- Insert sample messages for Gracia Ariel
    INSERT INTO public.inbox_messages (
        id, user_id, sender_id, subject, message_content, message_type,
        priority, status, payment_required, payment_amount, payment_due_date,
        reference_number, created_at, updated_at
    ) VALUES 
    
    -- 1. Government Tax Notice (High Priority)
    (
        gen_random_uuid(),
        gracia_user_id,
        kra_sender_id,
        'URGENT: Tax Return Filing Reminder - Due December 31, 2025',
        'Dear Ms. Gracia Ariel,

This is an urgent reminder that your annual tax return for the year 2024 is due for filing by December 31, 2025.

Taxpayer Details:
- Name: Gracia Ariel
- PIN: A123456789X
- Email: graciaariel777@gmail.com

Outstanding Requirements:
- Individual Income Tax Return (Form IT1)
- Withholding Tax Certificates
- Investment Income Declarations

Please ensure you file your returns on time to avoid penalties:
- Late filing penalty: KES 2,000 per month
- Interest on unpaid tax: 1% per month

You can file online through the iTax portal at www.itax.kra.go.ke

For assistance, visit any KRA service center or call our helpline: 020-4999999

Thank you for your compliance.

Kenya Revenue Authority
Tax Compliance Department',
        'government',
        'high',
        'unread',
        false,
        null,
        null,
        'KRA/TAX/2025/GA001234',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    
    -- 2. Vehicle License Renewal (Medium Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        ntsa_sender_id,
        'Vehicle License Renewal Notice - KDA 567B',
        'Dear Vehicle Owner,

Your vehicle license for KDA 567B is due for renewal on January 15, 2026.

Vehicle Details:
- Registration: KDA 567B
- Owner: Gracia Ariel
- Make/Model: Honda Fit
- Year: 2019
- Engine: 1300cc

Renewal Fee: KES 4,500

Payment Options:
- eCitizen Portal: www.ecitizen.go.ke
- M-PESA: Pay Bill 222222, Account: KDA567B
- NTSA Offices Nationwide

Failure to renew on time will result in penalties and vehicle impoundment.

National Transport and Safety Authority
Vehicle Registration Department',
        'government',
        'medium',
        'unread',
        true,
        4500.00,
        '2026-01-15',
        'NTSA/VL/2025/GA567890',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    ),
    
    -- 3. Safaricom Bill (Medium Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        safaricom_sender_id,
        'Your Safaricom Bill is Ready - KES 2,850',
        'Hello Gracia,

Your Safaricom bill for November 2025 is now ready.

Account Summary:
- Account Number: 0722334455
- Account Name: Gracia Ariel
- Amount Due: KES 2,850
- Due Date: December 15, 2025

Service Breakdown:
- Postpaid Voice: KES 1,400
- Data Bundle (20GB): KES 999
- SMS Services: KES 200
- International Calls: KES 151
- Value Added Services: KES 100

Payment Options:
- M-PESA: Pay Bill 100100, Account 0722334455
- Safaricom Shops
- Online: www.safaricom.co.ke

Thank you for choosing Safaricom.

Safaricom Customer Care
Twaweza!',
        'business',
        'medium',
        'unread',
        true,
        2850.00,
        '2025-12-15',
        'SAF/BILL/2025/GA789012',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    
    -- 4. Kenya Power Bill (Medium Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        kplc_sender_id,
        'Electricity Bill - November 2025',
        'Dear Gracia,

Your electricity bill for November 2025 is ready.

Account Details:
- Account Number: 12345678901
- Account Name: Gracia Ariel
- Units Consumed: 300 kWh
- Amount Due: KES 3,567

Payment Due: December 20, 2025

Payment Methods:
- M-PESA: Pay Bill 888880, Account 12345678901
- KPLC Offices
- Authorized agents

Avoid disconnection by paying on time.

Kenya Power and Lighting Company',
        'business',
        'medium',
        'read',
        true,
        3567.00,
        '2025-12-20',
        'KPLC/BILL/2025/GA345678',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '4 days'
    ),
    
    -- 5. Equity Bank Loan Reminder (High Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        equity_sender_id,
        'Loan Payment Reminder - Personal Loan',
        'Dear Gracia Ariel,

Your loan installment is due soon.

Loan Details:
- Account: 1234567890123
- Monthly Installment: KES 8,500
- Due Date: December 10, 2025
- Outstanding Balance: KES 125,000

Please ensure your account has sufficient funds or visit any Equity Bank branch.

Late payment may attract penalties.

Equity Bank Kenya Limited
Loan Services Department',
        'business',
        'high',
        'unread',
        true,
        8500.00,
        '2025-12-10',
        'EQB/LOAN/2025/GA456789',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    
    -- 6. Jumia Order Delivery (Low Priority)
    (
        gen_random_uuid(),
        gracia_user_id,
        jumia_sender_id,
        'Your Order is Out for Delivery - Order #JM234567',
        'Hi Gracia!

Your Jumia order is out for delivery today.

Order Details:
- Order Number: JM234567
- Items: Samsung Galaxy Earbuds, Phone Case
- Total: KES 11,999
- Delivery: Today, 2:00 PM - 6:00 PM

Our delivery agent will call you 30 minutes before arrival.

Payment: Cash on Delivery

Track: www.jumia.co.ke/track

Thank you for shopping with Jumia!

Jumia Kenya',
        'business',
        'low',
        'read',
        false,
        null,
        null,
        'JM234567',
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '2 hours'
    ),
    
    -- 7. Legal Notice (High Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        legal_sender_id,
        'Legal Notice - Property Boundary Dispute',
        'Dear Ms. Gracia Ariel,

RE: PROPERTY BOUNDARY DISPUTE - PLOT LR NO. 12345/67

Case Update:
- Case Number: HC/MISC/2025/456
- Court: Environment and Land Court, Nairobi
- Mediation: December 18, 2025 at 10:00 AM

Outstanding Legal Fees:
- Professional fees: KES 45,000
- Court costs: KES 5,000
- Survey costs: KES 15,000
- Total Due: KES 65,000
- Payment Due: December 15, 2025

Please attend the mediation and settle outstanding fees.

Kaplan & Stratton Advocates
Tel: 020-2221234',
        'legal',
        'high',
        'unread',
        true,
        65000.00,
        '2025-12-15',
        'KSA/LEGAL/2025/GA789',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    
    -- 8. Water Service Notice (Medium Priority)
    (
        gen_random_uuid(),
        gracia_user_id,
        water_sender_id,
        'Water Service Interruption - Westlands Area',
        'Dear Customer,

PLANNED WATER SERVICE INTERRUPTION

Details:
- Area: Westlands, Parklands, Highridge
- Date: December 16, 2025
- Time: 8:00 AM to 6:00 PM
- Reason: Pipeline maintenance

Please store adequate water before the interruption.

Emergency water bowsers will be available at:
- Westlands Shopping Mall
- Sarit Centre

Normal supply resumes by 6:00 PM.

For emergencies: 020-557000

Nairobi Water and Sewerage Company',
        'utility',
        'medium',
        'unread',
        false,
        null,
        null,
        'NWSC/MAINT/2025/GA456',
        NOW() - INTERVAL '8 hours',
        NOW() - INTERVAL '8 hours'
    );
    
    RAISE NOTICE 'Successfully created 8 sample messages for Gracia Ariel (ID: %)', gracia_user_id;
    RAISE NOTICE 'Messages breakdown: Government (2), Business (4), Legal (1), Utility (1)';
    RAISE NOTICE 'Payment messages: 5 with total amount: KES 84,417';
    
END $$;
