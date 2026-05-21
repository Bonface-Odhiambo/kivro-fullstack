-- Add API key column to government_senders table for API authentication
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.government_senders 
ADD COLUMN IF NOT EXISTS api_key VARCHAR(100) UNIQUE;

-- Generate API keys for existing government agencies
-- Format: agency_code + random string (you can regenerate these for production)

UPDATE public.government_senders 
SET api_key = CASE organization_code
    WHEN 'POLICE' THEN 'police_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'TAX_AUTHORITY' THEN 'tax_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'HEALTH_MINISTRY' THEN 'health_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'MOGADISHU_CITY' THEN 'city_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'IMMIGRATION' THEN 'immigration_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'EDUCATION_MINISTRY' THEN 'education_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'ELECTRICITY' THEN 'electricity_api_key_' || md5(random()::text || clock_timestamp()::text)
    WHEN 'WATER_AUTHORITY' THEN 'water_api_key_' || md5(random()::text || clock_timestamp()::text)
    ELSE 'api_key_' || md5(random()::text || clock_timestamp()::text)
END
WHERE api_key IS NULL;

-- View generated API keys (save these securely!)
SELECT 
    organization_name,
    organization_code,
    api_key,
    contact_email
FROM public.government_senders
ORDER BY organization_name;

-- Example: To manually set a specific API key for an agency:
-- UPDATE public.government_senders 
-- SET api_key = 'your-secure-api-key-here'
-- WHERE organization_code = 'POLICE';
