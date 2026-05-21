-- ============================================================================
-- Insert 7 Government Messages for User Inbox
-- Migration: 20251017000002_insert_government_messages.sql
-- User ID: 28993cf8-6a90-4306-8a50-a776068b740d
-- ============================================================================
-- This migration inserts 7 different messages from various government agencies
-- ============================================================================

-- ============================================================================
-- MESSAGE 1: Traffic Violation - Somalia Police Force
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'POLICE' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Traffic Violations' LIMIT 1),
    'Traffic Violation Notice - Speeding',
    'Dear Citizen,

This is an official notice regarding a traffic violation detected on your vehicle.

🚗 Violation Details:
- Date: October 15, 2025
- Time: 14:35
- Location: Maka Al Mukarama Road, Mogadishu
- Violation: Exceeding speed limit (85 km/h in 50 km/h zone)
- Vehicle: Registered to your KIVRO address

💰 Fine Amount: $50 USD
📅 Payment Due: November 15, 2025

⚖️ Your Rights:
You have the right to appeal this fine within 14 days. To pay or appeal, please visit any police station or use our online portal.

Evidence:
- Speed camera photo available
- Video footage: 15 seconds
- Officer on duty: Sgt. Ahmed Hassan

Somalia Police Force
Traffic Department
📞 Contact: +252-1-234567
📧 Email: traffic@police.gov.so',
    'fine',
    'high',
    'SPF-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'fine_amount', 50,
        'currency', 'USD',
        'due_date', '2025-11-15',
        'violation_type', 'speeding',
        'speed_recorded', 85,
        'speed_limit', 50,
        'location', 'Maka Al Mukarama Road, Mogadishu',
        'can_appeal', true,
        'appeal_deadline', '2025-10-29',
        'evidence_available', true
    )
);

-- ============================================================================
-- MESSAGE 2: Tax Notice - Somalia Revenue Authority
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'TAX_AUTHORITY' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Tax & Revenue' LIMIT 1),
    'Annual Tax Return Reminder - 2025',
    'Dear Taxpayer,

This is a reminder that your annual tax return for the fiscal year 2024-2025 is due soon.

📋 Tax Return Information:
- Tax Year: 2024-2025
- Taxpayer ID: TIN-' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0') || '
- Filing Deadline: November 30, 2025
- Status: Pending Submission

📊 Estimated Tax Summary:
- Taxable Income: To be declared
- Tax Rate: 15% (Standard rate)
- Previous Year Tax Paid: $1,200 USD

📝 Required Documents:
✓ Income statements from all sources
✓ Business receipts (if self-employed)
✓ Bank statements
✓ Property ownership documents
✓ Investment income records

💻 How to File:
1. Visit our online portal: www.sra.gov.so
2. Login with your TIN
3. Complete the tax return form
4. Upload required documents
5. Submit and pay any outstanding tax

⚠️ Important Notes:
- Late filing penalty: $100 USD
- Interest on late payment: 2% per month
- File early to avoid penalties

Need help? Our tax advisors are available:
📞 Helpline: +252-1-234568
📧 Email: support@sra.gov.so
🏢 Office Hours: 8:00 AM - 4:00 PM (Sat-Thu)

Somalia Revenue Authority
Making Tax Simple',
    'notification',
    'high',
    'SRA-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'tax_year', '2024-2025',
        'filing_deadline', '2025-11-30',
        'late_penalty', 100,
        'interest_rate', 2.0,
        'previous_tax_paid', 1200,
        'currency', 'USD',
        'requires_action', true,
        'action_deadline', '2025-11-30'
    )
);

-- ============================================================================
-- MESSAGE 3: Vaccination Certificate - Ministry of Health
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'HEALTH_MINISTRY' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Health Services' LIMIT 1),
    '✅ Your COVID-19 Vaccination Certificate is Ready',
    'Dear Citizen,

Congratulations! Your COVID-19 vaccination certificate has been issued and is now available for download.

