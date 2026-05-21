/**
 * KIVRO Postal Code Generator
 * Generates consistent, location-based postal codes using geographic grid system
 * Same GPS coordinates always produce the same postal code
 */

/**
 * Generate a deterministic KIVRO postal code based on GPS coordinates
 * Format: CIT-XXX (e.g., NAI-245, MOM-812)
 * 
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @param {string} cityName - City name for prefix
 * @returns {string} KIVRO postal code (e.g., "NAI-245")
 */
function generateKivroPostalCode(latitude, longitude, cityName) {
  if (!latitude || !longitude || !cityName) {
    return null;
  }

  // Get city code (first 3 letters, uppercase)
  const cityCode = cityName.substring(0, 3).toUpperCase();

  // Create geographic grid system
  // Divide area into ~100m x 100m grid cells
  // Each grid cell gets a unique 3-digit code
  
  // Grid size: 0.001 degrees ≈ 111 meters
  const gridSize = 0.001;
  
  // Calculate grid cell coordinates
  const gridLat = Math.floor(latitude / gridSize);
  const gridLng = Math.floor(longitude / gridSize);
  
  // Generate deterministic 3-digit code from grid coordinates
  // Use hash function to distribute codes evenly across 100-999 range
  const hash = simpleHash(`${gridLat},${gridLng}`);
  const postalNumber = 100 + (hash % 900); // Range: 100-999
  
  return `${cityCode}-${postalNumber}`;
}

/**
 * Simple hash function for consistent number generation
 * @param {string} str - Input string
 * @returns {number} Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get postal code for a location, checking database first
 * If location already has addresses nearby, reuse their postal code
 * Otherwise generate new one based on coordinates
 * 
 * @param {object} supabase - Supabase client
 * @param {number} latitude - GPS latitude
 * @param {number} longitude - GPS longitude
 * @param {string} cityName - City name
 * @returns {Promise<string>} KIVRO postal code
 */
async function getOrCreatePostalCode(supabase, latitude, longitude, cityName) {
  try {
    // Search for nearby addresses (within ~200m radius)
    // 0.002 degrees ≈ 222 meters
    const searchRadius = 0.002;
    
    const { data: nearbyAddresses, error } = await supabase
      .from('kivro_addresses')
      .select('postal_code, latitude, longitude')
      .gte('latitude', latitude - searchRadius)
      .lte('latitude', latitude + searchRadius)
      .gte('longitude', longitude - searchRadius)
      .lte('longitude', longitude + searchRadius)
      .not('postal_code', 'is', null)
      .limit(1);

    if (!error && nearbyAddresses && nearbyAddresses.length > 0) {
      // Reuse postal code from nearby address
      return nearbyAddresses[0].postal_code;
    }

    // No nearby addresses, generate new postal code
    const postalCode = generateKivroPostalCode(latitude, longitude, cityName);
    return postalCode;

  } catch (error) {
    // Fallback to direct generation
    return generateKivroPostalCode(latitude, longitude, cityName);
  }
}

/**
 * Validate KIVRO postal code format
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} True if valid
 */
function isValidKivroPostalCode(postalCode) {
  if (!postalCode) return false;
  // Format: XXX-NNN (3 letters, dash, 3 digits)
  const pattern = /^[A-Z]{3}-\d{3}$/;
  return pattern.test(postalCode);
}

module.exports = {
  generateKivroPostalCode,
  getOrCreatePostalCode,
  isValidKivroPostalCode
};
