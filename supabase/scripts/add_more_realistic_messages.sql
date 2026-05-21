-- Add more realistic African government and business messages
-- Court, Traffic Police, Bank, Vehicle Inspection, Insurance

-- First, add more senders to message_senders table
INSERT INTO public.message_senders (
    id, name, email, phone, sender_type, organization, 
    logo_url, is_verified, verification_level, created_at
) VALUES 
-- Government/Court Senders
(
    gen_random_uuid(),
    'Milimani Law Courts',
    'registry@judiciary.go.ke',
    '+254-20-2221221',
    'government',
    'Kenya Judiciary',
    'https://www.judiciary.go.ke/images/judiciary-logo.png',
    true,
    'official',
    NOW() - INTERVAL '40 days'
),
(
    gen_random_uuid(),
    'National Police Service - Traffic Department',
    'traffic@nationalpolice.go.ke',
    '+254-20-341411',
    'government',
    'National Police Service',
    'https://www.nationalpolice.go.ke/images/police-logo.png',
    true,
    'official',
    NOW() - INTERVAL '35 days'
),
(
    gen_random_uuid(),
    'Motor Vehicle Inspection Unit',
    'inspection@ntsa.go.ke',
    '+254-20-2717000',
    'government',
    'NTSA - Vehicle Inspection',
    'https://www.ntsa.go.ke/images/inspection-logo.png',
    true,
    'official',
    NOW() - INTERVAL '30 days'
),

-- Business/Financial Senders
(
    gen_random_uuid(),
    'KCB Bank Kenya',
    'customercare@kcbgroup.com',
    '+254-711-087000',
    'business',
    'KCB Bank Kenya Limited',
    'https://www.kcbgroup.com/images/kcb-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '25 days'
),
(
    gen_random_uuid(),
    'Cooperative Bank of Kenya',
    'customercare@co-opbank.co.ke',
    '+254-20-3276000',
    'business',
    'Cooperative Bank of Kenya',
    'https://www.co-opbank.co.ke/images/coop-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '20 days'
),
(
    gen_random_uuid(),
    'Jubilee Insurance',
    'customercare@jubileekenya.com',
    '+254-20-3293000',
    'business',
    'Jubilee Insurance Company',
    'https://www.jubileekenya.com/images/jubilee-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '15 days'
),
(
    gen_random_uuid(),
    'APA Insurance',
    'info@apainsurance.org',
    '+254-20-2862000',
    'business',
    'APA Insurance Kenya',
    'https://www.apainsurance.org/images/apa-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '10 days'
),
(
    gen_random_uuid(),
    'ICEA LION Insurance',
    'customerservice@icealion.com',
    '+254-20-2750000',
    'business',
    'ICEA LION General Insurance',
    'https://www.icealion.com/images/icea-logo.png',
    true,
    'verified',
    NOW() - INTERVAL '5 days'
)
ON CONFLICT (email) DO NOTHING;

-- Now create the corresponding government_senders and company_senders
INSERT INTO public.government_senders (
    id, organization_name, organization_code, contact_email, contact_phone, 
    logo_url, is_active, created_at, updated_at
)
SELECT 
    ms.id,
    ms.name as organization_name,
    CASE 
        WHEN ms.name ILIKE '%court%' THEN 'JUDICIARY'
        WHEN ms.name ILIKE '%police%' THEN 'NPS'
        WHEN ms.name ILIKE '%inspection%' THEN 'NTSA-VI'
        ELSE UPPER(LEFT(ms.name, 3))
    END as organization_code,
    ms.email as contact_email,
    ms.phone as contact_phone,
    ms.logo_url,
    true as is_active,
    ms.created_at,
    ms.created_at as updated_at
