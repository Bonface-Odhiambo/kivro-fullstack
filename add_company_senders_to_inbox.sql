-- Add Company Senders Support to KIVRO Inbox System
-- This allows companies to send notifications to users, not just government agencies
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create company_senders table (similar to government_senders)
CREATE TABLE IF NOT EXISTS public.company_senders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    company_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'HORMUUD', 'DAHABSHIIL', 'SOMTEL'
    company_registration_number VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    api_key VARCHAR(100) UNIQUE, -- For API authentication
    industry VARCHAR(100), -- e.g., 'Telecommunications', 'Banking', 'Retail', 'Logistics'
    website_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add sender_type column to user_inbox to distinguish between government and company senders
ALTER TABLE public.user_inbox 
ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) DEFAULT 'government' CHECK (sender_type IN ('government', 'company'));

-- Step 3: Add company_sender_id column to user_inbox
ALTER TABLE public.user_inbox 
ADD COLUMN IF NOT EXISTS company_sender_id UUID REFERENCES public.company_senders(id) ON DELETE SET NULL;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_inbox_company_sender_id ON public.user_inbox(company_sender_id);
CREATE INDEX IF NOT EXISTS idx_user_inbox_sender_type ON public.user_inbox(sender_type);
CREATE INDEX IF NOT EXISTS idx_company_senders_code ON public.company_senders(company_code);
CREATE INDEX IF NOT EXISTS idx_company_senders_api_key ON public.company_senders(api_key);

-- Step 5: Enable Row Level Security (RLS) for company_senders
ALTER TABLE public.company_senders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_senders (everyone can read active verified companies)
CREATE POLICY "Anyone can read verified company senders" ON public.company_senders
    FOR SELECT USING (is_active = true AND is_verified = true);

CREATE POLICY "Service role can manage company senders" ON public.company_senders
    FOR ALL USING (auth.role() = 'service_role');

-- Step 6: Create trigger for updated_at timestamp
DROP TRIGGER IF EXISTS handle_company_senders_updated_at ON public.company_senders;
CREATE TRIGGER handle_company_senders_updated_at
    BEFORE UPDATE ON public.company_senders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 7: Add constraint to ensure either government_sender_id or company_sender_id is set, but not both
ALTER TABLE public.user_inbox 
ADD CONSTRAINT check_single_sender 
CHECK (
    (sender_id IS NOT NULL AND company_sender_id IS NULL AND sender_type = 'government') OR
    (sender_id IS NULL AND company_sender_id IS NOT NULL AND sender_type = 'company')
);

-- Step 8: Insert sample company senders
INSERT INTO public.company_senders (company_name, company_code, contact_email, contact_phone, is_verified, is_active, industry, description, api_key) VALUES
('Hormuud Telecom', 'HORMUUD', 'notifications@hormuud.com', '+252-1-345678', true, true, 'Telecommunications', 'Leading telecommunications provider in Somalia', 'hormuud_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Dahabshiil Bank', 'DAHABSHIIL', 'notifications@dahabshiil.com', '+252-1-345679', true, true, 'Banking & Finance', 'International money transfer and banking services', 'dahabshiil_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Somtel', 'SOMTEL', 'notifications@somtel.com', '+252-1-345680', true, true, 'Telecommunications', 'Telecommunications and internet services', 'somtel_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Salaam Bank', 'SALAAM_BANK', 'notifications@salaambank.com', '+252-1-345681', true, true, 'Banking & Finance', 'Islamic banking and financial services', 'salaam_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Golis Telecom', 'GOLIS', 'notifications@golis.com', '+252-1-345682', true, true, 'Telecommunications', 'Telecommunications services provider', 'golis_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Premier Bank', 'PREMIER_BANK', 'notifications@premierbank.so', '+252-1-345683', true, true, 'Banking & Finance', 'Commercial banking services', 'premier_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Taaj Telecom', 'TAAJ', 'notifications@taaj.com', '+252-1-345684', true, true, 'Telecommunications', 'Mobile and internet services', 'taaj_api_key_' || md5(random()::text || clock_timestamp()::text)),
('Amal Express', 'AMAL_EXPRESS', 'notifications@amalexpress.com', '+252-1-345685', true, true, 'Logistics & Delivery', 'Courier and delivery services', 'amal_api_key_' || md5(random()::text || clock_timestamp()::text))
ON CONFLICT (company_code) DO NOTHING;

