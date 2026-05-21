-- ============================================================================
-- Insert Sample Messages for Testing
-- Migration: 20251017000001_insert_sample_messages.sql
-- ============================================================================
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with the actual user ID from 00_get_user_id.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Set your user ID here (get it from 00_get_user_id.sql)
-- ============================================================================
-- Example: DO $$
-- DECLARE
--     v_user_id UUID := 'bbb9088c-074d-41cc-acac-320e55a34c2c'; -- Replace with your actual user ID
-- ============================================================================

-- ============================================================================
-- STEP 2: Insert Message Templates (Optional but recommended)
-- ============================================================================

-- Template 1: Traffic Violation Fine
INSERT INTO public.message_templates (
    template_name,
    template_code,
    subject_template,
    body_template,
    category_id,
    message_type,
    priority,
    sender_type,
    government_sender_id,
    required_variables,
    default_metadata
)
VALUES (
    'Traffic Violation Fine',
    'TRAFFIC_FINE',
    'Traffic Violation Notice - {{violation_type}}',
    'Dear Citizen,

This is an official notice regarding a traffic violation detected on your vehicle.

Violation Details:
- Date: {{violation_date}}
- Time: {{violation_time}}
- Location: {{location}}
- Violation: {{violation_description}}
- Vehicle: Registered to your KIVRO address

Fine Amount: ${{fine_amount}} USD
Payment Due: {{due_date}}

You have the right to appeal this fine within 14 days. To pay or appeal, please use the action buttons below.

Somalia Police Force
Traffic Department',
    (SELECT id FROM public.message_categories WHERE name = 'Traffic Violations' LIMIT 1),
    'fine',
    'high',
    'government',
    (SELECT id FROM public.government_senders WHERE organization_code = 'POLICE' LIMIT 1),
    '["violation_type", "violation_date", "violation_time", "location", "violation_description", "fine_amount", "due_date"]'::JSONB,
    '{"currency": "USD", "can_appeal": true}'::JSONB
)
ON CONFLICT (template_code) DO NOTHING;

-- Template 2: Telecom Bill
INSERT INTO public.message_templates (
    template_name,
    template_code,
    subject_template,
    body_template,
    category_id,
    message_type,
    priority,
    sender_type,
    company_sender_id,
    required_variables,
    default_metadata
)
VALUES (
    'Monthly Telecom Bill',
    'TELECOM_BILL',
    'Your Monthly Bill is Ready - {{billing_month}}',
    'Dear Valued Customer,

Your {{company_name}} bill for {{billing_month}} is now available.

📱 Bill Summary:
- Account Number: {{account_number}}
- Billing Period: {{billing_period}}
- Total Amount Due: ${{bill_amount}} USD
- Due Date: {{due_date}}

📊 Services Breakdown:
{{services_breakdown}}

💳 Payment Methods:
You can pay your bill through:
✓ EVC Plus
✓ Mobile Money
✓ Bank Transfer
✓ Our Offices

Thank you for choosing {{company_name}}!

📞 Customer Service: {{customer_service}}
🌐 Website: {{website}}',
    (SELECT id FROM public.message_categories WHERE name = 'Telecommunications' LIMIT 1),
    'invoice',
    'normal',
    'company',
    (SELECT id FROM public.company_senders WHERE company_code = 'HORMUUD' LIMIT 1),
    '["company_name", "billing_month", "account_number", "billing_period", "bill_amount", "due_date", "services_breakdown", "customer_service", "website"]'::JSONB,
    '{"currency": "USD"}'::JSONB
)
ON CONFLICT (template_code) DO NOTHING;