FROM public.message_senders ms 
WHERE ms.sender_type = 'government' 
AND ms.id NOT IN (SELECT id FROM public.government_senders)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.company_senders (
    id, company_name, company_code, contact_email, contact_phone, 
    logo_url, industry, is_active, created_at, updated_at
)
SELECT 
    ms.id,
    ms.name as company_name,
    CASE 
        WHEN ms.name ILIKE '%kcb%' THEN 'KCB'
        WHEN ms.name ILIKE '%cooperative%' THEN 'COOP'
        WHEN ms.name ILIKE '%jubilee%' THEN 'JUB'
        WHEN ms.name ILIKE '%apa%' THEN 'APA'
        WHEN ms.name ILIKE '%icea%' THEN 'ICEA'
        ELSE UPPER(LEFT(ms.name, 3))
    END as company_code,
    ms.email as contact_email,
    ms.phone as contact_phone,
    ms.logo_url,
    CASE 
        WHEN ms.name ILIKE '%bank%' THEN 'Banking & Finance'
        WHEN ms.name ILIKE '%insurance%' THEN 'Insurance'
        ELSE 'Financial Services'
    END as industry,
    true as is_active,
    ms.created_at,
    ms.created_at as updated_at
FROM public.message_senders ms 
WHERE ms.sender_type = 'business' 
AND ms.id NOT IN (SELECT id FROM public.company_senders)
ON CONFLICT (id) DO NOTHING;

-- Now add realistic messages for Gracia
DO $$
DECLARE
    gracia_user_id UUID := '950cc6b4-95f0-4aca-ba20-791123c07f60';
    court_sender_id UUID;
    traffic_sender_id UUID;
    inspection_sender_id UUID;
    kcb_sender_id UUID;
    coop_sender_id UUID;
    jubilee_sender_id UUID;
    apa_sender_id UUID;
    icea_sender_id UUID;