-- Step 9: Add new message categories for company notifications
INSERT INTO public.message_categories (name, description, icon, color) VALUES
('Banking & Finance', 'Bank statements, transaction alerts, loan notifications', 'CreditCard', 'blue'),
('Telecommunications', 'Bill notifications, service updates, data usage alerts', 'Phone', 'purple'),
('Delivery & Logistics', 'Package tracking, delivery notifications, shipping updates', 'Package', 'orange'),
('Retail & Shopping', 'Order confirmations, promotions, loyalty rewards', 'ShoppingCart', 'green'),
('Insurance', 'Policy updates, claim notifications, premium reminders', 'Shield', 'indigo')
ON CONFLICT (name) DO NOTHING;

-- Step 10: View all API keys (save these securely!)
SELECT 
    'Company' as sender_type,
    company_name as organization_name,
    company_code as organization_code,
    api_key,
    contact_email,
    industry
FROM public.company_senders
WHERE is_active = true
ORDER BY company_name;

-- Step 11: Create a view for unified sender information
CREATE OR REPLACE VIEW public.unified_senders AS
SELECT 
    'government' as sender_type,
    id,
    organization_name as name,
    organization_code as code,
    contact_email,
    contact_phone,
    is_verified,
    is_active,
    logo_url,
    NULL as industry,
    created_at
FROM public.government_senders
UNION ALL
SELECT 
    'company' as sender_type,
    id,
    company_name as name,
    company_code as code,
    contact_email,
    contact_phone,
    is_verified,
    is_active,
    logo_url,
    industry,
    created_at
FROM public.company_senders;

-- Step 12: Update existing messages to have sender_type = 'government'
UPDATE public.user_inbox 
SET sender_type = 'government' 
WHERE sender_type IS NULL AND sender_id IS NOT NULL;

-- Example: Insert a sample company notification
/*
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
    'YOUR_USER_ID_HERE', -- Replace with actual user UUID
    (SELECT id FROM public.company_senders WHERE company_code = 'HORMUUD' LIMIT 1),
    'company',
    (SELECT id FROM public.message_categories WHERE name = 'Telecommunications' LIMIT 1),
    'Your Monthly Bill is Ready',
    'Dear Valued Customer,

Your Hormuud Telecom bill for January 2025 is now available.

Bill Summary:
- Account Number: 252-61-XXXXXX
- Billing Period: January 1-31, 2025
- Total Amount Due: $25.00 USD
- Due Date: February 15, 2025

Services:
- Mobile Voice: $10.00
- Mobile Data (5GB): $12.00
- SMS Package: $3.00

You can pay your bill through:
- EVC Plus
- Mobile Money
- Bank Transfer
- Hormuud Offices

Thank you for choosing Hormuud Telecom!

Customer Service: +252-1-345678
Website: www.hormuud.com',
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
*/

-- Verification queries
SELECT 
    'Company Senders' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_records
FROM public.company_senders
UNION ALL
SELECT 
    'Government Senders' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_records
FROM public.government_senders;

COMMENT ON TABLE public.company_senders IS 'Authorized companies and businesses that can send notifications to users through the KIVRO inbox system';
COMMENT ON COLUMN public.user_inbox.sender_type IS 'Type of sender: government or company';
COMMENT ON COLUMN public.user_inbox.company_sender_id IS 'Reference to company sender if sender_type is company';
