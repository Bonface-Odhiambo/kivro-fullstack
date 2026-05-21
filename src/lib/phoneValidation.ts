/**
 * Phone Number Validation for Somalia (+252)
 * Ensures phone numbers start with +252 followed by 9 digits
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validates a Somali phone number
 * Expected format: +252 followed by 9 digits
 * Examples: +252612345678, +252 61 234 5678, +25261 234 5678
 */
export function validateSomaliPhoneNumber(phoneNumber: string): PhoneValidationResult {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  // Remove all spaces, hyphens, and parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  // Check if it starts with +252
  if (!cleaned.startsWith('+252')) {
    return {
      isValid: false,
      error: 'Phone number must start with +252 (Somalia country code)',
    };
  }

  // Extract the digits after +252
  const digitsAfterCode = cleaned.substring(4);

  // Check if there are exactly 9 digits after +252
  if (digitsAfterCode.length !== 9) {
    return {
      isValid: false,
      error: `Phone number must have exactly 9 digits after +252 (found ${digitsAfterCode.length})`,
    };
  }

  // Check if all characters after +252 are digits
  if (!/^\d{9}$/.test(digitsAfterCode)) {
    return {
      isValid: false,
      error: 'Phone number must contain only digits after +252',
    };
  }

  // Format the phone number nicely: +252 61 234 5678
  const formatted = `+252 ${digitsAfterCode.substring(0, 2)} ${digitsAfterCode.substring(2, 5)} ${digitsAfterCode.substring(5)}`;

  return {
    isValid: true,
    formatted,
  };
}

/**
 * Formats a phone number to the standard format
 * Returns the formatted number or the original if invalid
 */
export function formatSomaliPhoneNumber(phoneNumber: string): string {
  const result = validateSomaliPhoneNumber(phoneNumber);
  return result.formatted || phoneNumber;
}

/**
 * Auto-formats phone number as user types
 * Adds +252 prefix if missing and formats with spaces
 */
export function autoFormatPhoneInput(value: string): string {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '');

  // If user starts typing without +252, add it
  if (cleaned && !cleaned.startsWith('+')) {
    cleaned = '+252' + cleaned;
  }

  // If user types +2 but not +252, auto-complete to +252
  if (cleaned.startsWith('+') && cleaned.length > 1 && !cleaned.startsWith('+252')) {
    // Replace any partial country code with +252
    cleaned = '+252' + cleaned.substring(1).replace(/^2+5*2*/, '');
  }

  // Ensure we don't exceed +252 + 9 digits (total 13 characters)
  if (cleaned.startsWith('+252')) {
    const afterCode = cleaned.substring(4);
    if (afterCode.length > 9) {
      cleaned = '+252' + afterCode.substring(0, 9);
    }
  }

  // Format with spaces: +252 XX XXX XXXX
  if (cleaned.startsWith('+252') && cleaned.length > 4) {
    const digits = cleaned.substring(4);
    let formatted = '+252';
    
    if (digits.length > 0) {
      formatted += ' ' + digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += ' ' + digits.substring(2, 5);
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.substring(5, 9);
    }
    
    return formatted;
  }

  return cleaned;
}

/**
 * Examples of valid phone numbers
 */
export const PHONE_NUMBER_EXAMPLES = [
  '+252 61 234 5678',
  '+252 63 567 8901',
  '+252 90 876 5432',
];

/**
 * Placeholder text for phone input
 */
export const PHONE_PLACEHOLDER = '+252 61 234 5678';

/**
 * Helper text for phone input
 */
export const PHONE_HELPER_TEXT = 'Must start with +252 followed by 9 digits';
