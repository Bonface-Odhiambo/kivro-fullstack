-- Add house_number and house_image_url columns to kivro_addresses table
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS house_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS house_image_url TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_kivro_addresses_house_number 
ON public.kivro_addresses(house_number) 
WHERE house_number IS NOT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN public.kivro_addresses.house_number IS 'Physical house number for easier identification (e.g., 123, A-45)';
COMMENT ON COLUMN public.kivro_addresses.house_image_url IS 'URL to uploaded house image stored in Supabase Storage';

-- Create storage bucket for house images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('house-images', 'house-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for house images
CREATE POLICY "Authenticated users can upload house images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'house-images');

CREATE POLICY "Anyone can view house images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'house-images');

CREATE POLICY "Users can update their own house images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'house-images');

CREATE POLICY "Users can delete their own house images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'house-images');
