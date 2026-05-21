/**
 * Test Ivory Coast phone number validation
 */

const { detectCountryFromPhone, validateAfricanPhoneNumberField } = require('./utils/phoneValidation');

const testPhone = '+2250506369696';


// Test country detection
const countryInfo = detectCountryFromPhone(testPhone);

// Test validation manually
function validateIvoryCoastPhone(phoneNumber) {
  const countryInfo = detectCountryFromPhone(phoneNumber);
  if (!countryInfo) {
    return { isValid: false, error: 'Invalid country code' };
  }
  
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const localDigits = digitsOnly.replace(countryInfo.code.replace('+', ''), '');
  
  return {
    isValid: localDigits.length >= countryInfo.min && localDigits.length <= countryInfo.max,
    error: localDigits.length < countryInfo.min ? `Too short - needs at least ${countryInfo.min} digits` : 
            localDigits.length > countryInfo.max ? `Too long - needs at most ${countryInfo.max} digits` : null,
    localDigits: localDigits.length,
    expected: `${countryInfo.min}-${countryInfo.max}`
  };
}

// Test the new backend validation
try {
  validateAfricanPhoneNumberField(testPhone);
} catch (error) {
}

const validationResult = validateIvoryCoastPhone(testPhone);

// Let's also test what the correct format should be
const testFormats = [
  '+2250506369696',  // Original - 12 digits
  '+22506369696000', // Working version - 13 digits  
  '+225506369696',   // 10 digits (expected)
  '+22506369696',    // 8 digits
  '+2250506369696'   // 12 digits
];

testFormats.forEach(phone => {
  const result = validateIvoryCoastPhone(phone);
});

// Check actual length
const digitsOnly = testPhone.replace(/\D/g, '').replace('225', '');
