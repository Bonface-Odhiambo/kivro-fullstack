// African Phone Number Validation and Formatting Utility
// Supports all African countries for KIVRO address generation

export interface CountryPhoneInfo {
  name: string;
  code: string;
  dialCode: string;
  format: string;
  example: string;
  regex: RegExp;
  minLength: number;
  maxLength: number;
}

// Comprehensive African countries phone number data
export const AFRICAN_COUNTRIES: Record<string, CountryPhoneInfo> = {
  // East Africa
  KE: {
    name: 'Kenya',
    code: 'KE',
    dialCode: '+254',
    format: '+254 XXX XXX XXX',
    example: '+254 712 345 678',
    regex: /^(\+254|254|0)?([17]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  UG: {
    name: 'Uganda',
    code: 'UG',
    dialCode: '+256',
    format: '+256 XXX XXX XXX',
    example: '+256 712 345 678',
    regex: /^(\+256|256|0)?([37]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  TZ: {
    name: 'Tanzania',
    code: 'TZ',
    dialCode: '+255',
    format: '+255 XXX XXX XXX',
    example: '+255 712 345 678',
    regex: /^(\+255|255|0)?([67]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  RW: {
    name: 'Rwanda',
    code: 'RW',
    dialCode: '+250',
    format: '+250 XXX XXX XXX',
    example: '+250 712 345 678',
    regex: /^(\+250|250|0)?([78]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  ET: {
    name: 'Ethiopia',
    code: 'ET',
    dialCode: '+251',
    format: '+251 XX XXX XXXX',
    example: '+251 91 123 4567',
    regex: /^(\+251|251|0)?([9]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },

  // West Africa
  NG: {
    name: 'Nigeria',
    code: 'NG',
    dialCode: '+234',
    format: '+234 XXX XXX XXXX',
    example: '+234 802 123 4567',
    regex: /^(\+234|234|0)?([789]\d{9})$/,
    minLength: 10,
    maxLength: 14
  },
  GH: {
    name: 'Ghana',
    code: 'GH',
    dialCode: '+233',
    format: '+233 XX XXX XXXX',
    example: '+233 24 123 4567',
    regex: /^(\+233|233|0)?([245]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  SN: {
    name: 'Senegal',
    code: 'SN',
    dialCode: '+221',
    format: '+221 XX XXX XXXX',
    example: '+221 77 123 4567',
    regex: /^(\+221|221)?([7]\d{8})$/,
    minLength: 9,
    maxLength: 12
  },
  CI: {
    name: 'Côte d\'Ivoire',
    code: 'CI',
    dialCode: '+225',
    format: '+225 XX XX XX XX XX',
    example: '+225 07 12 34 56 78',
    regex: /^(\+225|225|0)?([0-9]\d{9})$/,
    minLength: 10,
    maxLength: 13
  },
  ML: {
    name: 'Mali',
    code: 'ML',
    dialCode: '+223',
    format: '+223 XX XX XX XX',
    example: '+223 65 12 34 56',
    regex: /^(\+223|223)?([6-9]\d{7})$/,
    minLength: 8,
    maxLength: 11
  },
  BF: {
    name: 'Burkina Faso',
    code: 'BF',
    dialCode: '+226',
    format: '+226 XX XX XX XX',
    example: '+226 70 12 34 56',
    regex: /^(\+226|226|0)?([67]\d{7})$/,
    minLength: 8,
    maxLength: 11
  },

  // North Africa
  EG: {
    name: 'Egypt',
    code: 'EG',
    dialCode: '+20',
    format: '+20 XXX XXX XXXX',
    example: '+20 100 123 4567',
    regex: /^(\+20|20|0)?([1]\d{9})$/,
    minLength: 10,
    maxLength: 13
  },
  MA: {
    name: 'Morocco',
    code: 'MA',
    dialCode: '+212',
    format: '+212 XXX XXX XXX',
    example: '+212 612 345 678',
    regex: /^(\+212|212|0)?([67]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  DZ: {
    name: 'Algeria',
    code: 'DZ',
    dialCode: '+213',
    format: '+213 XXX XXX XXX',
    example: '+213 551 234 567',
    regex: /^(\+213|213|0)?([567]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  TN: {
    name: 'Tunisia',
    code: 'TN',
    dialCode: '+216',
    format: '+216 XX XXX XXX',
    example: '+216 20 123 456',
    regex: /^(\+216|216)?([2-9]\d{7})$/,
    minLength: 8,
    maxLength: 11
  },

  // Southern Africa
  ZA: {
    name: 'South Africa',
    code: 'ZA',
    dialCode: '+27',
    format: '+27 XX XXX XXXX',
    example: '+27 82 123 4567',
    regex: /^(\+27|27|0)?([6-8]\d{8})$/,
    minLength: 9,
    maxLength: 12
  },
  ZW: {
    name: 'Zimbabwe',
    code: 'ZW',
    dialCode: '+263',
    format: '+263 XX XXX XXXX',
    example: '+263 77 123 4567',
    regex: /^(\+263|263|0)?([7]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  BW: {
    name: 'Botswana',
    code: 'BW',
    dialCode: '+267',
    format: '+267 XX XXX XXX',
    example: '+267 71 123 456',
    regex: /^(\+267|267)?([7]\d{7})$/,
    minLength: 8,
    maxLength: 11
  },
  ZM: {
    name: 'Zambia',
    code: 'ZM',
    dialCode: '+260',
    format: '+260 XX XXX XXXX',
    example: '+260 97 123 4567',
    regex: /^(\+260|260|0)?([9]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },

  // Central Africa
  CM: {
    name: 'Cameroon',
    code: 'CM',
    dialCode: '+237',
    format: '+237 X XX XX XX XX',
    example: '+237 6 77 12 34 56',
    regex: /^(\+237|237)?([6]\d{8})$/,
    minLength: 9,
    maxLength: 12
  },
  CD: {
    name: 'Democratic Republic of Congo',
    code: 'CD',
    dialCode: '+243',
    format: '+243 XXX XXX XXX',
    example: '+243 812 345 678',
    regex: /^(\+243|243|0)?([89]\d{8})$/,
    minLength: 9,
    maxLength: 13
  },
  AO: {
    name: 'Angola',
    code: 'AO',
    dialCode: '+244',
    format: '+244 XXX XXX XXX',
    example: '+244 923 123 456',
    regex: /^(\+244|244)?([9]\d{8})$/,
    minLength: 9,
    maxLength: 12
  }
};

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  country?: CountryPhoneInfo;
  error?: string;
  suggestion?: string;
}

/**
 * Validates and formats an African phone number
 */
export function validateAfricanPhoneNumber(phoneNumber: string): PhoneValidationResult {
  if (!phoneNumber) {
    return {
      isValid: false,
      formatted: '',
      error: 'Phone number is required',
      suggestion: 'Please enter your phone number'
    };
  }

  // Clean the phone number (remove spaces, dashes, parentheses)
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Try to match against each African country
  for (const [countryCode, countryInfo] of Object.entries(AFRICAN_COUNTRIES)) {
    const match = cleaned.match(countryInfo.regex);
    
    if (match) {
      // Extract the main number part
      const mainNumber = match[2];
      const formatted = `${countryInfo.dialCode}${mainNumber}`;
      
      return {
        isValid: true,
        formatted,
        country: countryInfo
      };
    }
  }

  // If no match found, try to detect country by dial code
  const detectedCountry = detectCountryByDialCode(cleaned);
  
  if (detectedCountry) {
    return {
      isValid: false,
      formatted: cleaned,
      country: detectedCountry,
      error: `Invalid ${detectedCountry.name} phone number format`,
      suggestion: `Please use format: ${detectedCountry.format} (e.g., ${detectedCountry.example})`
    };
  }

  // No country detected - provide general guidance
  return {
    isValid: false,
    formatted: cleaned,
    error: 'Invalid phone number format',
    suggestion: 'Please enter a valid African phone number with country code (e.g., +254712345678 for Kenya, +234802123456 for Nigeria)'
  };
}

/**
 * Detects country by dial code in phone number
 */
function detectCountryByDialCode(phoneNumber: string): CountryPhoneInfo | null {
  for (const countryInfo of Object.values(AFRICAN_COUNTRIES)) {
    if (phoneNumber.startsWith(countryInfo.dialCode) || 
        phoneNumber.startsWith(countryInfo.dialCode.substring(1))) {
      return countryInfo;
    }
  }
  return null;
}

/**
 * Formats a phone number for display
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  const validation = validateAfricanPhoneNumber(phoneNumber);
  return validation.formatted || phoneNumber;
}

/**
 * Gets all supported African countries
 */
export function getSupportedAfricanCountries(): CountryPhoneInfo[] {
  return Object.values(AFRICAN_COUNTRIES);
}

/**
 * Checks if a phone number is from a specific country
 */
export function isPhoneNumberFromCountry(phoneNumber: string, countryCode: string): boolean {
  const validation = validateAfricanPhoneNumber(phoneNumber);
  return validation.isValid && validation.country?.code === countryCode;
}

/**
 * Trims and normalizes phone number for storage/API calls
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const validation = validateAfricanPhoneNumber(phoneNumber);
  return validation.isValid ? validation.formatted : phoneNumber.replace(/[\s\-\(\)]/g, '');
}