-- Template 3: Package Delivery Notification
INSERT INTO public.message_templates (
    template_name,
    template_code,
    subject_template,
    body_template,
    category_id,
    message_type,
    priority,
    sender_type,
    company_sender_id,
    required_variables,
    default_metadata
)
VALUES (
    'Package Delivery Notification',
    'PACKAGE_DELIVERY',
    '📦 Your Package is {{delivery_status}}!',
    'Dear Customer,

{{status_message}}

📦 Delivery Details:
- Tracking Number: {{tracking_number}}
- Package: {{package_description}}
- Estimated Delivery: {{estimated_delivery}}
- Delivery Address: Your KIVRO Address

🚚 Current Status: {{delivery_status}}
{{driver_info}}

📍 Track Your Package:
You can track your package in real-time at:
{{tracking_url}}

💡 Delivery Instructions:
- Please ensure someone is available to receive the package
- ID verification may be required
- Signature required upon delivery

Thank you for choosing {{company_name}}!

📞 Customer Service: {{customer_service}}
🌐 {{website}}',
    (SELECT id FROM public.message_categories WHERE name = 'Delivery & Logistics' LIMIT 1),
    'alert',
    'urgent',
    'company',
    (SELECT id FROM public.company_senders WHERE company_code = 'AMAL_EXPRESS' LIMIT 1),
    '["delivery_status", "status_message", "tracking_number", "package_description", "estimated_delivery", "driver_info", "tracking_url", "company_name", "customer_service", "website"]'::JSONB,
    '{"requires_signature": true}'::JSONB
)
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- STEP 3: Function to insert sample messages for a specific user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.insert_sample_messages_for_user(p_user_id UUID, p_message_count INTEGER DEFAULT 10)
RETURNS TABLE(message_id UUID, subject TEXT, sender_name TEXT, success BOOLEAN) AS $$
DECLARE
    v_message_id UUID;
    v_subject TEXT;
    v_sender_name TEXT;
    v_counter INTEGER := 0;
    v_sender_type TEXT;
    v_gov_sender_id UUID;
    v_company_sender_id UUID;
    v_category_id UUID;
BEGIN
    WHILE v_counter < p_message_count LOOP
        v_counter := v_counter + 1;
        
        -- Randomly choose between government and company sender
        IF RANDOM() < 0.5 THEN
            v_sender_type := 'government';
            SELECT id, organization_name INTO v_gov_sender_id, v_sender_name
            FROM public.government_senders
            WHERE is_active = true AND is_verified = true
            ORDER BY RANDOM()
            LIMIT 1;
            v_company_sender_id := NULL;
        ELSE
            v_sender_type := 'company';
            SELECT id, company_name INTO v_company_sender_id, v_sender_name
            FROM public.company_senders
            WHERE is_active = true AND is_verified = true
            ORDER BY RANDOM()
            LIMIT 1;
            v_gov_sender_id := NULL;
        END IF;
        
        -- Get random category
        SELECT id INTO v_category_id
        FROM public.message_categories
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Generate subject
        v_subject := 'Sample Message #' || v_counter || ' from ' || v_sender_name;
        
        -- Insert message
        BEGIN
            INSERT INTO public.user_inbox (
                user_id,
                sender_id,
                company_sender_id,
                sender_type,
                category_id,
                subject,
                message_body,
                message_type,
                priority,
                reference_number,
                metadata,
                is_read
            )
            VALUES (
                p_user_id,
                v_gov_sender_id,
                v_company_sender_id,
                v_sender_type,
                v_category_id,
                v_subject,
                'This is a sample message body for testing purposes. Message number: ' || v_counter || E'\n\n' ||
                'Sender: ' || v_sender_name || E'\n' ||
                'Type: ' || v_sender_type || E'\n' ||
                'Generated at: ' || NOW()::TEXT || E'\n\n' ||
                'This message was automatically generated for testing the inbox system.',
                CASE 
                    WHEN RANDOM() < 0.3 THEN 'notification'
                    WHEN RANDOM() < 0.6 THEN 'invoice'
                    WHEN RANDOM() < 0.8 THEN 'alert'
                    ELSE 'fine'
                END,
                CASE 
                    WHEN RANDOM() < 0.2 THEN 'urgent'
                    WHEN RANDOM() < 0.4 THEN 'high'
                    WHEN RANDOM() < 0.7 THEN 'normal'
                    ELSE 'low'
                END,
                'SAMPLE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_counter::TEXT, 6, '0'),
                jsonb_build_object(
                    'sample', true,
                    'generated_at', NOW(),
                    'message_number', v_counter
                ),
                RANDOM() < 0.3 -- 30% chance of being read
            )
            RETURNING id INTO v_message_id;
            
            -- Return success
            message_id := v_message_id;
            subject := v_subject;
            sender_name := v_sender_name;
            success := true;
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return failure
            message_id := NULL;
            subject := v_subject;
            sender_name := v_sender_name;
            success := false;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Example Usage - Uncomment and replace USER_ID to use
