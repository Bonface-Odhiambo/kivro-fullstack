const express = require('express');
const router = express.Router();
const what3wordsService = require('../services/what3wordsService');

/**
 * Convert 3-word address to coordinates
 * POST /api/what3words/convert-to-coordinates
 * Body: { words: "filled.count.soap" }
 */
router.post('/convert-to-coordinates', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words) {
      return res.status(400).json({
        success: false,
        message: 'Three words are required'
      });
    }

    // Validate format
    if (!what3wordsService.isValidFormat(words)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 3-word address format. Please use format: word.word.word'
      });
    }

    const formattedWords = what3wordsService.formatWords(words);
    const result = await what3wordsService.convertToCoordinates(formattedWords);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Successfully converted 3-word address to coordinates'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to convert 3-word address',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Convert coordinates to 3-word address
 * POST /api/what3words/convert-to-words
 * Body: { lat: -1.2921, lng: 36.8219, language: "en" }
 */
router.post('/convert-to-words', async (req, res) => {
  try {
    const { lat, lng, language = 'en' } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    const result = await what3wordsService.convertToWords(parseFloat(lat), parseFloat(lng), language);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Successfully converted coordinates to 3-word address'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to convert coordinates',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get autosuggest for partial 3-word input
 * POST /api/what3words/autosuggest
 * Body: { input: "filled.count.so", focus: { lat: -1.2921, lng: 36.8219 } }
 */
router.post('/autosuggest', async (req, res) => {
  try {
    const { input, focus, clipToBoundingBox, clipToCountry, language = 'en' } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Input is required for autosuggest'
      });
    }

    const options = {
      language
    };

    if (focus && focus.lat && focus.lng) {
      options.focus = focus;
    }

    if (clipToBoundingBox) {
      options.clipToBoundingBox = clipToBoundingBox;
    }

    if (clipToCountry) {
      options.clipToCountry = clipToCountry;
    }

    const result = await what3wordsService.autosuggest(input, options);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Successfully retrieved autosuggest results'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to get autosuggest results',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get available languages
 * GET /api/what3words/languages
 */
router.get('/languages', async (req, res) => {
  try {
    const result = await what3wordsService.getAvailableLanguages();

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Successfully retrieved available languages'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to get available languages',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Validate 3-word address format
 * POST /api/what3words/validate
 * Body: { words: "filled.count.soap" }
 */
router.post('/validate', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words) {
      return res.status(400).json({
        success: false,
        message: 'Three words are required for validation'
      });
    }

    const isValid = what3wordsService.isValidFormat(words);
    const formattedWords = what3wordsService.formatWords(words);

    res.json({
      success: true,
      data: {
        isValid,
        originalWords: words,
        formattedWords,
        message: isValid ? 'Valid 3-word address format' : 'Invalid 3-word address format'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Get location details for delivery
 * POST /api/what3words/location-details
 * Body: { words: "filled.count.soap" }
 */
router.post('/location-details', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words) {
      return res.status(400).json({
        success: false,
        message: 'Three words are required'
      });
    }

    if (!what3wordsService.isValidFormat(words)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 3-word address format'
      });
    }

    const formattedWords = what3wordsService.formatWords(words);
    const result = await what3wordsService.convertToCoordinates(formattedWords);

    if (result.success) {
      // Enhance with delivery-specific information
      const deliveryInfo = {
        ...result,
        deliveryZone: result.country === 'SO' ? 'Somalia' : 'International',
        estimatedDeliveryTime: result.country === 'SO' ? '1-3 days' : '5-10 days',
        deliveryFee: result.country === 'SO' ? 'KES 50' : 'KES 200',
        isDeliverable: true,
        specialInstructions: `Delivery to ${result.words} - ${result.nearestPlace}`
      };

      res.json({
        success: true,
        data: deliveryInfo,
        message: 'Successfully retrieved location details for delivery'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to get location details',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
