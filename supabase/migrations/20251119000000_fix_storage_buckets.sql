-- Fix storage buckets configuration for house images and company logos
-- This resolves the "mime type application/json is not supported" error

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can upload house images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own house images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own house images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own house images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view house images" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view company logos" ON storage.objects;

-- Ensure buckets exist with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'house-images',
    'house-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  ),
  (
    'company-logos',
    'company-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- House Images Policies (Simplified and Fixed)
CREATE POLICY "Anyone can upload house images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'house-images');

CREATE POLICY "Anyone can view house images"
ON storage.objects FOR SELECT
USING (bucket_id = 'house-images');

CREATE POLICY "Users can update their own house images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'house-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own house images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'house-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Company Logos Policies (Simplified and Fixed)
CREATE POLICY "Anyone can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can update their own company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets fixed successfully';
  RAISE NOTICE '📦 Buckets: house-images, company-logos';
  RAISE NOTICE '🔒 RLS policies: Simplified for better compatibility';
  RAISE NOTICE '📝 Allowed formats: JPEG, PNG, WebP, GIF, HEIC, SVG';
END $$;