-- ============================================================================

/*
-- Example 1: Insert 10 sample messages for a user
SELECT * FROM public.insert_sample_messages_for_user('YOUR_USER_ID_HERE', 10);

-- Example 2: Insert 50 sample messages for a user
SELECT * FROM public.insert_sample_messages_for_user('YOUR_USER_ID_HERE', 50);

-- Example 3: Send a message using a template
SELECT public.send_message_from_template(
    'YOUR_USER_ID_HERE',
    'TRAFFIC_FINE',
    jsonb_build_object(
        'violation_type', 'Speeding',
        'violation_date', 'January 15, 2025',
        'violation_time', '14:30',
        'location', 'Maka Al Mukarama Road, Mogadishu',
        'violation_description', 'Exceeding speed limit (90 km/h in 50 km/h zone)',
        'fine_amount', '75',
        'due_date', 'February 15, 2025'
    ),
    jsonb_build_object(
        'speed_recorded', 90,
        'speed_limit', 50,
        'can_appeal', true,
        'appeal_deadline', '2025-01-29'
    ),
    'SPF-2025-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
);

-- Example 4: Send bulk messages to multiple users
SELECT * FROM public.send_bulk_messages(
    ARRAY['USER_ID_1', 'USER_ID_2', 'USER_ID_3']::UUID[], -- Replace with actual user IDs
    (SELECT id FROM public.government_senders WHERE organization_code = 'HEALTH_MINISTRY' LIMIT 1),
    NULL,
    'government',
    (SELECT id FROM public.message_categories WHERE name = 'Health Services' LIMIT 1),
    'COVID-19 Vaccination Reminder',
    'Dear Citizen,

This is a reminder that COVID-19 vaccination is available at all health centers.

Please bring:
- National ID or Passport
- Previous vaccination card (if any)

Stay safe and healthy!

Ministry of Health',
    'notification',
    'normal',
    'HEALTH',
    jsonb_build_object('vaccination_type', 'COVID-19', 'free_of_charge', true)
);

-- Example 5: Get message statistics for a user
SELECT * FROM public.get_message_statistics('YOUR_USER_ID_HERE');

-- Example 6: View all messages for a user with sender details
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
    mc.name as category,
    ui.reference_number
FROM public.user_inbox ui
LEFT JOIN public.government_senders gs ON ui.sender_id = gs.id
LEFT JOIN public.company_senders cs ON ui.company_sender_id = cs.id
LEFT JOIN public.message_categories mc ON ui.category_id = mc.id
WHERE ui.user_id = 'YOUR_USER_ID_HERE'
ORDER BY ui.sent_at DESC
LIMIT 20;

-- Example 7: View message logs for a specific message
SELECT 
    ml.log_type,
    ml.log_message,
    ml.log_data,
    ml.created_at
FROM public.message_logs ml
WHERE ml.message_id = 'MESSAGE_ID_HERE'
ORDER BY ml.created_at DESC;
*/

-- ============================================================================
-- STEP 5: Quick Test - Insert 5 sample messages
-- ============================================================================
-- Uncomment the line below and replace YOUR_USER_ID_HERE with your actual user ID
-- SELECT * FROM public.insert_sample_messages_for_user('YOUR_USER_ID_HERE', 5);

-- ============================================================================
-- Migration Complete!
-- ============================================================================

COMMENT ON FUNCTION public.insert_sample_messages_for_user IS 'Generates random sample messages for testing the inbox system';
