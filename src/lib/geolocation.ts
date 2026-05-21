// Geolocation utilities for KIVRO address generation
import { detectCountryFromPhone } from './africanPhoneValidation';

export interface GeolocationResult {
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface CountryValidationResult {
  isValid: boolean;
  userCountry: string;
  targetCountry: string;
  message: string;
}

// Supported countries with their approximate geographic boundaries (Africa + Iraq)
const AFRICAN_COUNTRIES_BOUNDARIES = {
  // Middle East - Iraq (Special Support)
  'IQ': { name: 'Iraq', lat: [29.07, 37.38], lng: [38.79, 48.57] },
  
  // African Countries
  'DZ': { name: 'Algeria', lat: [18.96, 37.09], lng: [-8.67, 11.99] },
  'AO': { name: 'Angola', lat: [-18.04, -4.39], lng: [11.68, 24.08] },
  'BJ': { name: 'Benin', lat: [6.21, 12.42], lng: [0.77, 3.85] },
  'BW': { name: 'Botswana', lat: [-26.91, -17.78], lng: [19.99, 29.36] },
  'BF': { name: 'Burkina Faso', lat: [9.40, 15.08], lng: [-5.52, 2.41] },
  'BI': { name: 'Burundi', lat: [-4.47, -2.31], lng: [28.99, 30.85] },
  'CV': { name: 'Cape Verde', lat: [14.80, 17.20], lng: [-25.36, -22.67] },
  'CM': { name: 'Cameroon', lat: [1.65, 13.08], lng: [8.49, 16.19] },
  'CF': { name: 'Central African Republic', lat: [2.22, 11.00], lng: [14.42, 27.46] },
  'TD': { name: 'Chad', lat: [7.44, 23.45], lng: [13.47, 24.00] },
  'KM': { name: 'Comoros', lat: [-12.42, -11.36], lng: [43.21, 44.54] },
  'CG': { name: 'Republic of Congo', lat: [-5.03, 3.71], lng: [11.09, 18.65] },
  'CD': { name: 'DR Congo', lat: [-13.46, 5.39], lng: [12.20, 31.31] },
  'CI': { name: 'Ivory Coast', lat: [4.36, 10.74], lng: [-8.60, -2.49] },
  'DJ': { name: 'Djibouti', lat: [10.93, 12.71], lng: [41.77, 43.42] },
  'EG': { name: 'Egypt', lat: [21.73, 31.67], lng: [24.70, 36.89] },
  'GQ': { name: 'Equatorial Guinea', lat: [-1.47, 2.35], lng: [5.62, 11.34] },
  'ER': { name: 'Eritrea', lat: [12.36, 18.00], lng: [36.44, 43.13] },
  'SZ': { name: 'Eswatini', lat: [-27.32, -25.72], lng: [30.79, 32.14] },
  'ET': { name: 'Ethiopia', lat: [3.40, 14.89], lng: [32.99, 47.99] },
  'GA': { name: 'Gabon', lat: [-3.98, 2.32], lng: [8.70, 14.50] },
  'GM': { name: 'Gambia', lat: [13.06, 13.83], lng: [-16.82, -13.80] },
  'GH': { name: 'Ghana', lat: [4.74, 11.17], lng: [-3.26, 1.19] },
  'GN': { name: 'Guinea', lat: [7.19, 12.68], lng: [-15.13, -7.65] },
  'GW': { name: 'Guinea-Bissau', lat: [10.92, 12.68], lng: [-16.72, -13.64] },
  'KE': { name: 'Kenya', lat: [-4.68, 5.51], lng: [33.91, 41.91] },
  'LS': { name: 'Lesotho', lat: [-30.67, -28.57], lng: [27.01, 29.46] },
  'LR': { name: 'Liberia', lat: [4.35, 8.55], lng: [-11.49, -7.37] },
  'LY': { name: 'Libya', lat: [19.50, 33.17], lng: [9.38, 25.16] },
  'MG': { name: 'Madagascar', lat: [-25.61, -11.95], lng: [43.25, 50.48] },
  'MW': { name: 'Malawi', lat: [-17.13, -9.37], lng: [32.67, 35.92] },
  'ML': { name: 'Mali', lat: [10.16, 25.00], lng: [-12.24, 4.27] },
  'MR': { name: 'Mauritania', lat: [14.72, 27.30], lng: [-17.07, -4.83] },
  'MU': { name: 'Mauritius', lat: [-20.52, -19.99], lng: [57.31, 57.79] },
  'MA': { name: 'Morocco', lat: [21.42, 35.92], lng: [-17.02, -1.12] },
  'MZ': { name: 'Mozambique', lat: [-26.87, -10.47], lng: [30.22, 40.84] },
  'NA': { name: 'Namibia', lat: [-28.97, -16.96], lng: [11.73, 25.26] },
  'NE': { name: 'Niger', lat: [11.69, 23.52], lng: [0.17, 15.99] },
  'NG': { name: 'Nigeria', lat: [4.27, 13.89], lng: [2.67, 14.68] },
  'RW': { name: 'Rwanda', lat: [-2.84, -1.05], lng: [28.86, 30.90] },
  'ST': { name: 'Sao Tome and Principe', lat: [-0.02, 1.70], lng: [6.46, 7.46] },
  'SN': { name: 'Senegal', lat: [12.31, 16.69], lng: [-17.54, -11.35] },
  'SC': { name: 'Seychelles', lat: [-10.42, -3.71], lng: [46.20, 56.30] },
  'SL': { name: 'Sierra Leone', lat: [6.93, 10.05], lng: [-13.31, -10.27] },
  'SO': { name: 'Somalia', lat: [-1.68, 12.02], lng: [40.99, 51.41] },
  'ZA': { name: 'South Africa', lat: [-34.84, -22.13], lng: [16.45, 32.89] },
  'SS': { name: 'South Sudan', lat: [3.49, 12.25], lng: [23.89, 35.95] },
  'SD': { name: 'Sudan', lat: [8.68, 22.23], lng: [21.83, 38.61] },
  'TZ': { name: 'Tanzania', lat: [-11.76, -0.99], lng: [29.34, 40.44] },
  'TG': { name: 'Togo', lat: [6.11, 11.14], lng: [-0.15, 1.81] },
  'TN': { name: 'Tunisia', lat: [30.23, 37.54], lng: [7.52, 11.60] },
  'UG': { name: 'Uganda', lat: [-1.48, 4.22], lng: [29.57, 35.00] },
  'ZM': { name: 'Zambia', lat: [-18.08, -8.22], lng: [21.99, 33.71] },
  'ZW': { name: 'Zimbabwe', lat: [-22.42, -15.61], lng: [25.24, 33.06] }
};

// Phone code to country code mapping (Africa + Iraq)
const PHONE_TO_COUNTRY_CODE: { [key: string]: string } = {
  // Middle East
  '+964': 'IQ',
  // Africa
  '+213': 'DZ', '+244': 'AO', '+229': 'BJ', '+267': 'BW', '+226': 'BF',
  '+257': 'BI', '+238': 'CV', '+237': 'CM', '+236': 'CF', '+235': 'TD',
  '+269': 'KM', '+242': 'CG', '+243': 'CD', '+225': 'CI', '+253': 'DJ',
  '+20': 'EG', '+240': 'GQ', '+291': 'ER', '+268': 'SZ', '+251': 'ET',
  '+241': 'GA', '+220': 'GM', '+233': 'GH', '+224': 'GN', '+245': 'GW',
  '+254': 'KE', '+266': 'LS', '+231': 'LR', '+218': 'LY', '+261': 'MG',
  '+265': 'MW', '+223': 'ML', '+222': 'MR', '+230': 'MU', '+212': 'MA',
  '+258': 'MZ', '+264': 'NA', '+227': 'NE', '+234': 'NG', '+250': 'RW',
  '+239': 'ST', '+221': 'SN', '+248': 'SC', '+232': 'SL', '+252': 'SO',
  '+27': 'ZA', '+211': 'SS', '+249': 'SD', '+255': 'TZ', '+228': 'TG',
  '+216': 'TN', '+256': 'UG', '+260': 'ZM', '+263': 'ZW'
};

/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          // Try to get country from coordinates
          const country = await getCountryFromCoordinates(latitude, longitude);
          resolve({
            country: country.name,
            countryCode: country.code,
            latitude,
            longitude,
            accuracy
          });
        } catch (error) {
          // Fallback: determine country from coordinates using boundaries
          const country = getCountryFromBoundaries(latitude, longitude);
          resolve({
            country: country.name,
            countryCode: country.code,
            latitude,
            longitude,
            accuracy
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * Get country from coordinates using reverse geocoding API
 */
const getCountryFromCoordinates = async (lat: number, lng: number): Promise<{ name: string; code: string }> => {
  try {
    // Using a free geocoding service (you can replace with your preferred service)
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    const countryCode = data.countryCode;
    const countryName = data.countryName;
    
    if (countryCode && AFRICAN_COUNTRIES_BOUNDARIES[countryCode]) {
      return {
        name: countryName,
        code: countryCode
      };
    }
    
    throw new Error('Country not found in African boundaries');
  } catch (error) {
    throw new Error('Failed to get country from coordinates');
  }
};

/**
 * Determine country from coordinates using predefined boundaries (fallback)
 */
const getCountryFromBoundaries = (lat: number, lng: number): { name: string; code: string } => {
  for (const [code, country] of Object.entries(AFRICAN_COUNTRIES_BOUNDARIES)) {
    const { lat: latRange, lng: lngRange } = country;
    
    if (lat >= latRange[0] && lat <= latRange[1] && 
        lng >= lngRange[0] && lng <= lngRange[1]) {
      return {
        name: country.name,
        code: code
      };
    }
  }
  
  // Default fallback - could be outside Africa
  return {
    name: 'Unknown',
    code: 'XX'
  };
};

/**
 * Validate if user is in the correct country for address generation
 */
export const validateUserLocation = async (phoneNumber: string): Promise<CountryValidationResult> => {
  try {
    // Get target country from phone number
    const phoneValidation = detectCountryFromPhone(phoneNumber);
    if (!phoneValidation.isValid || !phoneValidation.country) {
      return {
        isValid: true, // Allow - phone validation will catch this
        userCountry: 'Unknown',
        targetCountry: 'Unknown',
        message: 'Invalid phone number - cannot determine target country'
      };
    }

    const targetCountry = phoneValidation.country;
    const targetCountryCode = PHONE_TO_COUNTRY_CODE[phoneValidation.countryCode || ''];

    // Get user's current location
    const userLocation = await getCurrentLocation();
    const userCountry = userLocation.country;
    const userCountryCode = userLocation.countryCode;

    // If we couldn't determine user's location, allow with warning
    if (userCountry === 'Unknown' || userCountryCode === 'XX') {
      return {
        isValid: true, // Allow - can't confirm mismatch
        userCountry: 'Unknown',
        targetCountry,
        message: `⚠️ Unable to verify your location. Generating address for ${targetCountry}. Please ensure you're at the correct location.`
      };
    }

    // Check if user is in the target country
    const isValid = userCountryCode === targetCountryCode;

    return {
      isValid,
      userCountry,
      targetCountry,
      message: isValid 
        ? `✅ Location verified: You are in ${targetCountry}`
        : `❌ Location mismatch: You are currently in ${userCountry}, but trying to generate an address for ${targetCountry}`
    };
  } catch (error) {
    
    // If location services fail, we'll allow the request but warn the user
    return {
      isValid: true, // Allow request to proceed
      userCountry: 'Unknown',
      targetCountry: 'Unknown',
      message: `⚠️ Unable to verify your location: ${error instanceof Error ? error.message : 'Location services unavailable'}. Address generation will proceed.`
    };
  }
};

/**
 * Get country name from phone number for display purposes
 */
export const getCountryFromPhoneNumber = (phoneNumber: string): string => {
  const phoneValidation = detectCountryFromPhone(phoneNumber);
  return phoneValidation.country || 'Unknown Country';
};

/**
 * Check if coordinates are within African continent
 */
export const isInAfrica = (latitude: number, longitude: number): boolean => {
  // Rough boundaries of African continent
  const africaBounds = {
    north: 37.5,
    south: -35,
    east: 52,
    west: -18
  };

  return latitude >= africaBounds.south && 
         latitude <= africaBounds.north && 
         longitude >= africaBounds.west && 
         longitude <= africaBounds.east;
};

/**
 * Get user's approximate location without full geolocation (using IP-based service)
 */
export const getApproximateLocation = async (): Promise<{ country: string; countryCode: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'XX'
    };
  } catch (error) {
    return {
      country: 'Unknown',
      countryCode: 'XX'
    };
  }
};
