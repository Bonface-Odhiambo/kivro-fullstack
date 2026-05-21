-- Comprehensive script to fix coordinates for all African locations
-- Covers major cities, minor cities, and suburban areas across all African countries
-- This ensures accurate map display in the Share KIVRO Address modal

-- ============================================================================
-- EAST AFRICA
-- ============================================================================

-- KENYA
-- Major Cities
UPDATE kivro_addresses SET latitude = -1.286389, longitude = 36.817223, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Nairobi%' OR region ILIKE '%Nairobi%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45) AND (latitude NOT BETWEEN -2 AND 0);

UPDATE kivro_addresses SET latitude = -4.043477, longitude = 39.668206, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Mombasa%' OR region ILIKE '%Mombasa%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45) AND (latitude NOT BETWEEN -5 AND -3);

UPDATE kivro_addresses SET latitude = -0.091702, longitude = 34.767956, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kisumu%' OR region ILIKE '%Kisumu%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45) AND (latitude NOT BETWEEN -1 AND 1);

UPDATE kivro_addresses SET latitude = -0.283262, longitude = 36.066667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Nakuru%' OR region ILIKE '%Nakuru%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45);

UPDATE kivro_addresses SET latitude = 0.516667, longitude = 35.283333, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Eldoret%' OR region ILIKE '%Eldoret%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45);

-- Minor Cities & Suburban Areas
UPDATE kivro_addresses SET latitude = -1.516667, longitude = 37.266667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Thika%' OR region ILIKE '%Thika%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45);

UPDATE kivro_addresses SET latitude = -1.083333, longitude = 37.066667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Nyeri%' OR region ILIKE '%Nyeri%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45);

UPDATE kivro_addresses SET latitude = -1.28333, longitude = 36.95, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kiambu%' OR region ILIKE '%Kiambu%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45);

UPDATE kivro_addresses SET latitude = -1.05, longitude = 37.15, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Murang''a%' OR region ILIKE '%Murang''a%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 15 AND 45);

-- TANZANIA
-- Major Cities
UPDATE kivro_addresses SET latitude = -6.792354, longitude = 39.208328, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Dar es Salaam%' OR display_address ILIKE '%Dar%' OR region ILIKE '%Dar%') AND (latitude BETWEEN -10 AND 0) AND (longitude BETWEEN 25 AND 45);

UPDATE kivro_addresses SET latitude = -3.385719, longitude = 36.682778, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Arusha%' OR region ILIKE '%Arusha%') AND (latitude BETWEEN -10 AND 0) AND (longitude BETWEEN 25 AND 45);

UPDATE kivro_addresses SET latitude = -6.163333, longitude = 35.751944, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Mwanza%' OR region ILIKE '%Mwanza%') AND (latitude BETWEEN -10 AND 0) AND (longitude BETWEEN 25 AND 45);

UPDATE kivro_addresses SET latitude = -6.369028, longitude = 34.888822, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Dodoma%' OR region ILIKE '%Dodoma%') AND (latitude BETWEEN -10 AND 0) AND (longitude BETWEEN 25 AND 45);

-- Minor Cities
UPDATE kivro_addresses SET latitude = -5.066667, longitude = 39.1, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Tanga%' OR region ILIKE '%Tanga%') AND (latitude BETWEEN -10 AND 0) AND (longitude BETWEEN 25 AND 45);

UPDATE kivro_addresses SET latitude = -3.216667, longitude = 40.116667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Moshi%' OR region ILIKE '%Moshi%') AND (latitude BETWEEN -10 AND 0) AND (longitude BETWEEN 25 AND 45);

-- UGANDA
-- Major Cities
UPDATE kivro_addresses SET latitude = 0.347596, longitude = 32.582520, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kampala%' OR region ILIKE '%Kampala%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 25 AND 40);

UPDATE kivro_addresses SET latitude = 0.373889, longitude = 32.290278, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Entebbe%' OR region ILIKE '%Entebbe%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 25 AND 40);

UPDATE kivro_addresses SET latitude = 2.775833, longitude = 32.299167, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Gulu%' OR region ILIKE '%Gulu%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 25 AND 40);

-- RWANDA
UPDATE kivro_addresses SET latitude = -1.970579, longitude = 30.104429, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kigali%' OR region ILIKE '%Kigali%') AND (latitude BETWEEN -5 AND 5) AND (longitude BETWEEN 25 AND 35);

-- ETHIOPIA
UPDATE kivro_addresses SET latitude = 9.024325, longitude = 38.746799, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Addis Ababa%' OR display_address ILIKE '%Addis%' OR region ILIKE '%Addis%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN 30 AND 45);

