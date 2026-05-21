-- Add location verification and sharing features to kivro_addresses table
-- This enables full navigation features, short codes, and public sharing

-- Add geolocation and verification columns
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS geo_confidence SMALLINT DEFAULT 0 CHECK (geo_confidence >= 0 AND geo_confidence <= 100),
ADD COLUMN IF NOT EXISTS short_code VARCHAR(16) UNIQUE,
ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20), -- 'gps', 'manual', 'telco'
ADD COLUMN IF NOT EXISTS location_note TEXT; -- e.g., "Near Central Area, Salahley"

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_latlng 
ON public.kivro_addresses(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kivro_addresses_short_code 
ON public.kivro_addresses(short_code) 
WHERE short_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kivro_addresses_share_token 
ON public.kivro_addresses(share_token) 
WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kivro_addresses_verified 
ON public.kivro_addresses(is_verified) 
WHERE is_verified = TRUE;

-- Add comments to document the columns
COMMENT ON COLUMN public.kivro_addresses.latitude IS 'Latitude coordinate (decimal degrees, -90 to 90)';
COMMENT ON COLUMN public.kivro_addresses.longitude IS 'Longitude coordinate (decimal degrees, -180 to 180)';
COMMENT ON COLUMN public.kivro_addresses.geo_confidence IS 'Location accuracy confidence score (0-100)';
COMMENT ON COLUMN public.kivro_addresses.short_code IS 'Short code for easy sharing (e.g., KV-444)';
COMMENT ON COLUMN public.kivro_addresses.share_token IS 'Unique token for public sharing URL';
COMMENT ON COLUMN public.kivro_addresses.is_verified IS 'Whether the location has been verified by the user';
COMMENT ON COLUMN public.kivro_addresses.verification_method IS 'How the location was verified: gps, manual, or telco';
COMMENT ON COLUMN public.kivro_addresses.location_note IS 'Additional location notes (e.g., "Near Central Area")';

-- Function to generate short code from phone number
CREATE OR REPLACE FUNCTION generate_short_code(phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
  last_digits TEXT;
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract last 3-4 digits from phone number
  last_digits := RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 4);
  base_code := 'KV-' || last_digits;
  final_code := base_code;
  
  -- Check for uniqueness and append letter if collision
  WHILE EXISTS (SELECT 1 FROM kivro_addresses WHERE short_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || CHR(64 + counter); -- A, B, C, etc.
    
    -- Safety: if we've tried all letters, add a number
    IF counter > 26 THEN
      final_code := base_code || '-' || counter;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 32-character token
  token := encode(gen_random_bytes(24), 'base64');
  token := REPLACE(REPLACE(REPLACE(token, '+', ''), '/', ''), '=', '');
  token := SUBSTRING(token, 1, 32);
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate short_code and share_token on insert
CREATE OR REPLACE FUNCTION auto_generate_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate short code if not provided
  IF NEW.short_code IS NULL AND NEW.phone_number IS NOT NULL THEN
    NEW.short_code := generate_short_code(NEW.phone_number);
  END IF;
  
  -- Generate share token if not provided
  IF NEW.share_token IS NULL THEN
    NEW.share_token := generate_share_token();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_codes ON public.kivro_addresses;
CREATE TRIGGER trigger_auto_generate_codes
  BEFORE INSERT ON public.kivro_addresses
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_codes();

-- Update existing addresses to have short codes and share tokens
DO $$
DECLARE
  addr RECORD;
BEGIN
  FOR addr IN SELECT id, phone_number FROM kivro_addresses WHERE short_code IS NULL LOOP
    UPDATE kivro_addresses 
    SET 
      short_code = generate_short_code(addr.phone_number),
      share_token = generate_share_token()
    WHERE id = addr.id;
  END LOOP;
END $$;

-- Create view for public address sharing (only shows what couriers need)
CREATE OR REPLACE VIEW public.kivro_addresses_public AS
SELECT 
  id,
  kivro_code,
  display_address,
  latitude,
  longitude,
  short_code,
  share_token,
  region,
  district,
  landmark,
  location_note,
  house_number,
  house_image_url,
  is_verified,
  is_active
FROM public.kivro_addresses
WHERE is_active = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Grant access to public view
GRANT SELECT ON public.kivro_addresses_public TO anon;
GRANT SELECT ON public.kivro_addresses_public TO authenticated;

-- RLS policy for public view (accessible by share_token)
CREATE POLICY "Public addresses viewable by share token"
ON public.kivro_addresses FOR SELECT
TO anon
USING (is_active = TRUE AND share_token IS NOT NULL);