💉 Vaccination Details:
- Certificate ID: VAX-' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0') || '
- Vaccine Type: Pfizer-BioNTech
- Dose 1: September 10, 2025 - Banadir Hospital
- Dose 2: October 1, 2025 - Banadir Hospital
- Booster: October 15, 2025 - Banadir Hospital
- Status: Fully Vaccinated ✓

📄 Certificate Information:
This digital certificate is internationally recognized and can be used for:
✓ International travel
✓ Entry to public venues
✓ Employment verification
✓ Educational institutions
✓ Government services

🔐 Verification:
Your certificate includes a QR code that can be scanned to verify authenticity. The QR code contains encrypted information about your vaccination status.

📥 Download Options:
1. PDF Format (Printable)
2. Digital Wallet (Apple/Google)
3. Mobile App

🌍 International Recognition:
This certificate is compliant with WHO standards and is recognized by:
- African Union Member States
- European Union
- United States
- Middle Eastern Countries
- Asian Countries

⚕️ Health Recommendations:
- Keep your certificate accessible on your phone
- Consider getting a booster shot after 6 months
- Continue following health guidelines
- Report any adverse reactions

Need a replacement or have questions?
📞 Health Hotline: +252-1-234569
📧 Email: certificates@health.gov.so
🌐 Portal: www.health.gov.so

Ministry of Health
Republic of Somalia
Protecting Our Nation''s Health',
    'certificate',
    'normal',
    'MOH-VAX-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'certificate_type', 'covid_vaccination',
        'vaccine_type', 'Pfizer-BioNTech',
        'doses_received', 3,
        'vaccination_status', 'fully_vaccinated',
        'dose_1_date', '2025-09-10',
        'dose_2_date', '2025-10-01',
        'booster_date', '2025-10-15',
        'internationally_recognized', true,
        'qr_code_available', true,
        'download_available', true
    )
);

-- ============================================================================
-- MESSAGE 4: Property Tax Bill - Mogadishu Municipality
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'MOGADISHU_CITY' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Property & Land' LIMIT 1),
    'Annual Property Tax Bill - 2025',
    'Dear Property Owner,

Your annual property tax bill for 2025 is now available.

🏠 Property Information:
- Property ID: PROP-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '
- Address: Registered at your KIVRO address
- Property Type: Residential
- Size: 200 sq meters
- Zone: Hodan District, Mogadishu

💰 Tax Assessment:
- Property Value: $80,000 USD
- Tax Rate: 1.5% per annum
- Annual Tax: $1,200 USD
- Previous Balance: $0 USD
- Total Amount Due: $1,200 USD

📅 Payment Schedule:
- Due Date: December 31, 2025
- Early Payment Discount: 5% if paid before November 30, 2025
- Discounted Amount: $1,140 USD

💳 Payment Methods:
1. Online Payment: www.mogadishu.gov.so/payments
2. Bank Transfer:
   - Bank: Central Bank of Somalia
   - Account: 1234567890
   - Reference: Your Property ID
3. Municipal Office:
   - Location: Mogadishu City Hall, KM4
   - Hours: 8:00 AM - 4:00 PM (Sat-Thu)
4. Mobile Money:
   - EVC Plus: *712#
   - Zaad Service: *252#

📊 What Your Tax Pays For:
✓ Street lighting and maintenance
✓ Waste collection and management
✓ Public parks and recreation
✓ Emergency services
✓ Community development projects

⚠️ Important Information:
- Late payment penalty: 10% of outstanding amount
- Interest: 1% per month on overdue balance
- Property lien may be placed for non-payment
- Payment plans available for financial hardship

📞 Need Assistance?
- Customer Service: +252-1-234570
- Email: propertytax@mogadishu.gov.so
- Visit: Mogadishu City Hall, Revenue Department

Thank you for contributing to our city''s development!