-- ============================================================================
-- WEST AFRICA
-- ============================================================================

-- NIGERIA
-- Major Cities
UPDATE kivro_addresses SET latitude = 6.524379, longitude = 3.379206, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Lagos%' OR region ILIKE '%Lagos%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

UPDATE kivro_addresses SET latitude = 9.081999, longitude = 8.675277, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Abuja%' OR region ILIKE '%Abuja%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

UPDATE kivro_addresses SET latitude = 11.996389, longitude = 8.516667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kano%' OR region ILIKE '%Kano%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

UPDATE kivro_addresses SET latitude = 7.377222, longitude = 3.947222, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Ibadan%' OR region ILIKE '%Ibadan%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

UPDATE kivro_addresses SET latitude = 4.815554, longitude = 7.049844, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Port Harcourt%' OR region ILIKE '%Port Harcourt%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

-- Minor Cities
UPDATE kivro_addresses SET latitude = 6.137778, longitude = 6.740278, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Benin City%' OR region ILIKE '%Benin City%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

UPDATE kivro_addresses SET latitude = 6.465422, longitude = 3.406448, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Ikeja%' OR region ILIKE '%Ikeja%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -5 AND 15);

-- GHANA
UPDATE kivro_addresses SET latitude = 5.603717, longitude = -0.186964, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Accra%' OR region ILIKE '%Accra%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -10 AND 5);

UPDATE kivro_addresses SET latitude = 6.688437, longitude = -1.624059, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kumasi%' OR region ILIKE '%Kumasi%') AND (latitude BETWEEN 0 AND 15) AND (longitude BETWEEN -10 AND 5);

-- SENEGAL
UPDATE kivro_addresses SET latitude = 14.716677, longitude = -17.467686, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Dakar%' OR region ILIKE '%Dakar%') AND (latitude BETWEEN 10 AND 20) AND (longitude BETWEEN -20 AND -10);

