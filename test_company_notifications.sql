-- Test Script: Send Sample Company Notifications to User Inbox
-- This script sends various types of company notifications to test the inbox system
-- Run this SQL in your Supabase SQL Editor AFTER running add_company_senders_to_inbox.sql

-- Step 1: Get your user ID (run this first to find your user)
SELECT 
    au.id as user_id,
    au.email,
    p.display_name,
    p.phone_number,
    p.user_type
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- Step 2: User ID has been set to: bbb9088c-074d-41cc-acac-320e55a34c2c
-- Uncomment the INSERT statements below to send test notifications

-- ============================================================================
-- TEST 1: Telecommunications Bill Notification (Hormuud)
-- ============================================================================

INSERT INTO public.user_inbox (
    user_id, 
    company_sender_id,
    sender_type,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'bbb9088c-074d-41cc-acac-320e55a34c2c', -- Your user ID
    (SELECT id FROM public.company_senders WHERE company_code = 'HORMUUD' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Telecommunications' LIMIT 1),
    'Your Monthly Bill is Ready - January 2025',
    'Dear Valued Customer,

Your Hormuud Telecom bill for January 2025 is now available.

📱 Bill Summary:
- Account Number: 252-61-XXXXXX
- Billing Period: January 1-31, 2025
- Total Amount Due: $25.00 USD
- Due Date: February 15, 2025

📊 Services Breakdown:
- Mobile Voice: $10.00
- Mobile Data (5GB): $12.00
- SMS Package: $3.00

💳 Payment Methods:
You can pay your bill through:
✓ EVC Plus
✓ Mobile Money
✓ Bank Transfer
✓ Hormuud Offices

Thank you for choosing Hormuud Telecom!

📞 Customer Service: +252-1-345678
🌐 Website: www.hormuud.com',
    'invoice',
    'normal',
    'HRM-2025-001234',
    jsonb_build_object(
        'bill_amount', 25.00,
        'currency', 'USD',
        'due_date', '2025-02-15',
        'account_number', '252-61-XXXXXX',
        'billing_period', 'January 2025',
        'services', jsonb_build_array(
            jsonb_build_object('name', 'Mobile Voice', 'amount', 10.00),
            jsonb_build_object('name', 'Mobile Data', 'amount', 12.00),
            jsonb_build_object('name', 'SMS Package', 'amount', 3.00)
        ),
        'payment_methods', jsonb_build_array('EVC Plus', 'Mobile Money', 'Bank Transfer')
    )
);


-- ============================================================================
-- TEST 2: Banking Transaction Alert (Dahabshiil)
-- ============================================================================

INSERT INTO public.user_inbox (
    user_id, 
    company_sender_id,
    sender_type,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'bbb9088c-074d-41cc-acac-320e55a34c2c', -- Your user ID
    (SELECT id FROM public.company_senders WHERE company_code = 'DAHABSHIIL' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Banking & Finance' LIMIT 1),
    '💰 Transaction Alert: Money Received',
    'Dear Customer,

You have received a money transfer!

💵 Transaction Details:
- Amount Received: $150.00 USD
- Transaction ID: DBS-2025-789456
- Date: January 13, 2025 at 12:21 PM
- From: Mohamed Ahmed
- Reference: Family Support

💳 Your New Balance: $1,250.00 USD

The funds are now available in your Dahabshiil account and can be withdrawn at any of our branches or agents.

🏦 Nearest Branch: Bakara Market, Mogadishu
📞 Customer Service: +252-1-345679
🌐 www.dahabshiil.com

Thank you for using Dahabshiil Bank!',
    'notification',
    'high',
    'DBS-2025-789456',
    jsonb_build_object(
        'transaction_type', 'money_received',
        'amount', 150.00,
        'currency', 'USD',
        'sender_name', 'Mohamed Ahmed',
        'new_balance', 1250.00,
        'transaction_date', '2025-01-13T12:21:00Z',
        'can_withdraw', true
    )
);


-- ============================================================================
-- TEST 3: Delivery Notification (Amal Express)
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    company_sender_id,
    sender_type,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'bbb9088c-074d-41cc-acac-320e55a34c2c', -- Your user ID
    (SELECT id FROM public.company_senders WHERE company_code = 'AMAL_EXPRESS' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Delivery & Logistics' LIMIT 1),
    '📦 Your Package is Out for Delivery!',
    'Dear Customer,

Great news! Your package is on its way to you.

📦 Delivery Details:
- Tracking Number: AMAL-2025-123456
- Package: Electronics - 1 item
- Estimated Delivery: Today, January 13, 2025 (2:00 PM - 5:00 PM)
- Delivery Address: Your KIVRO Address

🚚 Current Status: Out for Delivery
Driver: Hassan Ali
Contact: +252-61-XXXXXXX

📍 Track Your Package:
You can track your package in real-time at:
www.amalexpress.com/track/AMAL-2025-123456

💡 Delivery Instructions:
- Please ensure someone is available to receive the package
- ID verification may be required
- Signature required upon delivery

Thank you for choosing Amal Express!

📞 Customer Service: +252-1-345685
🌐 www.amalexpress.com',
    'alert',
    'urgent',
    'AMAL-2025-123456',
    jsonb_build_object(
        'tracking_number', 'AMAL-2025-123456',
        'package_type', 'Electronics',
        'delivery_status', 'out_for_delivery',
        'estimated_delivery', '2025-01-13T14:00:00Z',
        'driver_name', 'Hassan Ali',
        'driver_phone', '+252-61-XXXXXXX',
        'requires_signature', true,
        'tracking_url', 'www.amalexpress.com/track/AMAL-2025-123456'
    )
);


-- ============================================================================
-- TEST 4: Data Usage Alert (Somtel)
-- ============================================================================

INSERT INTO public.user_inbox (
    user_id, 
    company_sender_id,
    sender_type,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'bbb9088c-074d-41cc-acac-320e55a34c2c', -- Your user ID
    (SELECT id FROM public.company_senders WHERE company_code = 'SOMTEL' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Telecommunications' LIMIT 1),
    '⚠️ Data Usage Alert: 80% Used',
    'Dear Customer,

This is a friendly reminder about your data usage.

📊 Data Usage Summary:
- Plan: 5GB Monthly Data
- Used: 4.0 GB (80%)
- Remaining: 1.0 GB (20%)
- Renewal Date: January 20, 2025

⚡ Quick Actions:
1. Buy Additional Data: Dial *123# or visit our app
2. Upgrade Your Plan: Get 10GB for just $5 more
3. Enable Data Saver: Reduce data consumption

💡 Tips to Save Data:
- Connect to WiFi when available
- Disable auto-play videos
- Use data compression in your browser
- Monitor app background data usage

📱 Top Data Consumers:
1. YouTube: 1.5 GB
2. Facebook: 0.8 GB
3. WhatsApp: 0.7 GB

Need more data? Reply "DATA" to get special offers!

📞 Customer Service: +252-1-345680
🌐 www.somtel.com',
    'alert',
    'normal',
    'SOMTEL-2025-DATA-001',
    jsonb_build_object(
        'data_plan', '5GB',
        'data_used', 4.0,
        'data_remaining', 1.0,
        'usage_percentage', 80,
        'renewal_date', '2025-01-20',
        'top_apps', jsonb_build_array(
            jsonb_build_object('app', 'YouTube', 'usage', 1.5),
            jsonb_build_object('app', 'Facebook', 'usage', 0.8),
            jsonb_build_object('app', 'WhatsApp', 'usage', 0.7)
        ),
        'upgrade_available', true,
        'upgrade_price', 5.00
    )
);


-- ============================================================================
-- TEST 5: Loan Approval Notification (Salaam Bank)
-- ============================================================================

INSERT INTO public.user_inbox (
    user_id, 
    company_sender_id,
    sender_type,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'bbb9088c-074d-41cc-acac-320e55a34c2c', -- Your user ID
    (SELECT id FROM public.company_senders WHERE company_code = 'SALAAM_BANK' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Banking & Finance' LIMIT 1),
    '🎉 Congratulations! Your Loan is Approved',
    'Dear Valued Customer,

We are pleased to inform you that your loan application has been APPROVED!

✅ Loan Approval Details:
- Loan Amount: $5,000.00 USD
- Interest Rate: 12% per annum (Islamic compliant)
- Loan Term: 24 months
- Monthly Payment: $235.37 USD
- Application ID: SLB-2025-456789

📋 Next Steps:
1. Visit any Salaam Bank branch to sign the loan agreement
2. Bring your ID and proof of address (KIVRO address accepted!)
3. Funds will be disbursed within 24 hours after signing

📍 Required Documents:
✓ National ID or Passport
✓ Proof of Address (KIVRO address is valid)
✓ Proof of Income (last 3 months)

🏦 Nearest Branch:
Salaam Bank - Mogadishu Main Branch
Address: KM4, Mogadishu
Hours: 8:00 AM - 4:00 PM (Sat-Thu)

⏰ Important: This approval is valid for 30 days. Please complete the process before February 12, 2025.

Congratulations on your loan approval!

📞 Customer Service: +252-1-345681
🌐 www.salaambank.com',
    'certificate',
    'high',
    'SLB-2025-456789',
    jsonb_build_object(
        'loan_amount', 5000.00,
        'currency', 'USD',
        'interest_rate', 12.0,
        'loan_term_months', 24,
        'monthly_payment', 235.37,
        'approval_date', '2025-01-13',
        'expiry_date', '2025-02-12',
        'islamic_compliant', true,
        'requires_documents', true,
        'documents_needed', jsonb_build_array('National ID', 'Proof of Address', 'Proof of Income')
    )
);

-- ============================================================================
-- TEST 6: Promotional Offer (Golis Telecom)
-- ============================================================================

INSERT INTO public.user_inbox (
    user_id, 
    company_sender_id,
    sender_type,
    category_id,
    subject,
    message_body,
    message_type,
    priority,
    reference_number,
    metadata
)
VALUES (
    'bbb9088c-074d-41cc-acac-320e55a34c2c', -- Your user ID
    (SELECT id FROM public.company_senders WHERE company_code = 'GOLIS' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Telecommunications' LIMIT 1),
    '🎁 Special Offer: Double Your Data!',
    'Dear Valued Customer,

We have a special offer just for you!

🎉 DOUBLE DATA PROMOTION
Get 2X data on all data bundles for the next 7 days!

💎 Available Offers:
1. 2GB → 4GB for $5
2. 5GB → 10GB for $10
3. 10GB → 20GB for $15
4. 20GB → 40GB for $25

⏰ Offer Valid Until: January 20, 2025

📱 How to Activate:
- Dial *123# and select "Promotions"
- Visit our mobile app
- Send "DOUBLE" to 123

🌟 Why Choose Golis?
✓ Fastest 4G network in Somalia
✓ Nationwide coverage
✓ 24/7 customer support
✓ No hidden charges

This is a limited-time offer exclusively for our loyal customers!

Don''t miss out - activate now!

📞 Customer Service: +252-1-345682
🌐 www.golis.com

Reply STOP to unsubscribe from promotional messages.',
    'notification',
    'low',
    'GOLIS-PROMO-2025-001',
    jsonb_build_object(
        'promotion_type', 'double_data',
        'valid_until', '2025-01-20',
        'offers', jsonb_build_array(
            jsonb_build_object('data', '2GB', 'bonus', '4GB', 'price', 5.00),
            jsonb_build_object('data', '5GB', 'bonus', '10GB', 'price', 10.00),
            jsonb_build_object('data', '10GB', 'bonus', '20GB', 'price', 15.00),
            jsonb_build_object('data', '20GB', 'bonus', '40GB', 'price', 25.00)
        ),
        'activation_code', 'DOUBLE',
        'is_promotional', true
    )
);


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After inserting messages, verify they were created correctly:

-- View all messages for the user (both government and company)
SELECT 
    ui.id,
    ui.sender_type,
    CASE 
        WHEN ui.sender_type = 'government' THEN gs.organization_name
        WHEN ui.sender_type = 'company' THEN cs.company_name
    END as sender_name,
    ui.subject,
    ui.message_type,
    ui.priority,
    ui.is_read,
    ui.sent_at,
    mc.name as category
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
LEFT JOIN public.message_categories mc ON ui.category_id = mc.id
WHERE ui.user_id = 'bbb9088c-074d-41cc-acac-320e55a34c2c'
ORDER BY ui.sent_at DESC;
*/

-- Count messages by sender type:

SELECT 
    sender_type,
    COUNT(*) as message_count,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count
FROM public.user_inbox
WHERE user_id = 'bbb9088c-074d-41cc-acac-320e55a34c2c'
GROUP BY sender_type;
*/

-- View company senders and their API keys:

SELECT 
    company_name,
    company_code,
    industry,
    api_key,
    is_active,
    is_verified
FROM public.company_senders
ORDER BY company_name;

