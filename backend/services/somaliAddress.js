const { supabase } = require('../config/supabase');

class SomaliAddressService {
  constructor() {
    // Somali phone number prefixes
    this.somaliPrefixes = [
      '252', // Somalia country code
      '25261', '25262', '25263', '25264', '25265', '25266', '25267', '25268', '25269', // Somtel
      '25290', '25291', '25292', '25293', '25294', '25295', '25296', '25297', '25298', '25299', // Hormuud
      '25271', '25272', '25273', '25274', '25275', '25276', '25277', '25278', '25279', // Golis
      '25281', '25282', '25283', '25284', '25285', '25286', '25287', '25288', '25289'  // Telesom
    ];
  }

  // Check if phone number is Somali
  isSomaliPhoneNumber(phoneNumber) {
    // Remove all non-digits
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if starts with Somalia country code
    if (cleanNumber.startsWith('252')) {
      return true;
    }
    
    // Check if starts with 0 and could be local format
    if (cleanNumber.startsWith('0') && cleanNumber.length >= 9) {
      const withCountryCode = '252' + cleanNumber.substring(1);
      return this.somaliPrefixes.some(prefix => withCountryCode.startsWith(prefix));
    }
    
    return false;
  }

  // Format phone number to international format
  formatSomaliPhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('252')) {
      return cleanNumber;
    }
    
    if (cleanNumber.startsWith('0')) {
      return '252' + cleanNumber.substring(1);
    }
    
    // Assume it's local format without leading 0
    return '252' + cleanNumber;
  }

  // Get random Somali district based on phone prefix or random selection
  async getRandomSomaliDistrict(phoneNumber = null) {
    try {
      let query = supabase
        .from('somali_postal_codes')
        .select('*');

      // If we have a phone number, try to determine region preference
      if (phoneNumber) {
        const formattedNumber = this.formatSomaliPhoneNumber(phoneNumber);
        
        // Simple heuristic: different prefixes for different regions
        if (formattedNumber.includes('61') || formattedNumber.includes('62')) {
          // Somtel - prefer Somaliland
          query = query.eq('prefix', 'SL');
        } else if (formattedNumber.includes('90') || formattedNumber.includes('91')) {
          // Hormuud - prefer South/Central Somalia
          query = query.in('prefix', ['SW', 'HS', 'GM', 'BN']);
        } else if (formattedNumber.includes('71') || formattedNumber.includes('72')) {
          // Golis - prefer Puntland
          query = query.eq('prefix', 'PL');
        } else if (formattedNumber.includes('81') || formattedNumber.includes('82')) {
          // Telesom - prefer Somaliland
          query = query.eq('prefix', 'SL');
        }
      }

      const { data: districts, error } = await query;

      if (error) {
        // Fallback to a default district
        return {
          district: 'Hargeisa',
          postal_code: 'SL-100',
          federal_member_state: 'Somaliland',
          region: 'Maroodi Jeex'
        };
      }

      if (!districts || districts.length === 0) {
        // Fallback to all districts if filtered query returns nothing
        const { data: allDistricts } = await supabase
          .from('somali_postal_codes')
          .select('*');
        
        if (allDistricts && allDistricts.length > 0) {
          const randomIndex = Math.floor(Math.random() * allDistricts.length);
          return allDistricts[randomIndex];
        }
        
        // Final fallback
        return {
          district: 'Hargeisa',
          postal_code: 'SL-100',
          federal_member_state: 'Somaliland',
          region: 'Maroodi Jeex'
        };
      }

      // Select random district from filtered results
      const randomIndex = Math.floor(Math.random() * districts.length);
      return districts[randomIndex];

    } catch (error) {
      return {
        district: 'Hargeisa',
        postal_code: 'SL-100',
        federal_member_state: 'Somaliland',
        region: 'Maroodi Jeex'
      };
    }
  }

  // Generate Somali address in the format: "KV -P.O Box [phone_number] [location/landmark] like Mogadishu"
  async generateSomaliAddress(phoneNumber, userFullName = null, landmark = null, geocodedLocation = null) {
    try {
      const formattedPhone = this.formatSomaliPhoneNumber(phoneNumber);
      
      // Prioritize geocoded location data over phone prefix guessing
      let district, districtName, region, federalMemberState, postalCode, latitude, longitude;
      
      if (geocodedLocation && geocodedLocation.city) {
        // Validate coordinates are within Somalia bounds
        const validation = this.validateSomaliaCoordinates(
          geocodedLocation.latitude, 
          geocodedLocation.longitude
        );
        
        if (!validation.valid) {
          // Fall through to phone prefix guessing
          district = await this.getRandomSomaliDistrict(phoneNumber);
          districtName = district.district;
          region = district.region;
          federalMemberState = district.federal_member_state;
          postalCode = district.postal_code;
          latitude = this.getDistrictCoordinates(districtName).lat;
          longitude = this.getDistrictCoordinates(districtName).lng;
        } else {
          // Use actual GPS-derived location data
          districtName = geocodedLocation.city;
          region = geocodedLocation.region || districtName;
          
          // Determine federal member state and postal code based on actual location
          const locationInfo = this.getLocationInfoFromCity(districtName);
          federalMemberState = locationInfo.federal_member_state;
          postalCode = locationInfo.postal_code;
          
          latitude = validation.latitude;
          longitude = validation.longitude;
          
        }
      } else {
        // Fallback to phone prefix guessing only if no GPS data
        district = await this.getRandomSomaliDistrict(phoneNumber);
        districtName = district.district;
        region = district.region;
        federalMemberState = district.federal_member_state;
        postalCode = district.postal_code;
        latitude = this.getDistrictCoordinates(districtName).lat;
        longitude = this.getDistrictCoordinates(districtName).lng;
      }
      
      // Create the address in the new KIVRO format: KV -P.O Box 252610000000 Blue kiosk near Central Mosque Mogadishu
      const landmarkText = landmark || `Near ${districtName} Central Area`;
      const addressLine = `KV -P.O Box ${formattedPhone} ${landmarkText} ${districtName}`;
      
      // Create a unique Kivro code for Somali addresses
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const prefix = this.getPrefixFromFederalState(federalMemberState);
      const kivroCode = `KV-${prefix}-${randomSuffix}-${timestamp.toString().slice(-4)}`;

      return {
        kivro_code: kivroCode,
        display_address: addressLine,
        region: region,
        district: districtName,
        landmark: landmarkText,
        federal_member_state: federalMemberState,
        postal_code: postalCode,
        country: 'Somalia',
        phone_number: formattedPhone,
        latitude: latitude,
        longitude: longitude,
        is_active: true,
        address_type: 'somali_postal'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get location info (federal state, postal code) from city name
  getLocationInfoFromCity(cityName) {
    const locationMap = {
      // Somaliland cities
      'Hargeisa': { federal_member_state: 'Somaliland', postal_code: 'SL-100', prefix: 'SL' },
      'Berbera': { federal_member_state: 'Somaliland', postal_code: 'SL-200', prefix: 'SL' },
      'Burao': { federal_member_state: 'Somaliland', postal_code: 'SL-300', prefix: 'SL' },
      'Borama': { federal_member_state: 'Somaliland', postal_code: 'SL-400', prefix: 'SL' },
      'Erigavo': { federal_member_state: 'Somaliland', postal_code: 'SL-500', prefix: 'SL' },
      
      // Puntland cities
      'Bosaso': { federal_member_state: 'Puntland', postal_code: 'PL-100', prefix: 'PL' },
      'Garowe': { federal_member_state: 'Puntland', postal_code: 'PL-200', prefix: 'PL' },
      'Galkayo North': { federal_member_state: 'Puntland', postal_code: 'PL-300', prefix: 'PL' },
      'Qardho': { federal_member_state: 'Puntland', postal_code: 'PL-400', prefix: 'PL' },
      
      // South/Central Somalia cities
      'Mogadishu': { federal_member_state: 'Banadir', postal_code: 'BN-100', prefix: 'BN' },
      'Kismayo': { federal_member_state: 'Jubaland', postal_code: 'JL-100', prefix: 'JL' },
      'Baidoa': { federal_member_state: 'South West', postal_code: 'SW-100', prefix: 'SW' },
      'Jowhar': { federal_member_state: 'Hirshabelle', postal_code: 'HS-100', prefix: 'HS' },
      'Beledweyne': { federal_member_state: 'Hirshabelle', postal_code: 'HS-200', prefix: 'HS' },
      'Marka': { federal_member_state: 'South West', postal_code: 'SW-200', prefix: 'SW' },
      'Galkayo': { federal_member_state: 'Galmudug', postal_code: 'GM-100', prefix: 'GM' }
    };

    // Try exact match first
    if (locationMap[cityName]) {
      return locationMap[cityName];
    }

    // Try partial match (case-insensitive)
    const cityLower = cityName.toLowerCase();
    for (const [key, value] of Object.entries(locationMap)) {
      if (key.toLowerCase().includes(cityLower) || cityLower.includes(key.toLowerCase())) {
        return value;
      }
    }

    // Default to Banadir (Mogadishu region) for unknown South/Central locations
    return { federal_member_state: 'Banadir', postal_code: 'BN-100', prefix: 'BN' };
  }

  // Get prefix code from federal member state
  getPrefixFromFederalState(federalState) {
    const prefixMap = {
      'Somaliland': 'SL',
      'Puntland': 'PL',
      'Banadir': 'BN',
      'Jubaland': 'JL',
      'South West': 'SW',
      'Hirshabelle': 'HS',
      'Galmudug': 'GM'
    };
    return prefixMap[federalState] || 'SO';
  }


  // Validate if coordinates are within Somalia bounds
  validateSomaliaCoordinates(latitude, longitude) {
    // Somalia geographic bounds
    const SOMALIA_BOUNDS = {
      minLat: -1.8,    // Southern border (near Kenya)
      maxLat: 12.0,    // Northern border
      minLng: 40.8,    // Western border (Ethiopia/Kenya)
      maxLng: 51.5     // Eastern border (Indian Ocean)
    };

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Check if coordinates are valid numbers
    if (isNaN(lat) || isNaN(lng)) {
      return {
        valid: false,
        error: 'Invalid coordinate format',
        message: 'Latitude and longitude must be valid numbers'
      };
    }

    // Check if within Somalia bounds
    if (lat < SOMALIA_BOUNDS.minLat || lat > SOMALIA_BOUNDS.maxLat ||
        lng < SOMALIA_BOUNDS.minLng || lng > SOMALIA_BOUNDS.maxLng) {
      return {
        valid: false,
        error: 'Coordinates outside Somalia',
        message: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) are outside Somalia's geographic boundaries`,
        providedCoords: { latitude: lat, longitude: lng },
        somaliBounds: SOMALIA_BOUNDS
      };
    }

    return {
      valid: true,
      latitude: lat,
      longitude: lng
    };
  }

  // Get approximate coordinates for major Somali cities/districts
  getDistrictCoordinates(district) {
    const coordinates = {
      // Somaliland
      'Hargeisa': { lat: 9.5600, lng: 44.0650 },
      'Berbera': { lat: 10.4396, lng: 45.0143 },
      'Burao': { lat: 9.5226, lng: 45.5347 },
      'Borama': { lat: 9.9370, lng: 43.2156 },
      'Erigavo': { lat: 10.6186, lng: 47.3671 },
      
      // Puntland
      'Bosaso': { lat: 11.2842, lng: 49.1816 },
      'Garowe': { lat: 8.4020, lng: 48.4845 },
      'Galkayo North': { lat: 6.7697, lng: 47.4307 },
      'Qardho': { lat: 9.4942, lng: 49.0647 },
      
      // South/Central Somalia
      'Mogadishu': { lat: 2.0469, lng: 45.3182 },
      'Kismayo': { lat: -0.3582, lng: 42.5454 },
      'Baidoa': { lat: 3.1140, lng: 43.6498 },
      'Jowhar': { lat: 2.7727, lng: 45.5019 },
      'Beledweyne': { lat: 4.7361, lng: 45.2061 },
      'Marka': { lat: 1.7151, lng: 44.7710 },
      
      // Default coordinates (Mogadishu)
      'default': { lat: 2.0469, lng: 45.3182 }
    };

    return coordinates[district] || coordinates['default'];
  }

  // Validate if an address is a valid Somali format
  isValidSomaliAddress(address) {
    const somaliPattern = /^P\.O Box \d+,\s*[A-Za-z\s]+,\s*[A-Z]{2}-\d{3}$/;
    return somaliPattern.test(address);
  }
}

module.exports = new SomaliAddressService();
