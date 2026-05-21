-- Add short_code column and auto-generation for KIVRO addresses
-- Short codes are human-friendly 6-character codes like KV-A1B2C3

-- Add short_code column if it doesn't exist
ALTER TABLE public.kivro_addresses
ADD COLUMN IF NOT EXISTS short_code VARCHAR(20) UNIQUE;

-- Create function to generate random short code
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluding confusing chars like 0, O, 1, I
  result TEXT := 'KV-';
  i INTEGER;
  random_char TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    result := 'KV-';
    
    -- Generate 6 random characters (2 groups of 3, separated by dash)
    FOR i IN 1..3 LOOP
      random_char := substr(characters, floor(random() * length(characters) + 1)::int, 1);
      result := result || random_char;
    END LOOP;
    
    result := result || '-';
    
    FOR i IN 1..3 LOOP
      random_char := substr(characters, floor(random() * length(characters) + 1)::int, 1);
      result := result || random_char;
    END LOOP;
    
    -- Check if this short code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.kivro_addresses WHERE short_code = result
    ) INTO exists_already;
    
    -- If code is unique, exit loop
    IF NOT exists_already THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION generate_short_code() IS 'Generates a unique 6-character KIVRO short code like KV-ABC-123';

-- Create trigger function to auto-generate short_code on insert
CREATE OR REPLACE FUNCTION auto_generate_short_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    NEW.short_code := generate_short_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_short_code ON public.kivro_addresses;
CREATE TRIGGER trigger_auto_short_code
  BEFORE INSERT ON public.kivro_addresses
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_short_code();

-- Backfill short_code for existing addresses that don't have one
DO $$
DECLARE
  addr_record RECORD;
  new_code TEXT;
  updated_count INT := 0;
BEGIN
  FOR addr_record IN 
    SELECT id, kivro_code
    FROM public.kivro_addresses
    WHERE short_code IS NULL OR short_code = ''
  LOOP
    -- Generate unique short code
    new_code := generate_short_code();
    
    -- Update the address
    UPDATE public.kivro_addresses
    SET short_code = new_code,
        updated_at = NOW()
    WHERE id = addr_record.id;
    
    updated_count := updated_count + 1;
    
    IF updated_count % 10 = 0 THEN
      RAISE NOTICE 'Generated short codes for % addresses...', updated_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill complete! Generated short codes for % addresses.', updated_count;
END $$;

-- Add index on short_code for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_kivro_addresses_short_code
ON public.kivro_addresses(short_code)
WHERE short_code IS NOT NULL;

-- Add comment to column
COMMENT ON COLUMN public.kivro_addresses.short_code IS 'Human-friendly 6-character code like KV-ABC-123 for easy sharing and e-commerce checkout';
