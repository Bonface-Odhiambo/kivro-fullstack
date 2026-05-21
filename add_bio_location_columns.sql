-- Add bio and location columns to profiles table
-- Migration script for KIVRO database

-- Add bio column (for user biography/description)
ALTER TABLE profiles 
ADD COLUMN bio TEXT;

-- Add location column (for user location/city)
ALTER TABLE profiles 
ADD COLUMN location TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.bio IS 'User biography or personal description';
COMMENT ON COLUMN profiles.location IS 'User location, city, or region';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'location');

-- Show updated table structure (alternative to \d profiles)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
