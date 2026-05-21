-- Add missing columns to kivro_addresses table
-- These columns are required for location-based address generation and Somali addresses

-- Add federal_member_state column (for Somalia regions)
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS federal_member_state VARCHAR(50);

-- Add postal_code column
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- Add country column
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'Somalia';

-- Add phone_number column
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15);

-- Add what3words_address column
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS what3words_address VARCHAR(100);

-- Add address_type column (residential, commercial, etc.)
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS address_type VARCHAR(20) DEFAULT 'residential';

-- Add recipient_name column (for What3Words addresses)
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);

-- Add delivery_instructions column
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_postal_code ON public.kivro_addresses(postal_code);
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_country ON public.kivro_addresses(country);
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_what3words ON public.kivro_addresses(what3words_address);
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_federal_state ON public.kivro_addresses(federal_member_state);

-- Add comments for documentation
COMMENT ON COLUMN public.kivro_addresses.federal_member_state IS 'Federal member state for Somali addresses (Somaliland, Puntland, etc.)';
COMMENT ON COLUMN public.kivro_addresses.postal_code IS 'Postal code (e.g., SL-100, PL-200)';
COMMENT ON COLUMN public.kivro_addresses.country IS 'Country code or name';
COMMENT ON COLUMN public.kivro_addresses.phone_number IS 'Phone number associated with this address';
COMMENT ON COLUMN public.kivro_addresses.what3words_address IS 'What3Words address (e.g., filled.count.soap)';
COMMENT ON COLUMN public.kivro_addresses.address_type IS 'Type of address: residential, commercial, delivery_point';
COMMENT ON COLUMN public.kivro_addresses.recipient_name IS 'Name of recipient for this address';
COMMENT ON COLUMN public.kivro_addresses.delivery_instructions IS 'Special delivery instructions for couriers';

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'kivro_addresses' 
AND column_name IN ('federal_member_state', 'postal_code', 'country', 'phone_number', 'what3words_address', 'address_type', 'recipient_name', 'delivery_instructions')
ORDER BY column_name;