-- IVORY COAST (Côte d'Ivoire)
UPDATE kivro_addresses SET latitude = 5.359952, longitude = -4.008256, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Abidjan%' OR region ILIKE '%Abidjan%') AND (latitude BETWEEN 0 AND 10) AND (longitude BETWEEN -10 AND 0);

-- ============================================================================
-- SOUTHERN AFRICA
-- ============================================================================

-- SOUTH AFRICA
-- Major Cities
UPDATE kivro_addresses SET latitude = -26.204103, longitude = 28.047305, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Johannesburg%' OR region ILIKE '%Johannesburg%') AND (latitude BETWEEN -35 AND -20) AND (longitude BETWEEN 15 AND 35);

UPDATE kivro_addresses SET latitude = -33.924870, longitude = 18.424055, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Cape Town%' OR region ILIKE '%Cape Town%') AND (latitude BETWEEN -35 AND -30) AND (longitude BETWEEN 15 AND 25);

UPDATE kivro_addresses SET latitude = -29.858680, longitude = 31.021840, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Durban%' OR region ILIKE '%Durban%') AND (latitude BETWEEN -35 AND -25) AND (longitude BETWEEN 25 AND 35);

UPDATE kivro_addresses SET latitude = -25.746111, longitude = 28.188056, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Pretoria%' OR region ILIKE '%Pretoria%') AND (latitude BETWEEN -35 AND -20) AND (longitude BETWEEN 15 AND 35);

-- Minor Cities
UPDATE kivro_addresses SET latitude = -33.958252, longitude = 25.619022, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Port Elizabeth%' OR region ILIKE '%Port Elizabeth%') AND (latitude BETWEEN -35 AND -30) AND (longitude BETWEEN 20 AND 30);

UPDATE kivro_addresses SET latitude = -26.270833, longitude = 27.866667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Soweto%' OR region ILIKE '%Soweto%') AND (latitude BETWEEN -35 AND -20) AND (longitude BETWEEN 15 AND 35);

-- ZIMBABWE
UPDATE kivro_addresses SET latitude = -17.829167, longitude = 31.054167, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Harare%' OR region ILIKE '%Harare%') AND (latitude BETWEEN -25 AND -15) AND (longitude BETWEEN 25 AND 35);

UPDATE kivro_addresses SET latitude = -20.148333, longitude = 28.583333, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Bulawayo%' OR region ILIKE '%Bulawayo%') AND (latitude BETWEEN -25 AND -15) AND (longitude BETWEEN 25 AND 35);

-- ZAMBIA
UPDATE kivro_addresses SET latitude = -15.416667, longitude = 28.283333, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Lusaka%' OR region ILIKE '%Lusaka%') AND (latitude BETWEEN -20 AND -10) AND (longitude BETWEEN 20 AND 35);

-- BOTSWANA
UPDATE kivro_addresses SET latitude = -24.653257, longitude = 25.906792, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Gaborone%' OR region ILIKE '%Gaborone%') AND (latitude BETWEEN -30 AND -20) AND (longitude BETWEEN 20 AND 30);

-- ============================================================================
-- NORTH AFRICA
-- ============================================================================

-- EGYPT
UPDATE kivro_addresses SET latitude = 30.044420, longitude = 31.235712, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Cairo%' OR region ILIKE '%Cairo%') AND (latitude BETWEEN 20 AND 35) AND (longitude BETWEEN 25 AND 35);

UPDATE kivro_addresses SET latitude = 31.200092, longitude = 29.918739, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Alexandria%' OR region ILIKE '%Alexandria%') AND (latitude BETWEEN 25 AND 35) AND (longitude BETWEEN 25 AND 35);

-- MOROCCO
UPDATE kivro_addresses SET latitude = 33.971590, longitude = -6.849813, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Rabat%' OR region ILIKE '%Rabat%') AND (latitude BETWEEN 25 AND 40) AND (longitude BETWEEN -15 AND 0);

UPDATE kivro_addresses SET latitude = 33.589886, longitude = -7.603869, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Casablanca%' OR region ILIKE '%Casablanca%') AND (latitude BETWEEN 25 AND 40) AND (longitude BETWEEN -15 AND 0);

-- TUNISIA
UPDATE kivro_addresses SET latitude = 36.806495, longitude = 10.181532, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Tunis%' OR region ILIKE '%Tunis%') AND (latitude BETWEEN 30 AND 40) AND (longitude BETWEEN 5 AND 15);

-- ALGERIA
UPDATE kivro_addresses SET latitude = 36.737232, longitude = 3.086472, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Algiers%' OR region ILIKE '%Algiers%') AND (latitude BETWEEN 30 AND 40) AND (longitude BETWEEN -5 AND 10);

-- ============================================================================
-- HORN OF AFRICA
-- ============================================================================

-- SOMALIA
UPDATE kivro_addresses SET latitude = 2.046934, longitude = 45.318162, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Mogadishu%' OR region ILIKE '%Mogadishu%') AND (latitude BETWEEN -5 AND 15) AND (longitude BETWEEN 40 AND 50);

UPDATE kivro_addresses SET latitude = 9.560556, longitude = 44.065, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Hargeisa%' OR region ILIKE '%Hargeisa%') AND (latitude BETWEEN 5 AND 15) AND (longitude BETWEEN 40 AND 50);

UPDATE kivro_addresses SET latitude = 10.452778, longitude = 51.444444, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Bosaso%' OR region ILIKE '%Bosaso%') AND (latitude BETWEEN 5 AND 15) AND (longitude BETWEEN 45 AND 55);

-- SOMALILAND
UPDATE kivro_addresses SET latitude = 9.5, longitude = 44.05, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Burco%' OR display_address ILIKE '%Burao%' OR region ILIKE '%Burco%' OR region ILIKE '%Burao%' OR district ILIKE '%Burco%' OR district ILIKE '%Burao%') AND (latitude BETWEEN 5 AND 15) AND (longitude BETWEEN 40 AND 50);

UPDATE kivro_addresses SET latitude = 10.283333, longitude = 48.516667, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Berbera%' OR region ILIKE '%Berbera%') AND (latitude BETWEEN 5 AND 15) AND (longitude BETWEEN 40 AND 55);

UPDATE kivro_addresses SET latitude = 9.933333, longitude = 43.133333, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Borama%' OR region ILIKE '%Borama%') AND (latitude BETWEEN 5 AND 15) AND (longitude BETWEEN 40 AND 50);

-- DJIBOUTI
UPDATE kivro_addresses SET latitude = 11.572077, longitude = 43.145647, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Djibouti%' OR region ILIKE '%Djibouti%') AND (latitude BETWEEN 5 AND 15) AND (longitude BETWEEN 40 AND 45);

-- ============================================================================
-- MIDDLE EAST - IRAQ (SPECIAL SUPPORT)
-- ============================================================================

-- IRAQ
-- Major Cities
UPDATE kivro_addresses SET latitude = 33.312806, longitude = 44.361488, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Baghdad%' OR region ILIKE '%Baghdad%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 36.191113, longitude = 43.992317, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Mosul%' OR region ILIKE '%Mosul%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 30.508102, longitude = 47.783523, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Basra%' OR region ILIKE '%Basra%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 36.341389, longitude = 43.118889, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Erbil%' OR region ILIKE '%Erbil%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 35.462222, longitude = 44.392500, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kirkuk%' OR region ILIKE '%Kirkuk%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 36.850000, longitude = 42.450000, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Dohuk%' OR display_address ILIKE '%Duhok%' OR region ILIKE '%Dohuk%' OR region ILIKE '%Duhok%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 35.554444, longitude = 45.433333, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Sulaymaniyah%' OR display_address ILIKE '%Sulaimaniya%' OR region ILIKE '%Sulaymaniyah%' OR region ILIKE '%Sulaimaniya%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

-- Minor Cities
UPDATE kivro_addresses SET latitude = 32.561389, longitude = 44.420556, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Karbala%' OR region ILIKE '%Karbala%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 32.016389, longitude = 44.345000, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Najaf%' OR region ILIKE '%Najaf%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 33.383333, longitude = 43.783333, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Fallujah%' OR region ILIKE '%Fallujah%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

UPDATE kivro_addresses SET latitude = 33.422778, longitude = 44.238889, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Ramadi%' OR region ILIKE '%Ramadi%') AND (latitude BETWEEN 29 AND 38) AND (longitude BETWEEN 38 AND 49);

-- ============================================================================
-- CENTRAL AFRICA
-- ============================================================================

-- DEMOCRATIC REPUBLIC OF CONGO
UPDATE kivro_addresses SET latitude = -4.441931, longitude = 15.266293, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Kinshasa%' OR region ILIKE '%Kinshasa%') AND (latitude BETWEEN -10 AND 5) AND (longitude BETWEEN 10 AND 25);

-- CAMEROON
UPDATE kivro_addresses SET latitude = 3.848033, longitude = 11.502075, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Yaoundé%' OR display_address ILIKE '%Yaounde%' OR region ILIKE '%Yaoundé%' OR region ILIKE '%Yaounde%') AND (latitude BETWEEN 0 AND 10) AND (longitude BETWEEN 5 AND 20);

UPDATE kivro_addresses SET latitude = 4.050000, longitude = 9.700000, is_verified = true, updated_at = NOW()
WHERE (display_address ILIKE '%Douala%' OR region ILIKE '%Douala%') AND (latitude BETWEEN 0 AND 10) AND (longitude BETWEEN 5 AND 15);

-- ============================================================================
-- SHOW RESULTS
-- ============================================================================

-- Display summary of updated addresses by country/region
WITH country_summary AS (
  SELECT 
    CASE 
      WHEN display_address ILIKE '%Kenya%' OR region ILIKE '%Kenya%' THEN 'Kenya'
      WHEN display_address ILIKE '%Tanzania%' OR region ILIKE '%Tanzania%' THEN 'Tanzania'
      WHEN display_address ILIKE '%Uganda%' OR region ILIKE '%Uganda%' THEN 'Uganda'
      WHEN display_address ILIKE '%Rwanda%' OR region ILIKE '%Rwanda%' THEN 'Rwanda'
      WHEN display_address ILIKE '%Ethiopia%' OR region ILIKE '%Ethiopia%' THEN 'Ethiopia'
      WHEN display_address ILIKE '%Nigeria%' OR region ILIKE '%Nigeria%' THEN 'Nigeria'
      WHEN display_address ILIKE '%Ghana%' OR region ILIKE '%Ghana%' THEN 'Ghana'
      WHEN display_address ILIKE '%South Africa%' OR region ILIKE '%South Africa%' THEN 'South Africa'
      WHEN display_address ILIKE '%Somalia%' OR region ILIKE '%Somalia%' THEN 'Somalia'
      WHEN display_address ILIKE '%Egypt%' OR region ILIKE '%Egypt%' THEN 'Egypt'
      WHEN display_address ILIKE '%Morocco%' OR region ILIKE '%Morocco%' THEN 'Morocco'
      WHEN display_address ILIKE '%Iraq%' OR region ILIKE '%Iraq%' OR display_address ILIKE '%Baghdad%' OR region ILIKE '%Baghdad%' THEN 'Iraq'
      ELSE 'Other'
    END as country,
    is_verified,
    latitude,
    longitude
  FROM kivro_addresses
  WHERE updated_at > NOW() - INTERVAL '5 minutes'
)
SELECT 
  country,
  COUNT(*) as total_addresses,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_addresses,
  AVG(latitude) as avg_latitude,
  AVG(longitude) as avg_longitude
FROM country_summary
GROUP BY country
ORDER BY total_addresses DESC;

-- Show sample of recently updated addresses
SELECT 
  short_code,
  kivro_code,
  region,
  district,
  SUBSTRING(display_address, 1, 50) as address_preview,
  latitude,
  longitude,
  is_verified,
  updated_at
FROM kivro_addresses
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC
LIMIT 50;
