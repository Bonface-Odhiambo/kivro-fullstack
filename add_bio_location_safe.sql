-- Safe migration script for bio and location columns
-- This script checks if columns exist before adding them

-- Add bio column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to profiles table';
    ELSE
        RAISE NOTICE 'Bio column already exists in profiles table';
    END IF;
END $$;

-- Add location column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to profiles table';
    ELSE
        RAISE NOTICE 'Location column already exists in profiles table';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN profiles.bio IS 'User biography or personal description';
COMMENT ON COLUMN profiles.location IS 'User location, city, or region';

-- Verify both columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'location')
ORDER BY column_name;
