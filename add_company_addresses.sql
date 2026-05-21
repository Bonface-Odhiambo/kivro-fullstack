-- Add Company Address Support to KIVRO
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add address_type column to kivro_addresses table
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS address_type VARCHAR(20) DEFAULT 'personal' CHECK (address_type IN ('personal', 'company'));

-- Step 2: Add company information columns
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS company_registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20);

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_type ON public.kivro_addresses(user_id, address_type);

-- Step 4: Add company_info column to profiles table (optional - for storing company details)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_info JSONB;

-- Step 5: Update existing addresses to be 'personal' type (if not already set)
UPDATE public.kivro_addresses 
SET address_type = 'personal' 
WHERE address_type IS NULL;

-- Step 6: Create a view for easy querying of personal vs company addresses
CREATE OR REPLACE VIEW public.user_addresses_summary AS
SELECT 
    user_id,
    COUNT(*) FILTER (WHERE address_type = 'personal' AND is_active = true) as personal_addresses_count,
    COUNT(*) FILTER (WHERE address_type = 'company' AND is_active = true) as company_addresses_count,
    COUNT(*) FILTER (WHERE is_active = true) as total_active_addresses,
    MAX(created_at) FILTER (WHERE address_type = 'personal') as last_personal_address_created,
    MAX(created_at) FILTER (WHERE address_type = 'company') as last_company_address_created
FROM public.kivro_addresses
GROUP BY user_id;

-- Step 7: Add RLS policy for company addresses (same as personal)
-- Users can only see their own addresses regardless of type
-- (This should already be covered by existing RLS policies, but we'll ensure it)

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'kivro_addresses' 
AND column_name IN ('address_type', 'company_name', 'company_registration_number', 'company_email', 'company_phone')
ORDER BY ordinal_position;

-- Example: Insert a company address (for testing)
-- Replace USER_UUID with actual user ID
/*
INSERT INTO public.kivro_addresses (
    user_id,
    address_type,
    kivro_code,
    display_address,
    region,
    district,
    postal_code,
    company_name,
    company_registration_number,
    company_email,
    company_phone,
    is_active
) VALUES (
    'USER_UUID_HERE',
    'company',
    'KV-BIZ-TEST01-2025',
    'Kivro Business Solutions, KV-BIZ-TEST01-2025, Mogadishu',
    'Banadir',
    'Mogadishu',
    '00100',
    'Kivro Business Solutions',
    'REG-2025-12345',
    'info@kivrobusiness.com',
    '+252-1-234567',
    true
);
*/

-- Query to view all addresses by type (uncomment and replace USER_UUID_HERE with actual user ID)
/*
SELECT 
    id,
    address_type,
    kivro_code,
    display_address,
    company_name,
    is_active,
    created_at
FROM public.kivro_addresses
WHERE user_id = 'USER_UUID_HERE'
ORDER BY address_type, created_at DESC;
*/
