-- Backfill phone numbers into display_address for all existing addresses
-- This migration updates all existing addresses to include the phone number in their display_address

-- Create a function to normalize phone numbers (remove spaces, dashes, parentheses, and leading +)
CREATE OR REPLACE FUNCTION normalize_phone(phone_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone_text IS NULL OR phone_text = '' THEN
    RETURN '';
  END IF;
  
  -- Remove spaces, dashes, parentheses
  phone_text := REGEXP_REPLACE(phone_text, '[\s\-()]', '', 'g');
  
  -- Remove leading + if present
  IF phone_text LIKE '+%' THEN
    phone_text := SUBSTRING(phone_text FROM 2);
  END IF;
  
  RETURN phone_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment to the function
COMMENT ON FUNCTION normalize_phone(TEXT) IS 'Normalizes phone numbers by removing spaces, dashes, parentheses, and leading +';

-- Update all existing addresses to include phone number in display_address
-- Only update addresses that have a phone_number and don't already have it in display_address

DO $$
DECLARE
  addr_record RECORD;
  normalized_phone TEXT;
  name_part TEXT;
  rest_of_address TEXT;
  new_display_address TEXT;
  comma_pos INT;
BEGIN
  -- Loop through all addresses that have a phone number
  FOR addr_record IN 
    SELECT id, display_address, phone_number, kivro_code
    FROM public.kivro_addresses
    WHERE phone_number IS NOT NULL 
      AND phone_number != ''
      AND display_address IS NOT NULL
  LOOP
    -- Normalize the phone number
    normalized_phone := normalize_phone(addr_record.phone_number);
    
    -- Skip if phone already appears to be in the display_address
    -- (check if the normalized phone is already present)
    IF POSITION(normalized_phone IN addr_record.display_address) > 0 THEN
      CONTINUE;
    END IF;
    
    -- Extract the name (first part before comma) and rest of address
    comma_pos := POSITION(',' IN addr_record.display_address);
    
    IF comma_pos > 0 THEN
      -- Get the name part (everything before first comma)
      name_part := TRIM(SUBSTRING(addr_record.display_address FROM 1 FOR comma_pos - 1));
      -- Get rest of address (everything after first comma, including the comma)
      rest_of_address := SUBSTRING(addr_record.display_address FROM comma_pos);
      
      -- Reconstruct display_address with phone number
      -- Format: "Name, PhoneNumber RestOfAddress"
      new_display_address := name_part || ', ' || normalized_phone || ' ' || LTRIM(SUBSTRING(rest_of_address FROM 2));
    ELSE
      -- If no comma found, just prepend the phone to the whole address
      new_display_address := normalized_phone || ' ' || addr_record.display_address;
    END IF;
    
    -- Update the address
    UPDATE public.kivro_addresses
    SET display_address = new_display_address,
        updated_at = NOW()
    WHERE id = addr_record.id;
    
    RAISE NOTICE 'Updated address %: % -> %', 
      addr_record.kivro_code, 
      addr_record.display_address, 
      new_display_address;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! All existing addresses now include phone numbers.';
END $$;

-- Create an index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_phone_number 
ON public.kivro_addresses(phone_number) 
WHERE phone_number IS NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.kivro_addresses.display_address IS 'Full formatted address including name, phone number, KIVRO code, region, and country';