BEGIN
    -- Get sender IDs
    SELECT id INTO court_sender_id FROM public.message_senders WHERE email = 'registry@judiciary.go.ke';
    SELECT id INTO traffic_sender_id FROM public.message_senders WHERE email = 'traffic@nationalpolice.go.ke';
    SELECT id INTO inspection_sender_id FROM public.message_senders WHERE email = 'inspection@ntsa.go.ke';
    SELECT id INTO kcb_sender_id FROM public.message_senders WHERE email = 'customercare@kcbgroup.com';
    SELECT id INTO coop_sender_id FROM public.message_senders WHERE email = 'customercare@co-opbank.co.ke';
    SELECT id INTO jubilee_sender_id FROM public.message_senders WHERE email = 'customercare@jubileekenya.com';
    SELECT id INTO apa_sender_id FROM public.message_senders WHERE email = 'info@apainsurance.org';
    SELECT id INTO icea_sender_id FROM public.message_senders WHERE email = 'customerservice@icealion.com';
    
    -- Insert new messages
    INSERT INTO public.user_inbox (
        id, user_id, sender_id, company_sender_id, subject, message_body, message_type,
        priority, is_read, is_archived, is_starred, reference_number, metadata,
        sent_at, created_at, updated_at, sender_type
    ) VALUES 
    
    -- Court Summons (Government - High Priority)
    (
        gen_random_uuid(),
        gracia_user_id,
        court_sender_id,
        NULL,
        'COURT SUMMONS - Civil Case No. HC/CC/123/2025',
        'REPUBLIC OF KENYA
IN THE HIGH COURT OF KENYA AT NAIROBI
MILIMANI LAW COURTS

CIVIL CASE NO. HC/CC/123/2025

BETWEEN:

WESTLANDS PROPERTY MANAGEMENT LTD ........................ PLAINTIFF

AND

GRACIA ARIEL ......................................................... DEFENDANT

TO: GRACIA ARIEL

TAKE NOTICE that the Plaintiff has filed a suit against you claiming:

1. Recovery of rent arrears amounting to KES 45,000
2. Vacant possession of premises known as Apartment 4B, Westlands
3. Interest and costs of the suit

YOU ARE HEREBY SUMMONED to enter appearance to the said suit within FOURTEEN (14) days of service of this summons, failing which judgment may be entered against you.

DATED this 10th day of December, 2025

DEPUTY REGISTRAR
MILIMANI LAW COURTS
P.O. Box 30041-00100, Nairobi
Tel: 020-2221221

NOTE: You may seek legal representation. Contact the Law Society of Kenya for assistance in finding a lawyer.',
        'legal',
        'urgent',
        false,
        false,
        false,
        'HC/CC/123/2025',
        jsonb_build_object(
            'payment_required', false,
            'court_date', '2025-12-24',
            'case_type', 'Civil'
        ),
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '6 hours',
        'government'
    ),
    
    -- Traffic Fine (Government - High Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        traffic_sender_id,
        NULL,
        'TRAFFIC VIOLATION NOTICE - Speeding Offense',
        'NATIONAL POLICE SERVICE
TRAFFIC DEPARTMENT

TRAFFIC VIOLATION NOTICE

Offense Details:
- Date: December 8, 2025
- Time: 14:30 Hours
- Location: Waiyaki Way, near ABC Place
- Vehicle: KDA 567B (Honda Fit)
- Driver: Gracia Ariel

VIOLATION: Exceeding speed limit
- Speed Limit: 50 km/h
- Recorded Speed: 75 km/h
- Excess Speed: 25 km/h

PENALTY: KES 3,000

Payment Options:
1. Pay at any KCB Bank branch
2. M-PESA: Pay Bill 222222, Account: TF2025GA001
3. eCitizen Portal: www.ecitizen.go.ke

Payment Due: December 22, 2025

Failure to pay within 14 days will result in:
- Additional penalty charges
- Court summons
- Possible driving license suspension

For inquiries, visit Central Police Station Traffic Department or call 020-341411.

Officer: PC John Mwangi
Badge No: 12345
Station: Central Police Station',
        'fine',
        'high',
        false,
        false,
        false,
        'TF/2025/GA001',
        jsonb_build_object(
            'payment_required', true,
            'payment_amount', 3000.00,
            'payment_due_date', '2025-12-22'
        ),
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days',
        'government'
    ),
    
    -- Vehicle Inspection Notice (Government - Medium Priority)
    (
        gen_random_uuid(),
        gracia_user_id,
        inspection_sender_id,
        NULL,
        'Vehicle Inspection Due - KDA 567B',
        'NATIONAL TRANSPORT AND SAFETY AUTHORITY
MOTOR VEHICLE INSPECTION UNIT

VEHICLE INSPECTION NOTICE

Vehicle Details:
- Registration: KDA 567B
- Owner: Gracia Ariel
- Make/Model: Honda Fit 2019
- Engine: 1300cc
- Last Inspection: December 2024

Your vehicle is due for mandatory annual inspection.

Inspection Requirements:
- Valid insurance certificate
- Vehicle logbook (original)
- National ID (original)
- Previous inspection certificate

Inspection Fee: KES 2,500

Inspection Centers:
1. NTSA Inspection Center - Industrial Area
2. NTSA Inspection Center - Embakasi
3. Authorized Private Centers

Book Online: www.ntsa.go.ke/inspection
Call: 020-2717000

Inspection must be completed by: January 15, 2026

Failure to inspect will result in:
- Traffic fines if caught on road
- Vehicle impoundment
- License suspension

NTSA - Making Roads Safer',
        'certificate',
        'medium',
        false,
        false,
        false,
        'VI/2025/KDA567B',
        jsonb_build_object(
            'payment_required', true,
            'payment_amount', 2500.00,
            'payment_due_date', '2026-01-15'
        ),
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days',
        'government'
    ),
    
    -- KCB Bank Statement (Business - Low Priority)
    (
        gen_random_uuid(),
        gracia_user_id,
        NULL,
        kcb_sender_id,
        'Monthly Account Statement - November 2025',
        'KCB BANK KENYA LIMITED
Customer Statement

Account Holder: Gracia Ariel
Account Number: 1234567890
Account Type: KCB Current Account
Statement Period: November 1-30, 2025

Opening Balance: KES 25,450.00

TRANSACTIONS:
Nov 5  Salary Deposit          +45,000.00    70,450.00
Nov 6  Rent Payment            -15,000.00    55,450.00
Nov 8  Safaricom Bill          -2,850.00     52,600.00
Nov 10 Grocery Shopping        -3,200.00     49,400.00
Nov 12 Fuel Purchase           -2,500.00     46,900.00
Nov 15 M-PESA Withdrawal       -5,000.00     41,900.00
Nov 18 Online Shopping         -1,800.00     40,100.00
Nov 20 Restaurant              -1,200.00     38,900.00
Nov 25 Utility Bills           -3,567.00     35,333.00
Nov 28 ATM Withdrawal          -3,000.00     32,333.00

Closing Balance: KES 32,333.00

Charges This Month:
- Monthly Maintenance: KES 200
- SMS Alerts: KES 30
- ATM Withdrawals: KES 50

Next Statement Date: December 30, 2025

For inquiries: Call 0711-087000 or visit any KCB branch.

Thank you for banking with KCB.
Maisha ni KCB!',
        'notification',
        'low',
        true,
        false,
        false,
        'KCB/STMT/2025/1234567890',
        jsonb_build_object(
            'payment_required', false,
            'account_balance', 32333.00
        ),
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day',
        'company'
    ),
    
    -- Insurance Premium Due (Business - High Priority with Payment)
    (
        gen_random_uuid(),
        gracia_user_id,
        NULL,
        jubilee_sender_id,
        'Motor Insurance Premium Due - Policy JUB/MT/2025/GA789',
        'JUBILEE INSURANCE COMPANY OF KENYA LIMITED

MOTOR INSURANCE PREMIUM NOTICE

Policy Holder: Gracia Ariel
Policy Number: JUB/MT/2025/GA789
Vehicle: KDA 567B - Honda Fit 2019
Coverage: Comprehensive Motor Insurance

Current Policy Period: January 1 - December 31, 2025
Renewal Due: December 31, 2025

Premium Breakdown:
- Basic Premium: KES 18,000
- Training Levy (0.2%): KES 36
- Stamp Duty: KES 40
- Total Premium: KES 18,076

Benefits Covered:
✓ Third Party Liability (Unlimited)
✓ Own Damage Cover
✓ Theft and Fire
✓ Personal Accident Cover (KES 500,000)
✓ Medical Expenses (KES 100,000)
✓ Windscreen Cover
✓ Radio/Accessories Cover

Payment Options:
1. M-PESA: Pay Bill 444555, Account JUB/MT/2025/GA789
2. Bank Transfer: Jubilee Insurance Account
3. Visit any Jubilee branch
4. Online: www.jubileekenya.com

Payment Due: December 25, 2025

IMPORTANT: Failure to renew will result in:
- No insurance coverage
- Traffic violations if caught
- No compensation for accidents

For assistance: Call 020-3293000
Agent: Sarah Wanjiku - 0722-123456

Jubilee Insurance - Protecting What Matters Most',
        'invoice',
        'high',
        false,
        false,
        false,
        'JUB/MT/2025/GA789',
        jsonb_build_object(
            'payment_required', true,
            'payment_amount', 18076.00,
            'payment_due_date', '2025-12-25'
        ),
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours',
        'company'
    );
    
    RAISE NOTICE 'Successfully added 5 new realistic messages for Gracia';
    
END $$;

-- Verify all messages
SELECT 
    'Total Messages for Gracia' as status,
    COUNT(*) as count,
    COUNT(CASE WHEN sender_type = 'government' THEN 1 END) as government_msgs,
    COUNT(CASE WHEN sender_type = 'company' THEN 1 END) as company_msgs
FROM public.user_inbox 
WHERE user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60';

-- Show all messages with sender info
SELECT 
    ui.subject,
    COALESCE(gs.organization_name, cs.company_name) as sender_name,
    ui.sender_type,
    ui.priority,
    CASE WHEN ui.metadata->>'payment_required' = 'true' THEN 
        'KES ' || (ui.metadata->>'payment_amount')::text 
    ELSE 'No Payment' END as payment_info,
    ui.sent_at
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
WHERE ui.user_id = '950cc6b4-95f0-4aca-ba20-791123c07f60'
ORDER BY ui.sent_at DESC;