Mogadishu Municipality
Building a Better Tomorrow',
    'invoice',
    'normal',
    'MMC-TAX-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'property_value', 80000,
        'tax_rate', 1.5,
        'tax_amount', 1200,
        'currency', 'USD',
        'due_date', '2025-12-31',
        'early_payment_deadline', '2025-11-30',
        'early_payment_discount', 5,
        'discounted_amount', 1140,
        'late_penalty_rate', 10,
        'interest_rate', 1,
        'payment_plan_available', true
    )
);

-- ============================================================================
-- MESSAGE 5: Passport Renewal Reminder - Immigration Department
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'IMMIGRATION' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Immigration' LIMIT 1),
    '⚠️ Passport Expiring Soon - Renew Now',
    'Dear Citizen,

This is an important reminder that your Somali passport will expire soon.

🛂 Passport Information:
- Passport Number: SO' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0') || '
- Issue Date: October 17, 2020
- Expiry Date: October 17, 2025
- Days Until Expiry: 0 days ⚠️
- Status: EXPIRED

⏰ Urgent Action Required:
Your passport has expired. You cannot travel internationally with an expired passport. Please renew immediately.

📋 Renewal Requirements:
✓ Current expired passport
✓ National ID card
✓ 2 recent passport photos (white background)
✓ Birth certificate or citizenship certificate
✓ Proof of address (KIVRO address accepted!)
✓ Renewal fee: $100 USD

📝 Renewal Process:
1. Book an appointment online: www.immigration.gov.so
2. Complete the renewal application form
3. Gather all required documents
4. Visit the immigration office on your appointment date
5. Biometric data collection (photo & fingerprints)
6. Pay the renewal fee
7. Collect your new passport (7-10 business days)

💳 Fees:
- Standard Renewal (10 years): $100 USD
- Express Service (3-5 days): $150 USD
- Emergency Service (24 hours): $200 USD

📍 Immigration Offices:
Main Office:
- Mogadishu Immigration Center
- Address: Aden Adde International Airport Road
- Hours: 8:00 AM - 4:00 PM (Sat-Thu)

Branch Offices:
- Hargeisa Immigration Office
- Kismayo Immigration Office
- Bosaso Immigration Office

⚠️ Important Notes:
- Many countries require 6 months validity on your passport
- Expired passports cannot be used for travel
- Processing time: 7-10 business days (standard)
- Keep your old passport after renewal (travel history)

🌍 New Passport Features:
- 10-year validity
- Biometric chip
- Enhanced security features
- 48 pages (more visa space)
- International standard compliant

📞 Contact Us:
- Hotline: +252-1-234571
- Email: passports@immigration.gov.so
- WhatsApp: +252-61-XXXXXXX
- Website: www.immigration.gov.so

Don''t let an expired passport disrupt your travel plans!

Somalia Immigration Department
Connecting Somalia to the World',
    'alert',
    'urgent',
    'IMM-PASS-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'passport_status', 'expired',
        'expiry_date', '2025-10-17',
        'days_until_expiry', 0,
        'renewal_fee_standard', 100,
        'renewal_fee_express', 150,
        'renewal_fee_emergency', 200,
        'currency', 'USD',
        'processing_time_days', 10,
        'requires_immediate_action', true,
        'appointment_required', true
    )
);

-- ============================================================================
-- MESSAGE 6: Education Certificate - Ministry of Education
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'EDUCATION_MINISTRY' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Education' LIMIT 1),
    '🎓 Your Academic Certificate is Ready for Collection',
    'Dear Graduate,

Congratulations! Your academic certificate has been processed and is ready for collection.

🎓 Certificate Details:
- Certificate Type: Bachelor''s Degree
- Field of Study: Computer Science
- Institution: Mogadishu University
- Graduation Year: 2024
- Certificate Number: EDU-' || LPAD(FLOOR(RANDOM() * 9999999)::TEXT, 7, '0') || '
- Grade: Second Class Upper Division

📜 Academic Record:
- Total Credits: 120
- GPA: 3.45/4.00
- Honors: Cum Laude
- Special Recognition: Dean''s List (2022, 2023)

📥 Collection Options:

