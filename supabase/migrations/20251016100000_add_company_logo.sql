-- Add company_logo_url column to kivro_addresses table
ALTER TABLE public.kivro_addresses 
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.kivro_addresses.company_logo_url IS 'URL to uploaded company logo stored in Supabase Storage';

-- Create storage bucket for company logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can update their own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can delete their own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');
