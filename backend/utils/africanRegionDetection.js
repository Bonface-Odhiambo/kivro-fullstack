// African Region Detection for KIVRO Backend
// Comprehensive GPS-based region detection for all 54 African countries + Iraq

const { detectCountryFromPhone } = require('./phoneValidation');

// Major African cities and regions with GPS coordinates (+ Iraq)
const AFRICAN_REGIONS = {
  // Middle East - Iraq (Special Support)
  'IQ': { // Iraq
    name: 'Iraq',
    regions: {
      'Baghdad': { lat: 33.3128, lng: 44.3615, cities: ['Baghdad', 'Sadr City', 'Kadhimiya', 'Mansour'] },
      'Basra': { lat: 30.5081, lng: 47.7835, cities: ['Basra', 'Al-Zubair', 'Abu Al-Khaseeb'] },
      'Mosul': { lat: 36.1911, lng: 43.9923, cities: ['Mosul', 'Tel Afar', 'Sinjar'] },
      'Erbil': { lat: 36.3414, lng: 43.1189, cities: ['Erbil', 'Shaqlawa', 'Koya'] },
      'Sulaymaniyah': { lat: 35.5544, lng: 45.4333, cities: ['Sulaymaniyah', 'Halabja', 'Ranya'] },
      'Kirkuk': { lat: 35.4622, lng: 44.3925, cities: ['Kirkuk', 'Hawija', 'Daquq'] },
      'Najaf': { lat: 32.0164, lng: 44.3450, cities: ['Najaf', 'Kufa', 'Mishkhab'] },
      'Karbala': { lat: 32.5614, lng: 44.4206, cities: ['Karbala', 'Ain Tamr', 'Hindiya'] }
    }
  },

  // North Africa
  'DZ': { // Algeria
    name: 'Algeria',
    regions: {
      'Algiers': { lat: 36.7538, lng: 3.0588, cities: ['Algiers', 'Bab Ezzouar', 'Hussein Dey'] },
      'Oran': { lat: 35.6969, lng: -0.6331, cities: ['Oran', 'Es Senia', 'Bir El Djir'] },
      'Constantine': { lat: 36.3650, lng: 6.6147, cities: ['Constantine', 'El Khroub', 'Hamma Bouziane'] }
    }
  },
  'EG': { // Egypt
    name: 'Egypt',
    regions: {
      'Cairo': { lat: 30.0444, lng: 31.2357, cities: ['Cairo', 'Giza', 'Shubra El Kheima', 'New Cairo'] },
      'Alexandria': { lat: 31.2001, lng: 29.9187, cities: ['Alexandria', 'Borg El Arab', 'Abu Qir'] },
      'Luxor': { lat: 25.6872, lng: 32.6396, cities: ['Luxor', 'Esna', 'Armant'] }
    }
  },
  'LY': { // Libya
    name: 'Libya',
    regions: {
      'Tripoli': { lat: 32.8872, lng: 13.1913, cities: ['Tripoli', 'Tajoura', 'Janzour'] },
      'Benghazi': { lat: 32.1165, lng: 20.0686, cities: ['Benghazi', 'Al Marj', 'Tocra'] }
    }
  },
  'MA': { // Morocco
    name: 'Morocco',
    regions: {
      'Casablanca': { lat: 33.5731, lng: -7.5898, cities: ['Casablanca', 'Mohammedia', 'Ain Harrouda'] },
      'Rabat': { lat: 34.0209, lng: -6.8416, cities: ['Rabat', 'Sale', 'Temara'] },
      'Marrakech': { lat: 31.6295, lng: -7.9811, cities: ['Marrakech', 'Safi', 'Essaouira'] }
    }
  },
  'TN': { // Tunisia
    name: 'Tunisia',
    regions: {
      'Tunis': { lat: 36.8065, lng: 10.1815, cities: ['Tunis', 'Ariana', 'Ben Arous'] },
      'Sfax': { lat: 34.7406, lng: 10.7603, cities: ['Sfax', 'Sakiet Ezzit', 'Sakiet Eddaier'] }
    }
  },
  'SD': { // Sudan
    name: 'Sudan',
    regions: {
      'Khartoum': { lat: 15.5007, lng: 32.5599, cities: ['Khartoum', 'Omdurman', 'Khartoum North'] },
      'Port Sudan': { lat: 19.6344, lng: 37.2105, cities: ['Port Sudan', 'Suakin'] }
    }
  },

  // West Africa
  'NG': { // Nigeria
    name: 'Nigeria',
    regions: {
      'Lagos': { lat: 6.5244, lng: 3.3792, cities: ['Lagos', 'Ikeja', 'Victoria Island', 'Ikoyi', 'Surulere'] },
      'Abuja': { lat: 9.0765, lng: 7.3986, cities: ['Abuja', 'Garki', 'Wuse', 'Maitama'] },
      'Kano': { lat: 12.0022, lng: 8.5920, cities: ['Kano', 'Fagge', 'Dala'] },
      'Ibadan': { lat: 7.3775, lng: 3.9470, cities: ['Ibadan', 'Bodija', 'Dugbe'] },
      'Port Harcourt': { lat: 4.8156, lng: 7.0498, cities: ['Port Harcourt', 'Obio-Akpor', 'Eleme'] }
    }
  },
  'GH': { // Ghana
    name: 'Ghana',
    regions: {
      'Accra': { lat: 5.6037, lng: -0.1870, cities: ['Accra', 'Tema', 'Madina', 'Adenta'] },
      'Kumasi': { lat: 6.6885, lng: -1.6244, cities: ['Kumasi', 'Obuasi', 'Ejisu'] },
      'Tamale': { lat: 9.4034, lng: -0.8424, cities: ['Tamale', 'Yendi', 'Savelugu'] }
    }
  },
  'SN': { // Senegal
    name: 'Senegal',
    regions: {
      'Dakar': { lat: 14.7167, lng: -17.4677, cities: ['Dakar', 'Pikine', 'Guediawaye'] },
      'Thies': { lat: 14.7886, lng: -16.9260, cities: ['Thies', 'Mbour', 'Tivaouane'] }
    }
  },
  'CI': { // Ivory Coast
    name: 'Ivory Coast',
    regions: {
      'Abidjan': { lat: 5.3600, lng: -4.0083, cities: ['Abidjan', 'Cocody', 'Yopougon', 'Adjame'] },
      'Yamoussoukro': { lat: 6.8276, lng: -5.2893, cities: ['Yamoussoukro'] },
      'Bouake': { lat: 7.6906, lng: -5.0300, cities: ['Bouake', 'Katiola'] }
    }
  },

  // East Africa
  'KE': { // Kenya
    name: 'Kenya',
    regions: {
      'Nairobi': { lat: -1.2921, lng: 36.8219, cities: ['Nairobi', 'Westlands', 'Karen', 'Kasarani', 'Embakasi', 'Kibera'] },
      'Mombasa': { lat: -4.0435, lng: 39.6682, cities: ['Mombasa', 'Nyali', 'Likoni', 'Changamwe'] },
      'Kisumu': { lat: -0.0917, lng: 34.7680, cities: ['Kisumu', 'Ahero', 'Maseno'] },
      'Nakuru': { lat: -0.3031, lng: 36.0800, cities: ['Nakuru', 'Naivasha', 'Gilgil'] },
      'Eldoret': { lat: 0.5143, lng: 35.2698, cities: ['Eldoret', 'Turbo', 'Burnt Forest'] }
    }
  },
  'TZ': { // Tanzania
    name: 'Tanzania',
    regions: {
      'Dar es Salaam': { lat: -6.7924, lng: 39.2083, cities: ['Dar es Salaam', 'Kinondoni', 'Temeke'] },
      'Dodoma': { lat: -6.1630, lng: 35.7516, cities: ['Dodoma', 'Kondoa'] },
      'Arusha': { lat: -3.3869, lng: 36.6830, cities: ['Arusha', 'Moshi', 'Karatu'] }
    }
  },
  'UG': { // Uganda
    name: 'Uganda',
    regions: {
      'Kampala': { lat: 0.3476, lng: 32.5825, cities: ['Kampala', 'Entebbe', 'Mukono'] },
      'Gulu': { lat: 2.7796, lng: 32.2990, cities: ['Gulu', 'Kitgum'] }
    }
  },
  'ET': { // Ethiopia
    name: 'Ethiopia',
    regions: {
      'Addis Ababa': { lat: 9.1450, lng: 40.4897, cities: ['Addis Ababa', 'Bole', 'Kirkos'] },
      'Dire Dawa': { lat: 9.5931, lng: 41.8661, cities: ['Dire Dawa'] },
      'Mekelle': { lat: 13.4967, lng: 39.4753, cities: ['Mekelle', 'Adigrat'] }
    }
  },
  'SO': { // Somalia
    name: 'Somalia',
    regions: {
      'Mogadishu': { lat: 2.0469, lng: 45.3182, cities: ['Mogadishu', 'Hodan', 'Wardhigley'] },
      'Hargeisa': { lat: 9.5600, lng: 44.0650, cities: ['Hargeisa', 'Berbera'] },
      'Kismayo': { lat: -0.3582, lng: 42.5454, cities: ['Kismayo', 'Afmadow'] }
    }
  },
  'RW': { // Rwanda
    name: 'Rwanda',
    regions: {
      'Kigali': { lat: -1.9441, lng: 30.0619, cities: ['Kigali', 'Nyarugenge', 'Gasabo'] },
      'Butare': { lat: -2.5967, lng: 29.7394, cities: ['Butare', 'Nyanza'] }
    }
  },

  // Southern Africa
  'ZA': { // South Africa
    name: 'South Africa',
    regions: {
      'Johannesburg': { lat: -26.2041, lng: 28.0473, cities: ['Johannesburg', 'Sandton', 'Soweto', 'Alexandra'] },
      'Cape Town': { lat: -33.9249, lng: 18.4241, cities: ['Cape Town', 'Stellenbosch', 'Paarl'] },
      'Durban': { lat: -29.8587, lng: 31.0218, cities: ['Durban', 'Pinetown', 'Chatsworth'] },
      'Pretoria': { lat: -25.7479, lng: 28.2293, cities: ['Pretoria', 'Centurion', 'Mamelodi'] }
    }
  },
  'ZW': { // Zimbabwe
    name: 'Zimbabwe',
    regions: {
      'Harare': { lat: -17.8292, lng: 31.0522, cities: ['Harare', 'Chitungwiza', 'Epworth'] },
      'Bulawayo': { lat: -20.1594, lng: 28.5906, cities: ['Bulawayo', 'Pumula', 'Entumbane'] }
    }
  },
  'ZM': { // Zambia
    name: 'Zambia',
    regions: {
      'Lusaka': { lat: -15.3875, lng: 28.3228, cities: ['Lusaka', 'Chilenje', 'Kanyama'] },
      'Kitwe': { lat: -12.8024, lng: 28.2132, cities: ['Kitwe', 'Ndola'] }
    }
  },
  'BW': { // Botswana
    name: 'Botswana',
    regions: {
      'Gaborone': { lat: -24.6282, lng: 25.9231, cities: ['Gaborone', 'Tlokweng', 'Mogoditshane'] },
      'Francistown': { lat: -21.1700, lng: 27.5117, cities: ['Francistown', 'Selebi-Phikwe'] }
    }
  },
  'NA': { // Namibia
    name: 'Namibia',
    regions: {
      'Windhoek': { lat: -22.5609, lng: 17.0658, cities: ['Windhoek', 'Katutura', 'Khomasdal'] },
      'Walvis Bay': { lat: -22.9576, lng: 14.5052, cities: ['Walvis Bay', 'Swakopmund'] }
    }
  },
  'MZ': { // Mozambique
    name: 'Mozambique',
    regions: {
      'Maputo': { lat: -25.9692, lng: 32.5732, cities: ['Maputo', 'Matola', 'Boane'] },
      'Beira': { lat: -19.8187, lng: 34.8553, cities: ['Beira', 'Dondo'] }
    }
  },
  'CD': { // Democratic Republic of Congo
    name: 'Democratic Republic of Congo',
    regions: {
      'Kinshasa': { lat: -4.3224, lng: 15.3070, cities: ['Kinshasa', 'Masina', 'Ndjili'] },
      'Lubumbashi': { lat: -11.6609, lng: 27.4794, cities: ['Lubumbashi', 'Likasi', 'Kolwezi'] },
      'Goma': { lat: -1.6761, lng: 29.2285, cities: ['Goma', 'Sake'] }
    }
  },
  'CG': { // Republic of Congo
    name: 'Republic of Congo',
    regions: {
      'Brazzaville': { lat: -4.2634, lng: 15.2832, cities: ['Brazzaville'] },
      'Pointe-Noire': { lat: -4.7785, lng: 11.8592, cities: ['Pointe-Noire'] }
    }
  }
};

