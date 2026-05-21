-- Add bio and location columns to profiles table
-- Migration script for KIVRO database
-- Run this in Supabase SQL Editor

-- Add bio column (for user biography/description)
ALTER TABLE profiles 
ADD COLUMN bio TEXT;

-- Add location column (for user location/city)
ALTER TABLE profiles 
ADD COLUMN location TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.bio IS 'User biography or personal description';
COMMENT ON COLUMN profiles.location IS 'User location, city, or region';
