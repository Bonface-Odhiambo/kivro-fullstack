-- Add support for all African countries to KIVRO addresses
-- This migration adds country and country_code fields to support pan-African address generation

-- Add country fields to kivro_addresses table
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3),
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(5);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_country 
ON public.kivro_addresses(country) 
WHERE country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kivro_addresses_country_code 
ON public.kivro_addresses(country_code) 
WHERE country_code IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN public.kivro_addresses.country IS 'Full country name (e.g., Kenya, Nigeria, South Africa)';
COMMENT ON COLUMN public.kivro_addresses.country_code IS 'ISO 3166-1 alpha-3 country code (e.g., KEN, NGA, ZAF)';
COMMENT ON COLUMN public.kivro_addresses.phone_country_code IS 'Phone country code with + (e.g., +254, +234, +27)';

-- Create African countries reference table
CREATE TABLE IF NOT EXISTS public.african_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  iso_code VARCHAR(3) NOT NULL UNIQUE,
  phone_code VARCHAR(5) NOT NULL,
  phone_format VARCHAR(50),
  phone_length_min INTEGER,
  phone_length_max INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.african_countries IS 'Reference table for all African countries with phone validation rules';

-- Insert all African countries with their phone codes
INSERT INTO public.african_countries (name, iso_code, phone_code, phone_format, phone_length_min, phone_length_max) VALUES
-- North Africa
('Algeria', 'DZA', '+213', '0XX XXX XXXX', 9, 9),
('Egypt', 'EGY', '+20', '0XX XXXX XXXX', 10, 10),
('Libya', 'LBY', '+218', '0XX XXX XXXX', 9, 10),
('Morocco', 'MAR', '+212', '0XX XXX XXXX', 9, 9),
('Tunisia', 'TUN', '+216', 'XX XXX XXX', 8, 8),
('Sudan', 'SDN', '+249', '0XX XXX XXXX', 9, 9),

-- West Africa
('Nigeria', 'NGA', '+234', '0XXX XXX XXXX', 10, 11),
('Ghana', 'GHA', '+233', '0XX XXX XXXX', 9, 10),
('Senegal', 'SEN', '+221', 'XX XXX XXXX', 9, 9),
('Ivory Coast', 'CIV', '+225', 'XX XX XX XX XX', 10, 10),
('Mali', 'MLI', '+223', 'XX XX XX XX', 8, 8),
('Burkina Faso', 'BFA', '+226', 'XX XX XX XX', 8, 8),
('Niger', 'NER', '+227', 'XX XX XX XX', 8, 8),
('Guinea', 'GIN', '+224', 'XXX XX XX XX', 9, 9),
('Benin', 'BEN', '+229', 'XX XX XX XX', 8, 8),
('Togo', 'TGO', '+228', 'XX XX XX XX', 8, 8),
('Sierra Leone', 'SLE', '+232', 'XX XXX XXX', 8, 8),
('Liberia', 'LBR', '+231', 'XX XXX XXXX', 7, 9),
('Mauritania', 'MRT', '+222', 'XX XX XX XX', 8, 8),
('Gambia', 'GMB', '+220', 'XXX XXXX', 7, 7),
('Guinea-Bissau', 'GNB', '+245', 'XXX XXXX', 7, 7),
('Cape Verde', 'CPV', '+238', 'XXX XX XX', 7, 7),

-- East Africa
('Kenya', 'KEN', '+254', '0XXX XXXXXX', 9, 10),
('Tanzania', 'TZA', '+255', '0XX XXX XXXX', 9, 10),
('Uganda', 'UGA', '+256', '0XX XXX XXXX', 9, 10),
('Ethiopia', 'ETH', '+251', '0XX XXX XXXX', 9, 10),
('Somalia', 'SOM', '+252', '0XX XXX XXXX', 8, 9),
('Rwanda', 'RWA', '+250', '0XXX XXX XXX', 9, 9),
('Burundi', 'BDI', '+257', 'XX XX XX XX', 8, 8),
('Djibouti', 'DJI', '+253', 'XX XX XX XX', 8, 8),
('Eritrea', 'ERI', '+291', 'X XXX XXX', 7, 7),
('South Sudan', 'SSD', '+211', '0XX XXX XXXX', 9, 9),

-- Southern Africa
('South Africa', 'ZAF', '+27', '0XX XXX XXXX', 9, 10),
('Zimbabwe', 'ZWE', '+263', '0XX XXX XXXX', 9, 10),
('Zambia', 'ZMB', '+260', '0XX XXX XXXX', 9, 10),
('Mozambique', 'MOZ', '+258', '0XX XXX XXX', 9, 9),
('Botswana', 'BWA', '+267', 'XX XXX XXX', 8, 8),
('Namibia', 'NAM', '+264', '0XX XXX XXXX', 9, 10),
('Malawi', 'MWI', '+265', '0XXX XX XX XX', 9, 9),
('Lesotho', 'LSO', '+266', 'XX XXX XXX', 8, 8),
('Eswatini', 'SWZ', '+268', 'XX XX XXXX', 8, 8),
('Madagascar', 'MDG', '+261', '0XX XX XXX XX', 9, 10),
('Mauritius', 'MUS', '+230', 'XXXX XXXX', 8, 8),
('Seychelles', 'SYC', '+248', 'X XX XX XX', 7, 7),
('Comoros', 'COM', '+269', 'XXX XX XX', 7, 7),

