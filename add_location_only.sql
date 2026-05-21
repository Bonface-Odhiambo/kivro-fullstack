-- Add only the location column since bio already exists
ALTER TABLE profiles ADD COLUMN location TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.location IS 'User location, city, or region';

-- Verify both columns now exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'location')
ORDER BY column_name;
