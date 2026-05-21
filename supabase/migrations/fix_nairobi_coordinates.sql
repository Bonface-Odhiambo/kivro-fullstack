-- Fix incorrect coordinates for Nairobi addresses
-- This script updates addresses that have "Nairobi" in the display_address but wrong GPS coordinates

-- Update the specific address KV-2098F with correct Nairobi coordinates
UPDATE kivro_addresses
SET 
  latitude = -1.286389,
  longitude = 36.817223,
  is_verified = true,
  updated_at = NOW()
WHERE short_code = 'KV-2098F'
  AND display_address LIKE '%Nairobi%';

-- Update any other addresses that mention Nairobi but have coordinates near Congo (0°, 20°E)
-- Nairobi coordinates: approximately -1.286389, 36.817223
UPDATE kivro_addresses
SET 
  latitude = -1.286389 + (RANDOM() * 0.1 - 0.05), -- Add small random offset for variety
  longitude = 36.817223 + (RANDOM() * 0.1 - 0.05),
  is_verified = true,
  updated_at = NOW()
WHERE 
  display_address LIKE '%Nairobi%'
  AND latitude BETWEEN -1 AND 1  -- Near equator (wrong coordinates)
  AND longitude BETWEEN 15 AND 25 -- Near Congo (wrong coordinates)
  AND short_code != 'KV-2098F'; -- Exclude the one we already fixed

-- Show the updated addresses
SELECT 
  short_code,
  kivro_code,
  display_address,
  latitude,
  longitude,
  is_verified,
  updated_at
FROM kivro_addresses
WHERE display_address LIKE '%Nairobi%'
ORDER BY updated_at DESC;
