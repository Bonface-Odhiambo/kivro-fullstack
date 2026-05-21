// Alternative implementation using direct HTTP requests
const fetch = require('cross-fetch');

// Load API key from environment variables
const apiKey = process.env.WHAT3WORDS_API_KEY;
const baseUrl = 'https://api.what3words.com/v3';

if (!apiKey) {
}

class What3WordsService {
  /**
   * Convert a 3-word address to coordinates
   * @param {string} words - Three words separated by dots (e.g., "filled.count.soap")
   * @returns {Promise<Object>} - Coordinates and location data
   */
  async convertToCoordinates(words) {
    if (!apiKey) {
      return {
        success: false,
        error: 'What3Words API key not configured',
        message: 'What3Words service is not available'
      };
    }

    try {
      const url = `${baseUrl}/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.coordinates) {
        return {
          success: true,
          coordinates: data.coordinates,
          words: data.words,
          language: data.language,
          country: data.country,
          square: data.square,
          nearestPlace: data.nearestPlace,
          map: data.map
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error',
          message: data.error?.message || 'Failed to convert 3-word address to coordinates'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error converting 3-word address'
      };
    }
  }

  /**
   * Convert coordinates to a 3-word address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object>} - 3-word address data
   */
  async convertToWords(lat, lng, language = 'en') {
    if (!apiKey) {
      return {
        success: false,
        error: 'What3Words API key not configured',
        message: 'What3Words service is not available'
      };
    }

    try {
      const url = `${baseUrl}/convert-to-3wa?coordinates=${lat},${lng}&language=${language}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.words) {
        return {
          success: true,
          words: data.words,
          language: data.language,
          country: data.country,
          square: data.square,
          nearestPlace: data.nearestPlace,
          coordinates: data.coordinates,
          map: data.map
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error',
          message: data.error?.message || 'Failed to convert coordinates to 3-word address'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error converting coordinates to 3-word address'
      };
    }
  }

  /**
   * Get available languages
   * @returns {Promise<Object>} - List of available languages
   */
  async getAvailableLanguages() {
    if (!apiKey) {
      return {
        success: false,
        error: 'What3Words API key not configured',
        message: 'What3Words service is not available'
      };
    }

    try {
      const url = `${baseUrl}/available-languages?key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.languages) {
        return {
          success: true,
          languages: data.languages
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error',
          message: data.error?.message || 'Failed to get available languages'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error getting available languages'
      };
    }
  }

  /**
   * Get autosuggest options for partial 3-word input
   * @param {string} input - Partial 3-word input
   * @param {Object} options - Additional options (focus, clipToBoundingBox, etc.)
   * @returns {Promise<Object>} - Autosuggest results
   */
  async autosuggest(input, options = {}) {
    if (!apiKey) {
      return {
        success: false,
        error: 'What3Words API key not configured',
        message: 'What3Words service is not available'
      };
    }

    try {
      const params = new URLSearchParams({
        input,
        key: apiKey,
        ...options
      });

      const url = `${baseUrl}/autosuggest?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.suggestions) {
        return {
          success: true,
          suggestions: data.suggestions
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error',
          message: data.error?.message || 'Failed to get autosuggest results'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error getting autosuggest results'
      };
    }
  }

  /**
   * Validate a 3-word address format
   * @param {string} words - Three words to validate
   * @returns {boolean} - Whether the format is valid
   */
  isValidFormat(words) {
    if (!words || typeof words !== 'string') {
      return false;
    }

    // Remove any leading/trailing slashes and split by dots
    const cleanWords = words.replace(/^\/+|\/+$/g, '');
    const wordArray = cleanWords.split('.');
    
    // Should have exactly 3 words
    if (wordArray.length !== 3) {
      return false;
    }

    // Each word should be non-empty and contain only letters
    return wordArray.every(word => 
      word.length > 0 && /^[a-zA-Z]+$/.test(word)
    );
  }

  /**
   * Format 3-word address consistently
   * @param {string} words - Three words to format
   * @returns {string} - Formatted 3-word address
   */
  formatWords(words) {
    if (!words) return '';
    
    // Remove any leading/trailing slashes and normalize
    const cleanWords = words.replace(/^\/+|\/+$/g, '').toLowerCase();
    const wordArray = cleanWords.split('.');
    
    if (wordArray.length === 3) {
      return wordArray.join('.');
    }
    
    return words;
  }

  /**
   * Alias for convertToWords method
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} language - Language code (default: 'en')
   * @returns {Promise<Object>} - 3-word address data
   */
  async convertFromCoordinates(lat, lng, language = 'en') {
    return this.convertToWords(lat, lng, language);
  }
}

module.exports = new What3WordsService();