-- Central Africa
('Democratic Republic of Congo', 'COD', '+243', '0XX XXX XXXX', 9, 10),
('Angola', 'AGO', '+244', '0XX XXX XXX', 9, 9),
('Cameroon', 'CMR', '+237', 'X XX XX XX XX', 9, 9),
('Chad', 'TCD', '+235', 'XX XX XX XX', 8, 8),
('Central African Republic', 'CAF', '+236', 'XX XX XX XX', 8, 8),
('Republic of Congo', 'COG', '+242', 'XX XXX XXXX', 9, 9),
('Gabon', 'GAB', '+241', 'X XX XX XX', 7, 8),
('Equatorial Guinea', 'GNQ', '+240', 'XXX XXX XXX', 9, 9),
('Sao Tome and Principe', 'STP', '+239', 'XXX XXXX', 7, 7)

ON CONFLICT (iso_code) DO NOTHING;

-- Create function to detect country from phone number
CREATE OR REPLACE FUNCTION detect_country_from_phone(phone_number TEXT)
RETURNS TABLE(country VARCHAR, country_code VARCHAR, phone_code VARCHAR) AS $$
DECLARE
  clean_phone TEXT;
BEGIN
  -- Clean phone number (remove spaces, dashes, parentheses)
  clean_phone := REGEXP_REPLACE(phone_number, '[^0-9+]', '', 'g');
  
  -- If phone doesn't start with +, try to match by length and pattern
  IF NOT clean_phone ~ '^\+' THEN
    -- Add + if missing
    clean_phone := '+' || clean_phone;
  END IF;
  
  -- Try to match against all African countries
  -- Order by phone_code length DESC to match longest codes first (e.g., +234 before +23)
  RETURN QUERY
  SELECT ac.name, ac.iso_code, ac.phone_code
  FROM african_countries ac
  WHERE clean_phone LIKE ac.phone_code || '%'
    AND ac.is_active = TRUE
  ORDER BY LENGTH(ac.phone_code) DESC
  LIMIT 1;
  
  -- If no match found, return NULL
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate phone number for a specific country
CREATE OR REPLACE FUNCTION validate_african_phone(phone_number TEXT, country_iso_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  clean_phone TEXT;
  country_rec RECORD;
  phone_digits TEXT;
BEGIN
  -- Clean phone number
  clean_phone := REGEXP_REPLACE(phone_number, '[^0-9+]', '', 'g');
  
  -- Get country details
  SELECT * INTO country_rec
  FROM african_countries
  WHERE iso_code = country_iso_code AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if phone starts with country code
  IF NOT clean_phone ~ ('^' || country_rec.phone_code) THEN
    RETURN FALSE;
  END IF;
  
  -- Extract digits after country code
  phone_digits := SUBSTRING(clean_phone FROM LENGTH(country_rec.phone_code) + 1);
  
  -- Remove leading zero if present (common in African numbers)
  IF phone_digits ~ '^0' THEN
    phone_digits := SUBSTRING(phone_digits FROM 2);
  END IF;
  
  -- Check length
  IF LENGTH(phone_digits) < country_rec.phone_length_min 
     OR LENGTH(phone_digits) > country_rec.phone_length_max THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update existing addresses to set country based on phone number
DO $$
DECLARE
  addr RECORD;
  detected_country RECORD;
BEGIN
  FOR addr IN SELECT id, phone_number FROM kivro_addresses WHERE country IS NULL AND phone_number IS NOT NULL LOOP
    -- Detect country from phone number
    SELECT * INTO detected_country FROM detect_country_from_phone(addr.phone_number);
    
    IF detected_country.country IS NOT NULL THEN
      UPDATE kivro_addresses 
      SET 
        country = detected_country.country,
        country_code = detected_country.country_code,
        phone_country_code = detected_country.phone_code
      WHERE id = addr.id;
    END IF;
  END LOOP;
END $$;

-- Grant necessary permissions
GRANT SELECT ON public.african_countries TO authenticated;
GRANT SELECT ON public.african_countries TO anon;

-- Create index on phone_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_african_countries_phone_code 
ON public.african_countries(phone_code);

-- Add RLS policies for african_countries table
ALTER TABLE public.african_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "African countries are viewable by everyone"
ON public.african_countries FOR SELECT
TO public
USING (is_active = TRUE);
