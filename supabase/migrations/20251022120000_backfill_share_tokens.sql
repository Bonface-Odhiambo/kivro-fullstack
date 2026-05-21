-- Backfill share_token for all existing addresses that don't have one
-- This migration adds unique share tokens to addresses for public sharing

-- Create a function to generate random share tokens (base64url format)
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 27-character base64url token (20 random bytes)
    token := encode(gen_random_bytes(20), 'base64');
    -- Replace + with - and / with _ for URL-safe base64url
    token := replace(replace(token, '+', '-'), '/', '_');
    -- Remove padding =
    token := rtrim(token, '=');
    
    -- Check if this token already exists
    SELECT EXISTS(
      SELECT 1 FROM public.kivro_addresses WHERE share_token = token
    ) INTO exists_already;
    
    -- If token is unique, exit loop
    IF NOT exists_already THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the function
COMMENT ON FUNCTION generate_share_token() IS 'Generates a unique base64url share token for address sharing';

-- Backfill share_token for all addresses that don't have one
DO $$
DECLARE
  addr_record RECORD;
  new_token TEXT;
  updated_count INT := 0;
BEGIN
  -- Loop through all addresses without share tokens
  FOR addr_record IN 
    SELECT id, kivro_code
    FROM public.kivro_addresses
    WHERE share_token IS NULL OR share_token = ''
  LOOP
    -- Generate a unique token
    new_token := generate_share_token();
    
    -- Update the address
    UPDATE public.kivro_addresses
    SET share_token = new_token,
        updated_at = NOW()
    WHERE id = addr_record.id;
    
    updated_count := updated_count + 1;
    
    IF updated_count % 10 = 0 THEN
      RAISE NOTICE 'Processed % addresses...', updated_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill complete! Updated % addresses with share tokens.', updated_count;
END $$;

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_share_token 
ON public.kivro_addresses(share_token) 
WHERE share_token IS NOT NULL;

-- Add unique constraint to ensure share tokens are unique
ALTER TABLE public.kivro_addresses
DROP CONSTRAINT IF EXISTS unique_share_token;

ALTER TABLE public.kivro_addresses
ADD CONSTRAINT unique_share_token UNIQUE (share_token);

-- Add comment to document the column
COMMENT ON COLUMN public.kivro_addresses.share_token IS 'Unique token for public sharing via /kv/:token URLs';
