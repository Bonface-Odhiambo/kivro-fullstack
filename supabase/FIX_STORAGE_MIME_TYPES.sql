-- Fix storage bucket MIME type configuration
-- This resolves the "mime type application/json is not supported" error

-- Update house-images bucket to allow all image types
UPDATE storage.buckets
SET allowed_mime_types = NULL  -- NULL means allow all file types
WHERE id = 'house-images';

-- Update company-logos bucket to allow all image types
UPDATE storage.buckets
SET allowed_mime_types = NULL  -- NULL means allow all file types
WHERE id = 'company-logos';

-- Verify the changes
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('house-images', 'company-logos');

-- If you want to re-enable MIME type restrictions later, use:
-- UPDATE storage.buckets
-- SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
-- WHERE id = 'house-images';