Option 1: In-Person Collection
- Location: Ministry of Education, Certificate Department
- Address: KM4, Mogadishu
- Hours: 9:00 AM - 3:00 PM (Sat-Thu)
- Required: National ID + Collection Notice

Option 2: Authorized Representative
- Bring: Authorization letter + Your ID copy + Representative''s ID
- Same location and hours as above

Option 3: Courier Delivery (Available!)
- Fee: $10 USD
- Delivery Time: 3-5 business days
- Delivery Address: Your KIVRO address
- Order online: www.education.gov.so/delivery

📋 What to Bring:
✓ This notification message (printed or digital)
✓ National ID or Passport
✓ Student ID (if available)
✓ Graduation receipt

🔐 Certificate Features:
- Official government seal
- Holographic security features
- Unique verification QR code
- Embossed signature
- Watermarked paper
- Serial number

✅ Certificate Verification:
Employers and institutions can verify your certificate:
- Online: www.education.gov.so/verify
- Enter Certificate Number
- Instant verification result

📊 Additional Services Available:
- Certified True Copies: $5 USD each
- Transcript of Records: $10 USD
- Letter of Verification: $5 USD
- Apostille Service: $25 USD (for international use)

🌍 International Recognition:
Your certificate is recognized by:
✓ African Union Education Framework
✓ UNESCO
✓ International universities
✓ Professional bodies worldwide

⏰ Important:
- Certificates not collected within 6 months will be archived
- Archived certificates require additional processing fee
- Keep your certificate in a safe place
- Consider getting certified copies for job applications

📞 Need Help?
- Certificate Hotline: +252-1-234572
- Email: certificates@education.gov.so
- WhatsApp Support: +252-61-XXXXXXX

Congratulations on your achievement! We wish you success in your future endeavors.

Ministry of Education
Republic of Somalia
Empowering Through Education',
    'certificate',
    'normal',
    'MOE-CERT-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'certificate_type', 'bachelors_degree',
        'field_of_study', 'Computer Science',
        'institution', 'Mogadishu University',
        'graduation_year', 2024,
        'gpa', 3.45,
        'grade_classification', 'Second Class Upper',
        'honors', 'Cum Laude',
        'collection_available', true,
        'courier_delivery_available', true,
        'courier_fee', 10,
        'currency', 'USD',
        'verification_available', true
    )
);

