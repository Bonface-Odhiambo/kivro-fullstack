/**
 * Utility functions to manage address generation intent
 * Used when unauthenticated users want to create an address
 */

export interface AddressIntent {
  wantsToGenerate: boolean;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const INTENT_KEY = 'kivro_address_intent';
const INTENT_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Store the intent to generate an address
 */
export const setAddressIntent = (location?: { latitude: number; longitude: number }) => {
  const intent: AddressIntent = {
    wantsToGenerate: true,
    timestamp: Date.now(),
    location,
  };
  localStorage.setItem(INTENT_KEY, JSON.stringify(intent));
};

/**
 * Get the stored address intent
 * Returns null if no intent or if expired
 */
export const getAddressIntent = (): AddressIntent | null => {
  try {
    const stored = localStorage.getItem(INTENT_KEY);
    if (!stored) return null;

    const intent: AddressIntent = JSON.parse(stored);
    
    // Check if intent has expired
    if (Date.now() - intent.timestamp > INTENT_EXPIRY) {
      clearAddressIntent();
      return null;
    }

    return intent;
  } catch (error) {
    clearAddressIntent();
    return null;
  }
};

/**
 * Clear the stored address intent
 */
export const clearAddressIntent = () => {
  localStorage.removeItem(INTENT_KEY);
};

/**
 * Check if there's a valid address intent
 */
export const hasAddressIntent = (): boolean => {
  return getAddressIntent() !== null;
};
