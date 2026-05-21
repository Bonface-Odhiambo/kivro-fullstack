-- Create sample inbox messages specifically for graciaariel777@gmail.com
-- Replace 'USER_ID_HERE' with the actual UUID from get_specific_user.sql

DO $$
DECLARE
    target_user_id UUID;
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
    -- Get the target user ID
    SELECT u.id INTO target_user_id
    FROM auth.users u
    WHERE u.email = 'graciaariel777@gmail.com';
    
    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email graciaariel777@gmail.com not found!';
    END IF;
    
    -- Get sender IDs (create senders first if they don't exist)
    SELECT id INTO kra_sender_id FROM public.message_senders WHERE email = 'notices@kra.go.ke';
    SELECT id INTO ntsa_sender_id FROM public.message_senders WHERE email = 'info@ntsa.go.ke';
    SELECT id INTO county_sender_id FROM public.message_senders WHERE email = 'info@nairobi.go.ke';
    SELECT id INTO safaricom_sender_id FROM public.message_senders WHERE email = 'customer.care@safaricom.co.ke';
    SELECT id INTO kplc_sender_id FROM public.message_senders WHERE email = 'customercare@kplc.co.ke';
    SELECT id INTO equity_sender_id FROM public.message_senders WHERE email = 'info@equitybank.co.ke';
    SELECT id INTO jumia_sender_id FROM public.message_senders WHERE email = 'care@jumia.co.ke';
    SELECT id INTO legal_sender_id FROM public.message_senders WHERE email = 'info@kaplanlegal.co.ke';
    SELECT id INTO water_sender_id FROM public.message_senders WHERE email = 'customercare@nairobiwater.co.ke';
    
    -- Delete any existing messages for this user (optional - remove if you want to keep existing)
    -- DELETE FROM public.inbox_messages WHERE user_id = target_user_id;
    
    -- Insert sample messages for graciaariel777@gmail.com
    INSERT INTO public.inbox_messages (
        id, user_id, sender_id, subject, message_content, message_type,
        priority, status, payment_required, payment_amount, payment_due_date,
        reference_number, created_at, updated_at
    ) VALUES 
    
    -- Government Tax Notice (High Priority)
    (
        gen_random_uuid(),
        target_user_id,
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
Tax Compliance Department
Nairobi, Kenya',
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
    
    -- Vehicle License Renewal (Medium Priority with Payment)
    (
        gen_random_uuid(),
        target_user_id,
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
- Category: Private Vehicle

Renewal Fee: KES 4,500

Renewal Requirements:
- Valid comprehensive insurance certificate
- Motor vehicle inspection certificate (if required)
- Payment of renewal fees
- Copy of logbook

Payment Options:
- eCitizen Portal: www.ecitizen.go.ke
- M-PESA: Pay Bill 222222, Account: KDA567B
- Bank Transfer: NTSA Account 1234567890
- NTSA Offices Nationwide

Important: Failure to renew on time will result in:
- Daily penalties of KES 50
- Vehicle impoundment
- Court prosecution

For inquiries, call 020-2717000 or visit www.ntsa.go.ke

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
    
    -- Safaricom Bill (Medium Priority with Payment)
    (
        gen_random_uuid(),
        target_user_id,
        safaricom_sender_id,
        'Your Safaricom Bill is Ready - KES 2,850 - Account 0722334455',
        'Hello Gracia,

Your Safaricom bill for November 2025 is now ready.

Account Summary:
- Account Number: 0722334455
- Account Name: Gracia Ariel
- Billing Period: November 1-30, 2025
- Amount Due: KES 2,850
- Due Date: December 15, 2025

Service Breakdown:
- Postpaid Voice Calls: KES 1,400
- Data Bundle (20GB): KES 999
- SMS Services: KES 200
- International Calls: KES 151
- Value Added Services: KES 100

Previous Balance: KES 0
Payments Received: KES 0
Current Charges: KES 2,850
Total Amount Due: KES 2,850

Payment Options:
- M-PESA: Pay Bill 100100, Account 0722334455
- Bank Transfer: Safaricom Account 1234567890
- Safaricom Shops Nationwide
- Online: www.safaricom.co.ke/pay-bill

Late payment charges apply after due date.

Thank you for choosing Safaricom.

Safaricom Customer Care
Twaweza!

For support: Call 100 (Free from Safaricom) or 0722000100',
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
    
    -- Kenya Power Bill (Medium Priority with Payment)
    (
        gen_random_uuid(),
        target_user_id,
        kplc_sender_id,
        'Electricity Bill - November 2025 - Account 12345678901',
        'Dear Customer,

Your electricity bill for November 2025 is ready.

Customer Details:
- Account Number: 12345678901
- Account Name: Gracia Ariel
- Meter Number: 87654321098
- Property: Westlands Apartment 4B, Nairobi
- Tariff: Domestic Low Voltage

Consumption Summary:
- Previous Reading (Oct 31): 15,420 kWh
- Current Reading (Nov 30): 15,720 kWh
- Units Consumed: 300 kWh
- Billing Days: 30

Charges Breakdown:
- Energy Charges (300 kWh): KES 2,400
- Fixed Monthly Charge: KES 150
- Fuel Cost Charge: KES 450
- Forex Adjustment: KES 75
- VAT (16%): KES 492
- Total Amount Due: KES 3,567

Payment Due: December 20, 2025

Payment Methods:
- M-PESA: Pay Bill 888880, Account 12345678901
- Bank Transfer: Kenya Power Account
- KPLC Customer Service Centers
- Authorized Payment Agents

Avoid disconnection by paying on time. Reconnection fee applies.

For inquiries: Call 95551 or visit www.kplc.co.ke

Kenya Power and Lighting Company
Customer Service Department',
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
    
    -- Jumia Order Delivery (Low Priority - Informational)
    (
        gen_random_uuid(),
        target_user_id,
        jumia_sender_id,
        'Your Order is Out for Delivery - Order #JM234567 - Samsung Galaxy Earbuds',
        'Hi Gracia!

Exciting news! Your Jumia order is out for delivery and will arrive today.

Order Details:
- Order Number: JM234567
- Customer: Gracia Ariel
- Items: 
  * Samsung Galaxy Buds Pro (Black) - KES 8,999
  * Phone Case (Clear) - KES 1,200
  * Screen Protector - KES 800
- Order Total: KES 11,999
- Delivery Address: Westlands, Nairobi

Tracking Information:
- Status: Out for Delivery
- Expected Delivery: Today, December 14, 2025
- Time Window: 2:00 PM - 6:00 PM
- Delivery Partner: Jumia Express
- Tracking Code: JX789012345

Important Notes:
- Our delivery agent will call you 30 minutes before arrival
- Please ensure someone is available to receive the package
- Payment Method: Cash on Delivery (KES 11,999)
- Have exact change ready if possible

Track your order in real-time: www.jumia.co.ke/track/JM234567

Need to reschedule? Call our delivery team: 0709-299000

Thank you for shopping with Jumia!

Jumia Kenya
Customer Experience Team

Download the Jumia app for faster shopping and exclusive deals!',
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
    
    -- Legal Notice (High Priority with Payment)
    (
        gen_random_uuid(),
        target_user_id,
        legal_sender_id,
        'Legal Notice - Property Boundary Dispute Resolution - LR No. 12345/67',
        'Dear Ms. Gracia Ariel,

RE: PROPERTY BOUNDARY DISPUTE - PLOT LR NO. 12345/67, WESTLANDS

We write to update you on the progress of your property boundary dispute case.

Case Details:
- Case Number: HC/MISC/2025/456
- Court: Environment and Land Court, Nairobi
- Opposing Party: John Doe & Associates
- Property: Plot LR No. 12345/67, Westlands, Nairobi

Recent Developments:
1. Licensed surveyor has completed boundary survey
2. Survey report confirms your property boundaries
3. Opposing party has filed their response to our submissions
4. Court has scheduled mediation session

Next Steps:
- Mediation Session: December 18, 2025 at 10:00 AM
- Venue: Environment and Land Court, Nairobi
- Duration: Expected 2-3 hours

Required Actions from You:
1. Attend mediation session (mandatory)
2. Bring original title deed and survey documents
3. Settle outstanding legal fees balance

Outstanding Legal Fees:
- Professional fees balance: KES 45,000
- Court filing fees: KES 5,000
- Survey costs: KES 15,000
- Total Due: KES 65,000
- Payment Due: December 15, 2025

We remain optimistic about achieving a favorable outcome through mediation. The survey report strongly supports your position.

Please contact our office immediately to confirm your attendance and settle the outstanding fees.

Yours faithfully,

Kaplan & Stratton Advocates
Senior Partner: James Kaplan, LLB, LLM
Address: Westlands Office Park, Nairobi
Tel: 020-2221234
Email: info@kaplanlegal.co.ke',
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
    
    -- Water Service Notice (Medium Priority - Informational)
    (
        gen_random_uuid(),
        target_user_id,
        water_sender_id,
        'Planned Water Service Interruption - Westlands Area - December 16, 2025',
        'Dear Valued Customer,

PLANNED WATER SERVICE INTERRUPTION NOTICE

We wish to notify you of a planned water service interruption in your area.

Interruption Details:
- Area: Westlands, Parklands, and Highridge
- Date: Monday, December 16, 2025
- Time: 8:00 AM to 6:00 PM
- Duration: Approximately 10 hours
- Affected Customers: ~15,000 households

Reason for Interruption:
Major maintenance and upgrade of the main water supply pipeline serving the Westlands area. This is part of our ongoing infrastructure improvement program.

Specifically Affected Areas:
- Westlands Shopping Mall and surroundings
- ABC Place and Sarit Centre area
- Parklands Estate (all phases)
- Highridge area and Spring Valley
- Parts of Lavington

Preparation Guidelines:
- Store adequate water for drinking, cooking, and sanitation
- Fill bathtubs, buckets, and containers before 8:00 AM
- Postpone laundry and other water-intensive activities
- Inform household members and staff

Water Bowsers:
Emergency water bowsers will be stationed at:
- Westlands Shopping Mall parking
- Sarit Centre main entrance
- Parklands Primary School

Normal water supply will resume by 6:00 PM on December 16, 2025. Some areas may experience low pressure initially as the system stabilizes.

We sincerely apologize for any inconvenience caused. This maintenance is essential for improving water supply reliability in your area.

For emergencies during the interruption, call our 24-hour hotline: 020-557000

Thank you for your patience and understanding.

Nairobi Water and Sewerage Company
Operations Department
Customer Service: customercare@nairobiwater.co.ke',
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
    
    RAISE NOTICE 'Successfully created 7 sample messages for user: graciaariel777@gmail.com (ID: %)', target_user_id;
    RAISE NOTICE 'Messages include: Government (2), Business (3), Legal (1), Utility (1)';
    RAISE NOTICE 'Payment messages: 5 with amounts ranging from KES 2,850 to KES 65,000';
    
END $$;
