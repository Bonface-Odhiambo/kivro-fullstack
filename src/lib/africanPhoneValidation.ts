// Comprehensive phone validation for all African countries + Iraq

export interface AfricanCountry {
  name: string;
  isoCode: string;
  phoneCode: string;
  phoneFormat: string;
  phoneLengthMin: number;
  phoneLengthMax: number;
  flag: string;
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  // Middle East - Iraq (Special Support)
  { name: 'Iraq', isoCode: 'IRQ', phoneCode: '+964', phoneFormat: '0XXX XXX XXXX', phoneLengthMin: 10, phoneLengthMax: 10, flag: '🇮🇶' },
  
  // North Africa
  { name: 'Algeria', isoCode: 'DZA', phoneCode: '+213', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇩🇿' },
  { name: 'Egypt', isoCode: 'EGY', phoneCode: '+20', phoneFormat: '0XX XXXX XXXX', phoneLengthMin: 10, phoneLengthMax: 10, flag: '🇪🇬' },
  { name: 'Libya', isoCode: 'LBY', phoneCode: '+218', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇱🇾' },
  { name: 'Morocco', isoCode: 'MAR', phoneCode: '+212', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇲🇦' },
  { name: 'Tunisia', isoCode: 'TUN', phoneCode: '+216', phoneFormat: 'XX XXX XXX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇹🇳' },
  { name: 'Sudan', isoCode: 'SDN', phoneCode: '+249', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇸🇩' },
  
  // West Africa
  { name: 'Nigeria', isoCode: 'NGA', phoneCode: '+234', phoneFormat: '0XXX XXX XXXX', phoneLengthMin: 10, phoneLengthMax: 11, flag: '🇳🇬' },
  { name: 'Ghana', isoCode: 'GHA', phoneCode: '+233', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇬🇭' },
  { name: 'Senegal', isoCode: 'SEN', phoneCode: '+221', phoneFormat: 'XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇸🇳' },
  { name: 'Ivory Coast', isoCode: 'CIV', phoneCode: '+225', phoneFormat: 'XX XX XX XX XX', phoneLengthMin: 10, phoneLengthMax: 10, flag: '🇨🇮' },
  { name: 'Mali', isoCode: 'MLI', phoneCode: '+223', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇲🇱' },
  { name: 'Burkina Faso', isoCode: 'BFA', phoneCode: '+226', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇧🇫' },
  { name: 'Niger', isoCode: 'NER', phoneCode: '+227', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇳🇪' },
  { name: 'Guinea', isoCode: 'GIN', phoneCode: '+224', phoneFormat: 'XXX XX XX XX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇬🇳' },
  { name: 'Benin', isoCode: 'BEN', phoneCode: '+229', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇧🇯' },
  { name: 'Togo', isoCode: 'TGO', phoneCode: '+228', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇹🇬' },
  { name: 'Sierra Leone', isoCode: 'SLE', phoneCode: '+232', phoneFormat: 'XX XXX XXX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇸🇱' },
  { name: 'Liberia', isoCode: 'LBR', phoneCode: '+231', phoneFormat: 'XX XXX XXXX', phoneLengthMin: 7, phoneLengthMax: 9, flag: '🇱🇷' },
  { name: 'Mauritania', isoCode: 'MRT', phoneCode: '+222', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇲🇷' },
  { name: 'Gambia', isoCode: 'GMB', phoneCode: '+220', phoneFormat: 'XXX XXXX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇬🇲' },
  { name: 'Guinea-Bissau', isoCode: 'GNB', phoneCode: '+245', phoneFormat: 'XXX XXXX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇬🇼' },
  { name: 'Cape Verde', isoCode: 'CPV', phoneCode: '+238', phoneFormat: 'XXX XX XX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇨🇻' },
  
  // East Africa
  { name: 'Kenya', isoCode: 'KEN', phoneCode: '+254', phoneFormat: '0XXX XXXXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇰🇪' },
  { name: 'Tanzania', isoCode: 'TZA', phoneCode: '+255', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇹🇿' },
  { name: 'Uganda', isoCode: 'UGA', phoneCode: '+256', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇺🇬' },
  { name: 'Ethiopia', isoCode: 'ETH', phoneCode: '+251', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇪🇹' },
  { name: 'Somalia', isoCode: 'SOM', phoneCode: '+252', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 8, phoneLengthMax: 9, flag: '🇸🇴' },
  { name: 'Rwanda', isoCode: 'RWA', phoneCode: '+250', phoneFormat: '0XXX XXX XXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇷🇼' },
  { name: 'Burundi', isoCode: 'BDI', phoneCode: '+257', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇧🇮' },
  { name: 'Djibouti', isoCode: 'DJI', phoneCode: '+253', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇩🇯' },
  { name: 'Eritrea', isoCode: 'ERI', phoneCode: '+291', phoneFormat: 'X XXX XXX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇪🇷' },
  { name: 'South Sudan', isoCode: 'SSD', phoneCode: '+211', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇸🇸' },
  
  // Southern Africa
  { name: 'South Africa', isoCode: 'ZAF', phoneCode: '+27', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇿🇦' },
  { name: 'Zimbabwe', isoCode: 'ZWE', phoneCode: '+263', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇿🇼' },
  { name: 'Zambia', isoCode: 'ZMB', phoneCode: '+260', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇿🇲' },
  { name: 'Mozambique', isoCode: 'MOZ', phoneCode: '+258', phoneFormat: '0XX XXX XXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇲🇿' },
  { name: 'Botswana', isoCode: 'BWA', phoneCode: '+267', phoneFormat: 'XX XXX XXX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇧🇼' },
  { name: 'Namibia', isoCode: 'NAM', phoneCode: '+264', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇳🇦' },
  { name: 'Malawi', isoCode: 'MWI', phoneCode: '+265', phoneFormat: '0XXX XX XX XX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇲🇼' },
  { name: 'Lesotho', isoCode: 'LSO', phoneCode: '+266', phoneFormat: 'XX XXX XXX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇱🇸' },
  { name: 'Eswatini', isoCode: 'SWZ', phoneCode: '+268', phoneFormat: 'XX XX XXXX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇸🇿' },
  { name: 'Madagascar', isoCode: 'MDG', phoneCode: '+261', phoneFormat: '0XX XX XXX XX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇲🇬' },
  { name: 'Mauritius', isoCode: 'MUS', phoneCode: '+230', phoneFormat: 'XXXX XXXX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇲🇺' },
  { name: 'Seychelles', isoCode: 'SYC', phoneCode: '+248', phoneFormat: 'X XX XX XX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇸🇨' },
  { name: 'Comoros', isoCode: 'COM', phoneCode: '+269', phoneFormat: 'XXX XX XX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇰🇲' },
  
  // Central Africa
  { name: 'Democratic Republic of Congo', isoCode: 'COD', phoneCode: '+243', phoneFormat: '0XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 10, flag: '🇨🇩' },
  { name: 'Angola', isoCode: 'AGO', phoneCode: '+244', phoneFormat: '0XX XXX XXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇦🇴' },
  { name: 'Cameroon', isoCode: 'CMR', phoneCode: '+237', phoneFormat: 'X XX XX XX XX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇨🇲' },
  { name: 'Chad', isoCode: 'TCD', phoneCode: '+235', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇹🇩' },
  { name: 'Central African Republic', isoCode: 'CAF', phoneCode: '+236', phoneFormat: 'XX XX XX XX', phoneLengthMin: 8, phoneLengthMax: 8, flag: '🇨🇫' },
  { name: 'Republic of Congo', isoCode: 'COG', phoneCode: '+242', phoneFormat: 'XX XXX XXXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇨🇬' },
  { name: 'Gabon', isoCode: 'GAB', phoneCode: '+241', phoneFormat: 'X XX XX XX', phoneLengthMin: 7, phoneLengthMax: 8, flag: '🇬🇦' },
  { name: 'Equatorial Guinea', isoCode: 'GNQ', phoneCode: '+240', phoneFormat: 'XXX XXX XXX', phoneLengthMin: 9, phoneLengthMax: 9, flag: '🇬🇶' },
  { name: 'Sao Tome and Principe', isoCode: 'STP', phoneCode: '+239', phoneFormat: 'XXX XXXX', phoneLengthMin: 7, phoneLengthMax: 7, flag: '🇸🇹' },
];

// Sort by phone code length (descending) for accurate matching
const SORTED_COUNTRIES = [...AFRICAN_COUNTRIES].sort((a, b) => b.phoneCode.length - a.phoneCode.length);

/**
 * Comprehensive phone number cleaning and trimming
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Trim whitespace and convert to string
  let cleaned = phoneNumber.toString().trim();
  
  // Remove all non-digit characters except +
  cleaned = cleaned.replace(/[^0-9+]/g, '');
  
  // Remove multiple + signs, keep only the first one
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    cleaned = '+' + parts.filter(part => part.length > 0).join('');
  }
  
  // Remove leading zeros after country code (common in African numbers)
  // But preserve the + sign
  if (cleaned.startsWith('+')) {
    const countryCodeMatch = cleaned.match(/^\+(\d{1,4})/);
    if (countryCodeMatch) {
      const countryCode = '+' + countryCodeMatch[1];
      const restOfNumber = cleaned.substring(countryCode.length);
      // Remove leading zeros from the rest of the number
      const trimmedRest = restOfNumber.replace(/^0+/, '');
      cleaned = countryCode + trimmedRest;
    }
  }
  
  return cleaned;
}

/**
 * Detect country from phone number
 */
export function detectCountryFromPhone(phoneNumber: string): AfricanCountry | null {
  if (!phoneNumber) return null;
  
  // Clean and normalize phone number
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  
  // Ensure it starts with +
  const normalizedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
  
  // Find matching country (check longest codes first)
  for (const country of SORTED_COUNTRIES) {
    if (normalizedPhone.startsWith(country.phoneCode)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Validate African phone number
 */
export function validateAfricanPhone(phoneNumber: string, countryIsoCode?: string): {
  isValid: boolean;
  country: AfricanCountry | null;
  error?: string;
  cleanedPhone?: string;
} {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: false, country: null, error: 'Phone number is required' };
  }
  
  // Clean and normalize phone number
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  
  if (!cleanPhone) {
    return { isValid: false, country: null, error: 'Invalid phone number format' };
  }
  
  // Detect country
  const detectedCountry = detectCountryFromPhone(cleanPhone);
  
  if (!detectedCountry) {
    return { isValid: false, country: null, error: 'Invalid phone number or unsupported country' };
  }
  
  // If specific country is required, check match
  if (countryIsoCode && detectedCountry.isoCode !== countryIsoCode) {
    return { 
      isValid: false, 
      country: detectedCountry, 
      error: `Phone number is not from ${countryIsoCode}`,
      cleanedPhone: cleanPhone
    };
  }
  
  // Extract digits after country code (already cleaned by cleanPhoneNumber)
  const phoneDigits = cleanPhone.substring(detectedCountry.phoneCode.length);
  
  // Check length
  const digitCount = phoneDigits.length;
  if (digitCount < detectedCountry.phoneLengthMin || digitCount > detectedCountry.phoneLengthMax) {
    return { 
      isValid: false, 
      country: detectedCountry, 
      error: `Phone number should be ${detectedCountry.phoneLengthMin}-${detectedCountry.phoneLengthMax} digits for ${detectedCountry.name}`,
      cleanedPhone: cleanPhone
    };
  }
  
  return { isValid: true, country: detectedCountry, cleanedPhone: cleanPhone };
}

/**
 * Format phone number for display
 */
export function formatAfricanPhone(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  const validation = validateAfricanPhone(phoneNumber);
  if (!validation.isValid || !validation.country || !validation.cleanedPhone) {
    return phoneNumber;
  }
  
  const country = validation.country;
  const cleanPhone = validation.cleanedPhone;
  
  // Return formatted: +XXX XXX XXX XXXX
  const phoneDigits = cleanPhone.substring(country.phoneCode.length);
  return `${country.phoneCode} ${phoneDigits}`;
}

/**
 * Auto-format phone input as user types with country-specific formatting
 */
export const autoFormatAfricanPhoneInput = (input: string): string => {
  const cleaned = cleanPhoneNumber(input);
  
  if (!cleaned.startsWith('+')) {
    return input; // Return as-is if no country code
  }

  const country = detectCountryFromPhone(cleaned);
  if (!country) {
    return cleaned; // Return cleaned version if country not detected
  }

  // Apply country-specific formatting
  return formatAfricanPhone(cleaned);
};

/**
 * Smart phone input handler that limits input based on detected country
 */
export const handleSmartPhoneInput = (
  currentValue: string, 
  newInput: string, 
  cursorPosition: number = newInput.length
): { 
  value: string; 
  shouldPrevent: boolean; 
  message?: string;
  maxLength?: number;
  country?: string;
} => {
  // Clean the new input
  const cleaned = cleanPhoneNumber(newInput);
  
  // If no country code detected yet, allow input up to reasonable length
  if (!cleaned.startsWith('+') || cleaned.length < 4) {
    return {
      value: newInput,
      shouldPrevent: false,
      maxLength: 20 // Reasonable max before country detection
    };
  }

  // Detect country from current input
  const detectedCountry = detectCountryFromPhone(cleaned);
  
  if (!detectedCountry) {
    // Country not detected yet, allow reasonable input
    return {
      value: newInput,
      shouldPrevent: false,
      maxLength: 20
    };
  }

  // Calculate expected total length (country code + local number)
  const countryCodeLength = detectedCountry.phoneCode.length;
  const maxTotalLength = countryCodeLength + detectedCountry.phoneLengthMax;
  const minTotalLength = countryCodeLength + detectedCountry.phoneLengthMin;

  // Remove formatting characters to get actual digit count
  const digitsOnly = cleaned.replace(/[^\d+]/g, '');
  
  // Check if input exceeds maximum allowed length
  if (digitsOnly.length > maxTotalLength) {
    return {
      value: currentValue, // Keep previous value
      shouldPrevent: true,
      message: `${detectedCountry.flag} ${detectedCountry.name} phone numbers should be ${detectedCountry.phoneLengthMin}-${detectedCountry.phoneLengthMax} digits after country code`,
      maxLength: maxTotalLength,
      country: detectedCountry.name
    };
  }

  // Format the input according to country rules
  const formatted = autoFormatAfricanPhoneInput(cleaned);
  
  return {
    value: formatted,
    shouldPrevent: false,
    maxLength: maxTotalLength,
    country: detectedCountry.name,
    message: digitsOnly.length >= minTotalLength ? 
      `✅ Valid ${detectedCountry.flag} ${detectedCountry.name} number` : 
      `${detectedCountry.flag} ${detectedCountry.name} needs ${minTotalLength - digitsOnly.length} more digits`
  };
};

/**
 * Get maximum allowed length for a phone number based on detected country
 */
export const getMaxPhoneLength = (phoneNumber: string): number => {
  const country = detectCountryFromPhone(phoneNumber);
  if (!country) {
    return 20; // Default max length
  }

  return country.phoneCode.length + country.phoneLengthMax;
};

/**
 * Real-time phone validation with smart input limiting
 */
export const validatePhoneInputRealTime = (input: string): {
  isValid: boolean;
  isComplete: boolean;
  country?: string;
  message: string;
  suggestion?: string;
} => {
  const cleaned = cleanPhoneNumber(input);
  
  if (!cleaned) {
    return {
      isValid: false,
      isComplete: false,
      message: 'Enter phone number with country code (e.g., +254...)'
    };
  }

  if (!cleaned.startsWith('+')) {
    return {
      isValid: false,
      isComplete: false,
      message: 'Phone number must start with country code (+)',
      suggestion: `Try: +${cleaned}`
    };
  }

  const detectedCountry = detectCountryFromPhone(cleaned);
  
  if (!detectedCountry) {
    return {
      isValid: false,
      isComplete: false,
      message: 'Country code not recognized. Use supported country codes (+254, +234, +964, etc.)'
    };
  }

  const digitsOnly = cleaned.replace(/[^\d+]/g, '');
  const localDigits = digitsOnly.length - detectedCountry.phoneCode.length;

  if (localDigits < detectedCountry.phoneLengthMin) {
    return {
      isValid: false,
      isComplete: false,
      country: detectedCountry.name,
      message: `${detectedCountry.flag} ${detectedCountry.name}: Need ${detectedCountry.phoneLengthMin - localDigits} more digits`
    };
  }

  if (localDigits > detectedCountry.phoneLengthMax) {
    return {
      isValid: false,
      isComplete: false,
      country: detectedCountry.name,
      message: `${detectedCountry.flag} ${detectedCountry.name}: Too many digits (max ${detectedCountry.phoneLengthMax})`
    };
  }

  return {
    isValid: true,
    isComplete: true,
    country: detectedCountry.name,
    message: `✅ Valid ${detectedCountry.flag} ${detectedCountry.name} number`
  };
};

/**
 * Get placeholder for country
 */
export function getPhonePlaceholder(countryIsoCode?: string): string {
  if (!countryIsoCode) {
    return '+XXX XXX XXX XXXX (Supported countries)';
  }
  
  const country = AFRICAN_COUNTRIES.find(c => c.isoCode === countryIsoCode);
  if (!country) {
    return '+XXX XXX XXX XXXX';
  }
  
  return `${country.phoneCode} ${country.phoneFormat}`;
}

/**
 * Get country by ISO code
 */
export function getCountryByIsoCode(isoCode: string): AfricanCountry | null {
  return AFRICAN_COUNTRIES.find(c => c.isoCode === isoCode) || null;
}

/**
 * Get all countries grouped by region
 */
export function getCountriesByRegion(): Record<string, AfricanCountry[]> {
  const regions: Record<string, AfricanCountry[]> = {
    'North Africa': [],
    'West Africa': [],
    'East Africa': [],
    'Southern Africa': [],
    'Central Africa': [],
  };
  
  const regionMap: Record<string, string> = {
    'DZA': 'North Africa', 'EGY': 'North Africa', 'LBY': 'North Africa', 'MAR': 'North Africa', 'TUN': 'North Africa', 'SDN': 'North Africa',
    'NGA': 'West Africa', 'GHA': 'West Africa', 'SEN': 'West Africa', 'CIV': 'West Africa', 'MLI': 'West Africa', 'BFA': 'West Africa', 
    'NER': 'West Africa', 'GIN': 'West Africa', 'BEN': 'West Africa', 'TGO': 'West Africa', 'SLE': 'West Africa', 'LBR': 'West Africa',
    'MRT': 'West Africa', 'GMB': 'West Africa', 'GNB': 'West Africa', 'CPV': 'West Africa',
    'KEN': 'East Africa', 'TZA': 'East Africa', 'UGA': 'East Africa', 'ETH': 'East Africa', 'SOM': 'East Africa', 'RWA': 'East Africa',
    'BDI': 'East Africa', 'DJI': 'East Africa', 'ERI': 'East Africa', 'SSD': 'East Africa',
    'ZAF': 'Southern Africa', 'ZWE': 'Southern Africa', 'ZMB': 'Southern Africa', 'MOZ': 'Southern Africa', 'BWA': 'Southern Africa',
    'NAM': 'Southern Africa', 'MWI': 'Southern Africa', 'LSO': 'Southern Africa', 'SWZ': 'Southern Africa', 'MDG': 'Southern Africa',
    'MUS': 'Southern Africa', 'SYC': 'Southern Africa', 'COM': 'Southern Africa',
    'COD': 'Central Africa', 'AGO': 'Central Africa', 'CMR': 'Central Africa', 'TCD': 'Central Africa', 'CAF': 'Central Africa',
    'COG': 'Central Africa', 'GAB': 'Central Africa', 'GNQ': 'Central Africa', 'STP': 'Central Africa',
  };
  
  AFRICAN_COUNTRIES.forEach(country => {
    const region = regionMap[country.isoCode] || 'Other';
    if (regions[region]) {
      regions[region].push(country);
    }
  });
  
  return regions;
}
