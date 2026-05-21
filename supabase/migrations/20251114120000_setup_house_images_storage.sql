-- Setup house images storage bucket and policies
-- This ensures house images are properly stored and accessible

-- Create the house-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'house-images',
  'house-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to upload their own house images
CREATE POLICY "Users can upload house images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'house-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to view their own house images
CREATE POLICY "Users can view their own house images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'house-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to update their own house images
CREATE POLICY "Users can update their own house images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'house-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own house images
CREATE POLICY "Users can delete their own house images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'house-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow public read access to house images (for sharing)
CREATE POLICY "Public can view house images" ON storage.objects
FOR SELECT USING (bucket_id = 'house-images');

-- Add helpful comment
COMMENT ON TABLE storage.objects IS 'Storage for house images with user-specific access control';

-- Create a function to generate proper house image URLs
CREATE OR REPLACE FUNCTION get_house_image_url(file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Get the Supabase project URL from settings or use a default pattern
  SELECT 
    COALESCE(
      current_setting('app.supabase_url', true),
      'https://' || current_setting('app.supabase_project_id', true) || '.supabase.co'
    ) INTO base_url;
  
  -- Return the full public URL for the image
  RETURN base_url || '/storage/v1/object/public/house-images/' || file_path;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_house_image_url(TEXT) TO authenticated, anon;

-- Create an index on the bucket_id and name for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
ON storage.objects (bucket_id, name);

-- Log the setup completion
DO $$
BEGIN
  RAISE NOTICE 'House images storage bucket setup completed successfully';
  RAISE NOTICE 'Bucket: house-images (public, 5MB limit)';
  RAISE NOTICE 'Supported formats: JPEG, PNG, WebP, GIF';
  RAISE NOTICE 'RLS policies: User-specific upload/update/delete, public read';
END $$;
