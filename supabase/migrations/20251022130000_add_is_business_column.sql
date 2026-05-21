-- Add is_business column to kivro_addresses table if it doesn't exist
-- This column distinguishes between personal and business addresses

ALTER TABLE public.kivro_addresses
ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE;

-- Add index for filtering business addresses
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_is_business
ON public.kivro_addresses(is_business)
WHERE is_business = TRUE;

-- Add comment to document the column
COMMENT ON COLUMN public.kivro_addresses.is_business IS 'Indicates if this is a business/company address (true) or personal address (false)';

-- Update existing addresses to default to personal (false) if NULL
UPDATE public.kivro_addresses
SET is_business = FALSE
WHERE is_business IS NULL;
