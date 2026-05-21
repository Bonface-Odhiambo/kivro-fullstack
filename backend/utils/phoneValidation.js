/**
 * Phone Number Validation for All African Countries + Iraq
 * Backend validation utility supporting all 54 African nations + Iraq
 */

// Supported countries phone validation data (Africa + Iraq)
const AFRICAN_COUNTRIES = [
  // Middle East - Iraq (Special Support)
  { name: 'Iraq', code: '+964', min: 10, max: 10 },
  
  // North Africa
  { name: 'Algeria', code: '+213', min: 9, max: 9 },
  { name: 'Egypt', code: '+20', min: 10, max: 10 },
  { name: 'Libya', code: '+218', min: 9, max: 10 },
  { name: 'Morocco', code: '+212', min: 9, max: 9 },
  { name: 'Tunisia', code: '+216', min: 8, max: 8 },
  { name: 'Sudan', code: '+249', min: 9, max: 9 },
  
  // West Africa
  { name: 'Nigeria', code: '+234', min: 10, max: 11 },
  { name: 'Ghana', code: '+233', min: 9, max: 10 },
  { name: 'Senegal', code: '+221', min: 9, max: 9 },
  { name: 'Ivory Coast', code: '+225', min: 10, max: 10 },
  { name: 'Mali', code: '+223', min: 8, max: 8 },
  { name: 'Burkina Faso', code: '+226', min: 8, max: 8 },
  { name: 'Niger', code: '+227', min: 8, max: 8 },
  { name: 'Guinea', code: '+224', min: 9, max: 9 },
  { name: 'Benin', code: '+229', min: 8, max: 8 },
  { name: 'Togo', code: '+228', min: 8, max: 8 },
  { name: 'Sierra Leone', code: '+232', min: 8, max: 8 },
  { name: 'Liberia', code: '+231', min: 7, max: 9 },
  { name: 'Mauritania', code: '+222', min: 8, max: 8 },
  { name: 'Gambia', code: '+220', min: 7, max: 7 },
  { name: 'Guinea-Bissau', code: '+245', min: 7, max: 7 },
  { name: 'Cape Verde', code: '+238', min: 7, max: 7 },
  
  // East Africa
  { name: 'Kenya', code: '+254', min: 9, max: 10 },
  { name: 'Tanzania', code: '+255', min: 9, max: 10 },
  { name: 'Uganda', code: '+256', min: 9, max: 10 },
  { name: 'Ethiopia', code: '+251', min: 9, max: 10 },
  { name: 'Somalia', code: '+252', min: 8, max: 9 },
  { name: 'Rwanda', code: '+250', min: 9, max: 9 },
  { name: 'Burundi', code: '+257', min: 8, max: 8 },
  { name: 'Djibouti', code: '+253', min: 8, max: 8 },
  { name: 'Eritrea', code: '+291', min: 7, max: 7 },
  { name: 'South Sudan', code: '+211', min: 9, max: 9 },
  
  // Southern Africa
  { name: 'South Africa', code: '+27', min: 9, max: 10 },
  { name: 'Zimbabwe', code: '+263', min: 9, max: 10 },
  { name: 'Zambia', code: '+260', min: 9, max: 10 },
  { name: 'Mozambique', code: '+258', min: 9, max: 9 },
  { name: 'Botswana', code: '+267', min: 8, max: 8 },
  { name: 'Namibia', code: '+264', min: 9, max: 10 },
  { name: 'Malawi', code: '+265', min: 9, max: 9 },
  { name: 'Lesotho', code: '+266', min: 8, max: 8 },
  { name: 'Eswatini', code: '+268', min: 8, max: 8 },
  { name: 'Madagascar', code: '+261', min: 9, max: 10 },
  { name: 'Mauritius', code: '+230', min: 8, max: 8 },
  { name: 'Seychelles', code: '+248', min: 7, max: 7 },
  { name: 'Comoros', code: '+269', min: 7, max: 7 },
  
  // Central Africa
  { name: 'Democratic Republic of Congo', code: '+243', min: 9, max: 10 },
  { name: 'Angola', code: '+244', min: 9, max: 9 },
  { name: 'Cameroon', code: '+237', min: 9, max: 9 },
  { name: 'Chad', code: '+235', min: 8, max: 8 },
  { name: 'Central African Republic', code: '+236', min: 8, max: 8 },
  { name: 'Republic of Congo', code: '+242', min: 9, max: 9 },
  { name: 'Gabon', code: '+241', min: 7, max: 8 },
  { name: 'Equatorial Guinea', code: '+240', min: 9, max: 9 },
  { name: 'Sao Tome and Principe', code: '+239', min: 7, max: 7 },
];