-- ============================================================================
-- MESSAGE 7: Utility Bill - Water & Sewerage Authority
-- ============================================================================
INSERT INTO public.user_inbox (
    user_id, 
    sender_id,
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
    '28993cf8-6a90-4306-8a50-a776068b740d',
    (SELECT id FROM public.government_senders WHERE organization_code = 'WATER_AUTHORITY' LIMIT 1),
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Utilities' LIMIT 1),
    '💧 Water Bill - October 2025',
    'Dear Customer,

Your water and sewerage bill for October 2025 is now available.

💧 Account Information:
- Account Number: WSA-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '
- Service Address: Your KIVRO registered address
- Billing Period: October 1-31, 2025
- Meter Number: MTR-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0') || '

📊 Usage Summary:
- Previous Reading: 1,245 cubic meters
- Current Reading: 1,265 cubic meters
- Water Consumed: 20 cubic meters
- Daily Average: 0.65 cubic meters

💰 Charges Breakdown:
- Water Supply: $15.00 USD (20 m³ @ $0.75/m³)
- Sewerage Service: $8.00 USD (Fixed charge)
- Meter Maintenance: $2.00 USD
- Environmental Levy: $1.00 USD
- Previous Balance: $0.00 USD
- ─────────────────────
- Total Amount Due: $26.00 USD

📅 Payment Information:
- Bill Date: October 31, 2025
- Due Date: November 15, 2025
- Late Payment Fee: $5.00 USD (after due date)

💳 Payment Methods:

1. Mobile Money:
   - EVC Plus: *712# (Select Bills > Water)
   - Zaad: *252# (Select Utilities)
   - Account Number: WSA-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || '

2. Bank Transfer:
   - Bank: Salaam Bank
   - Account: 9876543210
   - Reference: Your Account Number

3. Online Payment:
   - Website: www.water.gov.so/pay
   - Mobile App: WSA Mobile (Download from App Store)

4. Walk-in Payment:
   - WSA Customer Service Centers
   - Authorized agents nationwide
   - Hours: 8:00 AM - 5:00 PM (Sat-Thu)

📈 Usage Comparison:
- This Month: 20 m³
- Last Month: 18 m³
- Average (Last 6 months): 19 m³
- Status: Normal usage ✓

💡 Water Conservation Tips:
✓ Fix leaky taps immediately (saves up to 20 liters/day)
✓ Take shorter showers (5 minutes max)
✓ Use a bucket instead of hose for car washing
✓ Install water-efficient fixtures
✓ Collect rainwater for garden use
✓ Run washing machine with full loads only

🚰 Service Quality:
- Water Quality: Excellent ✓
- Pressure: Normal ✓
- Supply Hours: 24/7 ✓
- Last Maintenance: October 10, 2025

⚠️ Important Notices:
- Scheduled maintenance: November 5, 2025 (6:00 AM - 10:00 AM)
- Water supply will be interrupted during maintenance
- Store water in advance
- Service will resume by 10:00 AM

🔧 Report Issues:
- Leaks or burst pipes: Emergency Hotline 911
- Billing inquiries: +252-1-234574
- Service complaints: complaints@water.gov.so
- Meter reading disputes: Within 7 days of bill date

📱 Download Our App:
Get instant access to:
- View and pay bills
- Track water usage
- Report issues
- Receive service alerts
- View payment history

🌍 Our Commitment:
We are committed to providing clean, safe, and reliable water to all residents of Mogadishu. Your payment helps us:
✓ Maintain water infrastructure
✓ Ensure 24/7 water supply
✓ Improve water quality
✓ Expand service coverage
✓ Protect the environment

Thank you for being a responsible water user!

Water & Sewerage Authority
Republic of Somalia
Clean Water for a Healthy Nation

📞 Customer Service: +252-1-234574
📧 Email: info@water.gov.so
🌐 Website: www.water.gov.so',
    'invoice',
    'normal',
    'WSA-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    jsonb_build_object(
        'billing_period', 'October 2025',
        'water_consumed_cubic_meters', 20,
        'water_charge', 15.00,
        'sewerage_charge', 8.00,
        'meter_maintenance', 2.00,
        'environmental_levy', 1.00,
        'total_amount', 26.00,
        'currency', 'USD',
        'due_date', '2025-11-15',
        'late_payment_fee', 5.00,
        'previous_balance', 0.00,
        'usage_status', 'normal',
        'scheduled_maintenance', '2025-11-05'
    )
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- View all inserted messages
SELECT 
    ui.id,
    gs.organization_name as sender,
    ui.subject,
    ui.message_type,
    ui.priority,
    ui.reference_number,
    ui.sent_at,
    mc.name as category
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.message_categories mc ON ui.category_id = mc.id
WHERE ui.user_id = '28993cf8-6a90-4306-8a50-a776068b740d'
ORDER BY ui.sent_at DESC
LIMIT 10;

-- ============================================================================
-- Get message count for user
-- ============================================================================
SELECT 
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE is_read = false) as unread_messages,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_messages,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_messages
FROM public.user_inbox
WHERE user_id = '28993cf8-6a90-4306-8a50-a776068b740d';

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Successfully inserted 7 government messages:
-- 1. Traffic Violation (Police) - Fine
-- 2. Tax Return Reminder (Revenue Authority) - Notification
-- 3. Vaccination Certificate (Health Ministry) - Certificate
-- 4. Property Tax Bill (Municipality) - Invoice
-- 5. Passport Renewal (Immigration) - Alert
-- 6. Education Certificate (Education Ministry) - Certificate
-- 7. Water Bill (Water Authority) - Invoice
-- ============================================================================