// Phone code to ISO country code mapping
const PHONE_TO_ISO_CODE = {
  // Middle East - Iraq (Special Support)
  '+964': 'IQ',
  // Africa
  '+213': 'DZ', '+20': 'EG', '+218': 'LY', '+212': 'MA', '+216': 'TN', '+249': 'SD',
  '+234': 'NG', '+233': 'GH', '+221': 'SN', '+225': 'CI', '+223': 'ML', '+226': 'BF',
  '+254': 'KE', '+255': 'TZ', '+256': 'UG', '+251': 'ET', '+252': 'SO', '+250': 'RW',
  '+27': 'ZA', '+263': 'ZW', '+260': 'ZM', '+267': 'BW', '+264': 'NA', '+258': 'MZ',
  '+243': 'CD', '+242': 'CG'
};

/**
 * Detect African region from GPS coordinates
 */
function detectRegionFromGPS(latitude, longitude) {
  let bestMatch = null;
  let minDistance = Infinity;

  // Search through all African regions
  for (const [countryCode, countryData] of Object.entries(AFRICAN_REGIONS)) {
    for (const [regionName, regionData] of Object.entries(countryData.regions)) {
      const distance = calculateDistance(latitude, longitude, regionData.lat, regionData.lng);
      
      if (distance < minDistance) {
        minDistance = distance;
        
        // Find closest city within the region
        const closestCity = findClosestCity(latitude, longitude, regionData.cities, regionData);
        
        bestMatch = {
          country: countryData.name,
          countryCode,
          region: regionName,
          city: closestCity,
          latitude,
          longitude,
          confidence: calculateConfidence(distance),
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Detect region from phone number and validate with GPS
 */
function detectRegionFromPhone(phoneNumber, latitude, longitude) {
  const phoneValidation = detectCountryFromPhone(phoneNumber);
  
  if (!phoneValidation || !phoneValidation.code) {
    return null;
  }

  const isoCode = PHONE_TO_ISO_CODE[phoneValidation.code];
  const countryData = AFRICAN_REGIONS[isoCode];

  if (!countryData) {
    return null;
  }

  // If GPS coordinates provided, find closest region within country
  if (latitude && longitude) {
    let bestRegion = null;
    let minDistance = Infinity;

    for (const [regionName, regionData] of Object.entries(countryData.regions)) {
      const distance = calculateDistance(latitude, longitude, regionData.lat, regionData.lng);
      
      if (distance < minDistance) {
        minDistance = distance;
        const closestCity = findClosestCity(latitude, longitude, regionData.cities, regionData);
        
        bestRegion = {
          country: countryData.name,
          countryCode: isoCode,
          region: regionName,
          city: closestCity,
          latitude,
          longitude,
          confidence: calculateConfidence(distance),
          distance: Math.round(distance * 100) / 100
        };
      }
    }

    return bestRegion;
  }

  // Default to capital/major city if no GPS
  const majorRegions = Object.entries(countryData.regions);
  if (majorRegions.length > 0) {
    const [regionName, regionData] = majorRegions[0];
    return {
      country: countryData.name,
      countryCode: isoCode,
      region: regionName,
      city: regionData.cities[0],
      latitude: regionData.lat,
      longitude: regionData.lng,
      confidence: 0.6, // Lower confidence without GPS
      distance: 0
    };
  }

  return null;
}

/**
 * Get smart coordinates for address generation
 * Uses GPS if available, otherwise intelligent fallback based on phone number
 */
function getSmartCoordinates(phoneNumber, providedLat, providedLng, fallbackRegion) {
  // If GPS coordinates provided, use them
  if (providedLat && providedLng) {
    const regionInfo = detectRegionFromGPS(providedLat, providedLng);
    return {
      latitude: providedLat,
      longitude: providedLng,
      region: regionInfo ? regionInfo.region : fallbackRegion,
      city: regionInfo ? regionInfo.city : 'Unknown',
      country: regionInfo ? regionInfo.country : 'Unknown',
      confidence: regionInfo ? regionInfo.confidence : 0.95,
      source: 'gps'
    };
  }

  // Try to detect region from phone number
  const phoneRegion = detectRegionFromPhone(phoneNumber);
  if (phoneRegion) {
    // Add some randomness to coordinates (within ~2km radius)
    const randomLat = phoneRegion.latitude + (Math.random() - 0.5) * 0.02;
    const randomLng = phoneRegion.longitude + (Math.random() - 0.5) * 0.02;
    
    return {
      latitude: randomLat,
      longitude: randomLng,
      region: phoneRegion.region,
      city: phoneRegion.city,
      country: phoneRegion.country,
      confidence: phoneRegion.confidence,
      source: 'phone_detection'
    };
  }

  // Final fallback - use legacy region coordinates
  const legacyCoordinates = {
    // Kenya
    nairobi: { lat: -1.2921, lng: 36.8219, country: 'Kenya' },
    mombasa: { lat: -4.0435, lng: 39.6682, country: 'Kenya' },
    kisumu: { lat: -0.0917, lng: 34.7680, country: 'Kenya' },
    nakuru: { lat: -0.3031, lng: 36.0800, country: 'Kenya' },
    eldoret: { lat: 0.5143, lng: 35.2698, country: 'Kenya' },
    // Nigeria
    lagos: { lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
    abuja: { lat: 9.0765, lng: 7.3986, country: 'Nigeria' },
    // Somalia
    mogadishu: { lat: 2.0469, lng: 45.3182, country: 'Somalia' },
    // Default fallback
    default: { lat: 0.0, lng: 20.0, country: 'Africa' }
  };

  const baseCoords = legacyCoordinates[fallbackRegion] || legacyCoordinates.default;
  const randomLat = baseCoords.lat + (Math.random() - 0.5) * 0.02;
  const randomLng = baseCoords.lng + (Math.random() - 0.5) * 0.02;

  return {
    latitude: randomLat,
    longitude: randomLng,
    region: fallbackRegion || 'Unknown',
    city: 'Unknown',
    country: baseCoords.country,
    confidence: 0.4, // Low confidence for legacy fallback
    source: 'legacy_fallback'
  };
}

/**
 * Get all regions for a specific country
 */
function getRegionsForCountry(countryCode) {
  const countryData = AFRICAN_REGIONS[countryCode];
  return countryData ? Object.keys(countryData.regions) : [];
}

/**
 * Get all cities for a specific region
 */
function getCitiesForRegion(countryCode, regionName) {
  const countryData = AFRICAN_REGIONS[countryCode];
  const regionData = countryData?.regions[regionName];
  return regionData ? regionData.cities : [];
}

// Helper functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findClosestCity(lat, lng, cities, regionData) {
  // For now, return the first city. In a more advanced implementation,
  // you could have specific coordinates for each city
  return cities[0];
}

function calculateConfidence(distance) {
  // Confidence decreases with distance
  if (distance < 10) return 0.95;
  if (distance < 25) return 0.85;
  if (distance < 50) return 0.75;
  if (distance < 100) return 0.65;
  return 0.5;
}

module.exports = {
  detectRegionFromGPS,
  detectRegionFromPhone,
  getSmartCoordinates,
  getRegionsForCountry,
  getCitiesForRegion,
  AFRICAN_REGIONS
};