// Sort by code length (descending) for accurate matching
const SORTED_COUNTRIES = AFRICAN_COUNTRIES.sort((a, b) => b.code.length - a.code.length);

/**
 * Detect country from phone number
 * @param {string} phoneNumber - The phone number
 * @returns {object|null} - Country object or null
 */
function detectCountryFromPhone(phoneNumber) {
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  const normalized = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  
  for (const country of SORTED_COUNTRIES) {
    if (normalized.startsWith(country.code)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Validates any African phone number
 * @param {string} phoneNumber - The phone number to validate
 * @returns {{isValid: boolean, error?: string, formatted?: string, country?: object}}
 */
function validateSomaliPhoneNumber(phoneNumber) {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  // Remove all spaces, hyphens, and parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  // Detect country
  const country = detectCountryFromPhone(cleaned);
  
  if (!country) {
    return {
      isValid: false,
      error: 'Phone number must be from a supported country (e.g., +234 for Nigeria, +254 for Kenya, +964 for Iraq)',
    };
  }

  // Extract the digits after country code
  let digitsAfterCode = cleaned.substring(country.code.length);
  
  // Remove leading zero if present (common in African numbers)
  if (digitsAfterCode.startsWith('0')) {
    digitsAfterCode = digitsAfterCode.substring(1);
  }

  // Check digit count
  const digitCount = digitsAfterCode.length;
  if (digitCount < country.min || digitCount > country.max) {
    return {
      isValid: false,
      error: `Phone number for ${country.name} must have ${country.min}-${country.max} digits after ${country.code} (found ${digitCount})`,
    };
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(digitsAfterCode)) {
    return {
      isValid: false,
      error: `Phone number must contain only digits after ${country.code}`,
    };
  }

  // Format the phone number: +XXX XXX XXX XXXX
  const formatted = `${country.code} ${digitsAfterCode}`;

  return {
    isValid: true,
    formatted,
    country: country.name,
    countryCode: country.code,
  };
}

/**
 * Custom validator for express-validator
 * @param {string} value - Phone number value
 * @returns {boolean}
 * @throws {Error} - Throws error with message if validation fails
 */
function validatePhoneNumberField(value) {
  const result = validateSomaliPhoneNumber(value);
  if (!result.isValid) {
    throw new Error(result.error);
  }
  return true;
}

/**
 * Custom validator for all African phone numbers
 * @param {string} value - Phone number value
 * @returns {boolean}
 * @throws {Error} - Throws error with message if validation fails
 */
function validateAfricanPhoneNumberField(value) {
  if (!value || typeof value !== 'string') {
    throw new Error('Phone number is required');
  }
  
  // Clean the phone number
  const cleaned = value.replace(/[\s\-()]/g, '');
  
  // Detect country
  const countryInfo = detectCountryFromPhone(cleaned);
  if (!countryInfo) {
    throw new Error('Invalid phone number or unsupported African country');
  }
  
  // Extract digits after country code
  const phoneDigits = cleaned.replace(countryInfo.code, '');
  const digitCount = phoneDigits.length;
  
  // Check length based on country requirements
  if (digitCount < countryInfo.min || digitCount > countryInfo.max) {
    throw new Error(`Phone number should be ${countryInfo.min}-${countryInfo.max} digits for ${countryInfo.name}`);
  }
  
  return true;
}

/**
 * Formats a phone number to the standard format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number or original if invalid
 */
function formatSomaliPhoneNumber(phoneNumber) {
  const result = validateSomaliPhoneNumber(phoneNumber);
  return result.formatted || phoneNumber;
}

module.exports = {
  validateSomaliPhoneNumber,
  validatePhoneNumberField,
  validateAfricanPhoneNumberField,
  formatSomaliPhoneNumber,
  detectCountryFromPhone,
  AFRICAN_COUNTRIES
};
