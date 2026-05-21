const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { supabase, verifyUserToken } = require('../config/supabase');
const somaliAddressService = require('../services/somaliAddress');
const what3wordsService = require('../services/what3wordsService');
const notificationService = require('../services/notificationService');
const { sendSMS } = require('../services/smsService');
const { enqueueEmail, enqueueSMS } = require('../services/queue');
let cache; try { cache = require('../services/cache'); } catch { cache = null; }
const geocodingService = require('../services/geocodingService');
const { validatePhoneNumberField, validateAfricanPhoneNumberField, detectCountryFromPhone } = require('../utils/phoneValidation');
// REMOVED: Database-based region detection - using only geocoding APIs now

const router = express.Router();

// Helper function to validate and parse coordinates
function validateCoordinates(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return {
      valid: false,
      error: 'Invalid coordinates',
      message: 'Latitude and longitude must be valid numbers'
    };
  }
  
  // General coordinate bounds check
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      valid: false,
      error: 'Coordinates out of range',
      message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
    };
  }
  
  return {
    valid: true,
    latitude: lat,
    longitude: lng
  };
}

// Helper to normalize phone numbers by removing spaces, punctuation, and leading '+'
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // Remove leading + if present
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  return cleaned;
}

// Helper to generate unique share token
function generateShareToken() {
  return crypto.randomBytes(20).toString('base64url');
}

// Validation middleware
const validateAddressGeneration = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(validateAfricanPhoneNumberField),
  body('region')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Region name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Region name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('landmark')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Landmark must be less than 200 characters')
];

// Validation middleware for location-based address generation
const validateLocationBasedGeneration = [
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(validateAfricanPhoneNumberField),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address is required'),
  body('landmark_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Landmark description must be less than 500 characters'),
  body('what3words')
    .optional()
    .matches(/^[a-z]+\.[a-z]+\.[a-z]+$/)
    .withMessage('What3Words must be in format: word.word.word')
];

// Validation middleware for company address generation
const validateCompanyAddressGeneration = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(validateAfricanPhoneNumberField),
  body('company_name')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('company_registration_number')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Registration number must be less than 100 characters'),
  body('company_email')
    .optional()
    .isEmail()
    .withMessage('Valid company email is required'),
  body('company_phone')
    .optional()
    .custom(validatePhoneNumberField),
  body('region')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Region name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Region name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  body('landmark')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Landmark must be less than 200 characters'),
  body('company_logo_base64')
    .optional()
    .isString()
    .withMessage('Company logo must be a valid base64 string'),
  body('company_logo_type')
    .optional()
    .isString()
    .withMessage('Company logo type must be specified')
];

// POST /api/addresses/generate - Generate new Kivro address
router.post('/generate', validateAddressGeneration, async (req, res) => {
  try {
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Verify user authentication
    const user = await verifyUserToken(req.headers.authorization);
    
    // PAYMENT DISABLED: Allow all users to create unlimited addresses for now
    // TODO: Re-enable payment system when ready
    /*
    // Check if user has active subscription or allow free tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .single();


    // Allow free tier: users can create 1 address without subscription
    if (!subscription || subscription.status !== 'active') {
      // Check how many addresses user already has
      const { data: existingAddresses, count } = await supabase
        .from('kivro_addresses')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);


      if (count >= 1) {
        return res.status(403).json({
          error: 'Subscription required',
          message: 'You have reached the free tier limit of 1 address. Please upgrade to create more addresses.',
          upgrade_required: true
        });
      }
    }

    // Check if subscription is expired (only if they have a subscription)
    if (subscription && subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.',
        renewal_required: true
      });
    }
    */

    const { phone_number, region = 'nairobi', latitude, longitude } = req.body;
    const normalizedPhone = normalizePhone(phone_number);


    // REQUIRE GPS coordinates for accurate address generation
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'GPS coordinates required',
        message: 'Please provide GPS coordinates for accurate address generation. Use GPS Location method or KIVRO Precision.'
      });
    }

    // Use geocoding service for ALL addresses - no fallbacks
    let geocodedLocation = null;
    try {
      geocodedLocation = await geocodingService.reverseGeocode(
        parseFloat(latitude),
        parseFloat(longitude),
        { preferredProvider: 'auto', useCache: true }
      );
    } catch (geocodeError) {
      return res.status(500).json({
        error: 'Geocoding failed',
        message: 'Unable to determine location from GPS coordinates. Please try again.'
      });
    }

    if (!geocodedLocation) {
      return res.status(500).json({
        error: 'Location detection failed',
        message: 'Could not determine your location. Please ensure GPS is enabled.'
      });
    }

    const detectedRegion = geocodedLocation.region;
    const detectedCity = geocodedLocation.city || geocodedLocation.district;
    const detectedCountry = geocodedLocation.country;
    const coordinateConfidence = geocodedLocation.confidence;


    // Also get traditional country detection for compatibility
    const phoneCountryInfo = detectCountryFromPhone(phone_number);

    let addressData;
    let newAddress;

    // Check if this is a Somali phone number
    if (somaliAddressService.isSomaliPhoneNumber(phone_number)) {
      
      try {
        // Generate Somali-style address with GEOCODED location data passed directly
        addressData = await somaliAddressService.generateSomaliAddress(
          phone_number, 
          req.body.full_name, 
          req.body.landmark,
          geocodedLocation  // Pass geocoded location to use GPS data instead of phone prefix guessing
        );
        
        // Coordinates are already set from geocodedLocation, but ensure they're correct
        addressData.latitude = parseFloat(latitude);
        addressData.longitude = parseFloat(longitude);
        

        // Create address record with Somali format
        const { data: somaliAddress, error: addressError } = await supabase
          .from('kivro_addresses')
          .insert({
            user_id: user.id,
            tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
            kivro_code: addressData.kivro_code,
            display_address: `${req.body.full_name}, ${normalizedPhone} ${addressData.display_address}`,
            region: addressData.region,
            district: addressData.district,
            landmark: addressData.landmark,
            latitude: addressData.latitude,
            longitude: addressData.longitude,
            postal_code: addressData.postal_code,
            federal_member_state: addressData.federal_member_state,
            is_active: true,
            is_verified: true, // Auto-verify all geocoded addresses
            verification_method: 'gps',
            geo_confidence: Math.round(coordinateConfidence * 100) || 95,
            share_token: generateShareToken(),
            created_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (addressError) {
          throw addressError;
        }

        newAddress = somaliAddress;

      } catch (error) {
        throw new Error('Failed to generate Somali address: ' + error.message);
      }

    } else {
      // Generate address for any other African country using GEOCODED data
      const countryName = detectedCountry || (phoneCountryInfo ? phoneCountryInfo.name : 'Africa');
      const countryCode = phoneCountryInfo ? phoneCountryInfo.code : '';
      
      // Generate standard Kivro address
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const kivroCode = `KV-${randomSuffix}-${timestamp.toString().slice(-4)}`;

      // Generate KIVRO postal code based on GPS coordinates (deterministic)
      const { getOrCreatePostalCode } = require('../utils/postalCodeGenerator');
      const kivroPostalCode = await getOrCreatePostalCode(supabase, parseFloat(latitude), parseFloat(longitude), detectedCity);


      // Create address record for any African country with smart region detection
      const full_name = req.body.full_name || user.user_metadata?.full_name || 'User';
      const { data: africanAddress, error: addressError } = await supabase
        .from('kivro_addresses')
        .insert({
          user_id: user.id,
          tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
          kivro_code: kivroCode,
          display_address: `${full_name}, ${normalizedPhone} ${kivroCode}, ${detectedRegion}, ${detectedCity}, ${countryName}`,
          region: detectedRegion,
          district: detectedCity,
          landmark: req.body.landmark || 'Generated Address',
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          country: countryName,
          postal_code: kivroPostalCode,
          phone_country_code: countryCode,
          phone_number: phone_number,
          is_active: true,
          is_verified: true, // Auto-verify all geocoded addresses
          verification_method: 'gps',
          geo_confidence: Math.round(coordinateConfidence * 100) || 95,
          share_token: generateShareToken(),
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (addressError) {
        throw addressError;
      }

      newAddress = africanAddress;
    }


    // Send notifications (email and SMS) to user
    try {
      const userEmail = req.body.email || user.email;
      const notificationResults = await notificationService.sendAddressNotifications(
        userEmail,
        phone_number,
        {
          ...newAddress,
          full_name: req.body.full_name || user.user_metadata?.full_name || 'Valued Customer'
        }
      );
    } catch (notifError) {
      // Don't fail the request if notifications fail
    }

    // Increment tenant usage meter (fire-and-forget)
    const usagePeriod = new Date().toISOString().slice(0, 7);
    supabase.rpc('increment_usage', {
      p_tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
      p_period: usagePeriod,
      p_field: 'addresses',
      p_amount: 1,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Address generated successfully',
      data: {
        id: newAddress.id,
        kivro_code: newAddress.kivro_code,
        display_address: newAddress.display_address,
        region: newAddress.region,
        district: newAddress.district,
        landmark: newAddress.landmark,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
        is_active: newAddress.is_active,
        share_token: newAddress.share_token,
        short_code: newAddress.short_code,
        created_at: newAddress.created_at,
        created_by: newAddress.created_by,
        user_id: newAddress.user_id,
        // Legacy fields for backward compatibility
        address: newAddress.kivro_code,
        full_address: newAddress.display_address,
        coordinates: {
          latitude: newAddress.latitude,
          longitude: newAddress.longitude
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Address generation failed',
      message: error.message
    });
  }
});

// POST /api/addresses/generate-with-location - Generate address with precise location and notifications
router.post('/generate-with-location', validateLocationBasedGeneration, async (req, res) => {
  try {
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Verify user authentication
    const user = await verifyUserToken(req.headers.authorization);
    
    // PAYMENT DISABLED: Allow all users to create unlimited addresses for now
    // TODO: Re-enable payment system when ready
    /*
    // Check if user has active subscription or allow free tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .single();


    // Allow free tier: users can create 1 address without subscription
    if (!subscription || subscription.status !== 'active') {
      // Check how many addresses user already has
      const { data: existingAddresses, count } = await supabase
        .from('kivro_addresses')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);


      if (count >= 1) {
        return res.status(403).json({
          error: 'Subscription required',
          message: 'You have reached the free tier limit of 1 address. Please upgrade to create more addresses.',
          upgrade_required: true
        });
      }
    }

    // Check if subscription is expired (only if they have a subscription)
    if (subscription && subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.',
        renewal_required: true
      });
    }
    */

    const { 
      full_name,
      phone_number, 
      latitude, 
      longitude, 
      email, 
      landmark_description,
      what3words 
    } = req.body;
    const normalizedPhoneLoc = normalizePhone(phone_number);


    // Detect country from phone number
    const detectedCountry = detectCountryFromPhone(phone_number);

    let addressData;
    let newAddress;
    let what3wordsAddress = what3words;

    // If What3Words not provided, try to get it from coordinates (optional)
    if (!what3wordsAddress && latitude && longitude) {
      try {
        const w3wResult = await what3wordsService.convertFromCoordinates(latitude, longitude);
        if (w3wResult && w3wResult.success) {
          what3wordsAddress = w3wResult.words;
        }
      } catch (error) {
        // Don't fail the entire request if What3Words fails
      }
    }

    // Check if this is a Somali phone number
    if (somaliAddressService.isSomaliPhoneNumber(phone_number)) {
      
      try {
        // Use geocoding service for accurate reverse geocoding FIRST
        let geocodedLocation = null;
        try {
          geocodedLocation = await geocodingService.reverseGeocode(
            parseFloat(latitude),
            parseFloat(longitude),
            { preferredProvider: 'auto', useCache: true }
          );
        } catch (geocodeError) {
        }

        // Generate Somali-style address with GEOCODED location data passed directly
        addressData = await somaliAddressService.generateSomaliAddress(
          phone_number, 
          full_name, 
          landmark_description,
          geocodedLocation  // Pass geocoded location to use GPS data instead of phone prefix guessing
        );
        
        // Ensure GPS coordinates and landmark are set correctly
        addressData.latitude = parseFloat(latitude);
        addressData.longitude = parseFloat(longitude);
        addressData.landmark = landmark_description || addressData.landmark;
        addressData.what3words_address = what3wordsAddress;


        // Create address record with location data
        const { data: somaliAddress, error: addressError } = await supabase
          .from('kivro_addresses')
          .insert({
            user_id: user.id,
            tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
            kivro_code: addressData.kivro_code,
            display_address: `${full_name}, ${normalizedPhoneLoc} ${addressData.display_address}`,
            region: addressData.region,
            district: addressData.district,
            landmark: addressData.landmark,
            federal_member_state: addressData.federal_member_state,
            postal_code: addressData.postal_code,
            country: addressData.country,
            phone_number: addressData.phone_number,
            latitude: addressData.latitude,
            longitude: addressData.longitude,
            what3words_address: addressData.what3words_address,
            is_active: true,
            is_verified: true, // Auto-verify addresses with location data
            verification_method: 'gps',
            geo_confidence: 95, // Very high confidence for GPS-based addresses
            share_token: generateShareToken(),
            created_at: new Date().toISOString(),
            created_by: user.id
          })
          .select()
          .single();

        if (addressError) {
          throw addressError;
        }

        newAddress = somaliAddress;

      } catch (error) {
        throw new Error('Failed to generate Somali address: ' + error.message);
      }

    } else {
      // Generate address for any other African country with location
      const countryName = detectedCountry ? detectedCountry.name : 'Africa';
      const countryCode = detectedCountry ? detectedCountry.code : '';
      
      // Use geocoding service for accurate reverse geocoding
      let geocodedLocation = null;
      try {
        geocodedLocation = await geocodingService.reverseGeocode(
          parseFloat(latitude),
          parseFloat(longitude),
          { preferredProvider: 'auto', useCache: true }
        );
      } catch (geocodeError) {
      }
      
      // Generate standard Kivro address with location
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const kivroCode = `KV-LOC-${randomSuffix}-${timestamp.toString().slice(-4)}`;

      // Use geocoded region or fallback
      const region = geocodedLocation?.region || landmark_description || 'Central';

      // Create address record with location for any African country
      const { data: africanAddress, error: addressError } = await supabase
        .from('kivro_addresses')
        .insert({
          user_id: user.id,
          tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
          kivro_code: kivroCode,
          display_address: `${full_name}, ${normalizedPhoneLoc} ${kivroCode}, ${geocodedLocation?.city || region}, ${geocodedLocation?.region || region}, ${geocodedLocation?.country || countryName}`,
          region: geocodedLocation?.region || region,
          district: geocodedLocation?.city || geocodedLocation?.district || region,
          landmark: landmark_description || 'Location-based Address',
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          what3words_address: what3wordsAddress,
          country: countryName,
          phone_country_code: countryCode,
          phone_number: phone_number,
          is_active: true,
          is_verified: true, // Auto-verify addresses with location data
          verification_method: 'gps',
          geo_confidence: 95, // Very high confidence for GPS-based addresses
          share_token: generateShareToken(),
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (addressError) {
        throw addressError;
      }

      newAddress = africanAddress;
    }


    // Send notifications (email and SMS) - non-critical
    let notificationResults = {
      email: { success: false },
      sms: { success: false }
    };
    
    try {
      notificationResults = await notificationService.sendAddressNotifications(
        email,
        phone_number,
        {
          ...newAddress,
          full_name: full_name
        }
      );
    } catch (notifError) {
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Address generated successfully with location',
      data: {
        ...newAddress,
        what3words: what3wordsAddress,
        notifications: notificationResults
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Address generation failed',
      message: error.message
    });
  }
});

// GET /api/addresses - Get user's addresses
router.get('/', async (req, res) => {
  try {
    const user = await verifyUserToken(req.headers.authorization);

    const { data: addresses, error } = await supabase
      .from('kivro_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: addresses || []
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch addresses',
      message: error.message
    });
  }
});

// GET /api/addresses/:id - Get specific address
router.get('/:id', async (req, res) => {
  try {
    const user = await verifyUserToken(req.headers.authorization);
    const { id } = req.params;

    // Try cache first
    if (cache) {
      const cached = await cache.getAddress(id);
      if (cached) return res.json({ success: true, data: cached, cached: true });
    }

    const { data: address, error } = await supabase
      .from('kivro_addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Store in cache
    if (cache) cache.setAddress(id, address);

    res.json({ success: true, data: address });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch address',
      message: error.message
    });
  }
});

// PUT /api/addresses/:id/deactivate - Deactivate address
router.put('/:id/deactivate', async (req, res) => {
  try {
    const user = await verifyUserToken(req.headers.authorization);
    const { id } = req.params;

    const { data: address, error } = await supabase
      .from('kivro_addresses')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!address) {
      return res.status(404).json({
        error: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address deactivated successfully',
      data: address
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to deactivate address',
      message: error.message
    });
  }
});

// POST /api/addresses/generate-with-what3words - Generate address with What3Words location
router.post('/generate-with-what3words', [
  body('phone_number').notEmpty().withMessage('Phone number is required').custom(validatePhoneNumberField),
  body('what3words').notEmpty().withMessage('What3Words address is required'),
  body('recipient_name').optional(),
  body('delivery_instructions').optional()
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await verifyUserToken(req.headers.authorization);
    const { phone_number, what3words, recipient_name, delivery_instructions } = req.body;
    const normalizedPhoneW3W = normalizePhone(phone_number);


    // Validate What3Words format
    if (!what3wordsService.isValidFormat(what3words)) {
      return res.status(400).json({
        error: 'Invalid What3Words format',
        message: 'Please provide a valid 3-word address (e.g., filled.count.soap)'
      });
    }

    // Convert What3Words to coordinates
    const locationResult = await what3wordsService.convertToCoordinates(what3words);
    
    if (!locationResult.success) {
      return res.status(400).json({
        error: 'Invalid What3Words address',
        message: locationResult.message || 'Could not find the specified 3-word address'
      });
    }

    // Use geocoding service for accurate reverse geocoding
    let geocodedLocation = null;
    try {
      geocodedLocation = await geocodingService.reverseGeocode(
        locationResult.coordinates.lat,
        locationResult.coordinates.lng,
        { preferredProvider: 'auto', useCache: true }
      );
    } catch (geocodeError) {
    }

    // Use ONLY geocoded data from APIs - no database predictions
    if (!geocodedLocation) {
      throw new Error('Geocoding failed. Unable to determine accurate location from coordinates.');
    }
    
    const w3wSmartCoords = {
      latitude: geocodedLocation.latitude,
      longitude: geocodedLocation.longitude,
      region: geocodedLocation.region || locationResult.nearestPlace,
      city: geocodedLocation.city || locationResult.nearestPlace,
      country: geocodedLocation.country || locationResult.country,
      confidence: geocodedLocation.confidence || 0.98,
      source: geocodedLocation.source || 'what3words'
    };


    // Generate Kivro address
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const kivroCode = `KV-W3W-${randomSuffix}-${timestamp.toString().slice(-4)}`;

    // Create address record with What3Words integration and smart region detection
    const { data: newAddress, error: addressError } = await supabase
      .from('kivro_addresses')
      .insert({
        user_id: user.id,
        tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
        kivro_code: kivroCode,
        display_address: `${recipient_name || 'KIVRO User'}, ${normalizedPhoneW3W} ${kivroCode} - ${what3words}, ${w3wSmartCoords.city}, ${w3wSmartCoords.region}, ${w3wSmartCoords.country}`,
        region: w3wSmartCoords.region,
        district: w3wSmartCoords.city,
        landmark: `Precision Code: ${what3words}`,
        latitude: w3wSmartCoords.latitude || locationResult.coordinates.lat,
        longitude: w3wSmartCoords.longitude || locationResult.coordinates.lng,
        country: w3wSmartCoords.country,
        what3words_address: what3words,
        recipient_name: recipient_name,
        delivery_instructions: delivery_instructions,
        is_active: true,
        is_verified: true, // Auto-verify What3Words addresses
        verification_method: 'what3words',
        geo_confidence: 98, // Highest confidence for What3Words precision
        share_token: generateShareToken(),
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (addressError) {
      throw addressError;
    }


    res.status(201).json({
      success: true,
      message: 'Address with What3Words generated successfully',
      data: {
        ...newAddress,
        location: {
          coordinates: locationResult.coordinates,
          country: locationResult.country,
          nearestPlace: locationResult.nearestPlace,
          square: locationResult.square
        },
        delivery: {
          estimatedTime: locationResult.country === 'SO' ? '1-3 days' : '5-10 days',
          deliveryFee: locationResult.country === 'SO' ? 'KES 50' : 'KES 200',
          zone: locationResult.country === 'SO' ? 'Somalia' : 'International'
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Address generation failed',
      message: error.message
    });
  }
});

// GET /api/addresses/what3words/:words - Get address details by What3Words
router.get('/what3words/:words', async (req, res) => {
  try {
    const { words } = req.params;

    // Validate What3Words format
    if (!what3wordsService.isValidFormat(words)) {
      return res.status(400).json({
        error: 'Invalid What3Words format',
        message: 'Please provide a valid 3-word address'
      });
    }

    // Find address by What3Words
    const { data: address, error } = await supabase
      .from('kivro_addresses')
      .select('*')
      .eq('what3words_address', words)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    if (!address) {
      return res.status(404).json({
        error: 'Address not found',
        message: 'No active Kivro address found for this What3Words location'
      });
    }

    res.json({
      success: true,
      data: address
    });

  } catch (error) {
    res.status(500).json({
      error: 'Address lookup failed',
      message: error.message
    });
  }
});

// POST /api/addresses/share-via-email - Share address via email
router.post('/share-via-email', [
  body('address_id').notEmpty().withMessage('Address ID is required'),
  body('recipient_email').isEmail().withMessage('Valid recipient email is required'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await verifyUserToken(req.headers.authorization);
    const { address_id, recipient_email, message } = req.body;

    // Get the address to share
    const { data: address, error: addressError } = await supabase
      .from('kivro_addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (addressError || !address) {
      return res.status(404).json({
        error: 'Address not found',
        message: 'The specified address was not found or you do not have permission to share it'
      });
    }

    // Send email with address details
    const emailResult = await notificationService.sendKivroAddressEmail(
      recipient_email,
      address,
      message
    );

    if (emailResult.success) {
      // Log the share activity
      await supabase
        .from('address_shares')
        .insert({
          address_id: address.id,
          shared_by: user.id,
          recipient_email: recipient_email,
          share_method: 'email',
          message: message,
          created_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: 'Address shared successfully via email',
        data: {
          recipient: recipient_email,
          address: address.display_address,
          shared_at: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to send email',
        message: emailResult.error || 'Email delivery failed'
      });
    }

  } catch (error) {
    res.status(500).json({
      error: 'Address sharing failed',
      message: error.message
    });
  }
});

// POST /api/addresses/share-via-sms - Share address via SMS
router.post('/share-via-sms', [
  body('address_id').notEmpty().withMessage('Address ID is required'),
  body('recipient_phone').notEmpty().withMessage('Recipient phone number is required'),
  body('message').optional().isLength({ max: 300 }).withMessage('Message must be less than 300 characters')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await verifyUserToken(req.headers.authorization);
    const { address_id, recipient_phone, message } = req.body;

    // Get the address to share
    const { data: address, error: addressError } = await supabase
      .from('kivro_addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (addressError || !address) {
      return res.status(404).json({
        error: 'Address not found',
        message: 'The specified address was not found or you do not have permission to share it'
      });
    }

    // Format SMS message
    const customMessage = message ? `${message}\n\n` : '';
    const smsText = `${customMessage}📍 KIVRO Address: ${address.display_address}\n\nUse this address for deliveries and mail. Get your own at kivro.africa`;

    // Send SMS
    const smsResult = await enqueueSMS(req.body.phone_number, smsText).then(() => ({ success: true })).catch(async () => {
      // Fallback: try direct send
      return sendSMS(req.body.phone_number, smsText).then(() => ({ success: true })).catch(() => ({ success: false }));
    });
    const _unused = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notificationService.formatPhoneForSMS(recipient_phone)
    };

    if (smsResult) {
      // Log the share activity
      await supabase
        .from('address_shares')
        .insert({
          address_id: address.id,
          shared_by: user.id,
          recipient_phone: recipient_phone,
          share_method: 'sms',
          message: message,
          created_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: 'Address shared successfully via SMS',
        data: {
          recipient: recipient_phone,
          address: address.display_address,
          shared_at: new Date().toISOString(),
          sms_id: smsResult.sid
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to send SMS',
        message: 'SMS service not configured or failed to send'
      });
    }

  } catch (error) {
    res.status(500).json({
      error: 'SMS sharing failed',
      message: error.message
    });
  }
});

// POST /api/addresses/generate-company - Generate company Kivro address
router.post('/generate-company', validateCompanyAddressGeneration, async (req, res) => {
  try {
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Verify user authentication
    const user = await verifyUserToken(req.headers.authorization);
    
    // PAYMENT DISABLED: Allow all users to create company addresses for now
    // TODO: Re-enable payment system when ready
    /*
    // Check if user has active subscription (company addresses require subscription)
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, expires_at')
      .eq('user_id', user.id)
      .single();


    if (!subscription || subscription.status !== 'active') {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Company addresses require an active subscription. Please upgrade your account.',
        upgrade_required: true
      });
    }

    // Check if subscription is expired
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return res.status(403).json({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.',
        renewal_required: true
      });
    }

    // Check if user already has a company address
    const { data: existingCompanyAddress, count } = await supabase
      .from('kivro_addresses')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('address_type', 'company');


    // Limit to 1 company address per user (can be adjusted)
    if (count >= 1) {
      return res.status(403).json({
        error: 'Company address limit reached',
        message: 'You already have a company address. Please contact support to add more.',
        limit_reached: true
      });
    }
    */

    const { 
      phone_number, 
      company_name,
      company_registration_number,
      company_email,
      company_phone,
      region = 'mogadishu',
      landmark,
      company_logo_base64,
      company_logo_type,
      latitude,
      longitude
    } = req.body;


    // REQUIRE GPS coordinates for accurate company address generation
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'GPS coordinates required',
        message: 'Please provide GPS coordinates for accurate company address generation.'
      });
    }

    // Use geocoding service for ALL company addresses - no fallbacks
    let geocodedLocation = null;
    try {
      geocodedLocation = await geocodingService.reverseGeocode(
        parseFloat(latitude),
        parseFloat(longitude),
        { preferredProvider: 'auto', useCache: true }
      );
    } catch (geocodeError) {
      return res.status(500).json({
        error: 'Geocoding failed',
        message: 'Unable to determine location from GPS coordinates. Please try again.'
      });
    }

    if (!geocodedLocation) {
      return res.status(500).json({
        error: 'Location detection failed',
        message: 'Could not determine your company location. Please ensure GPS is enabled.'
      });
    }

    const detectedRegion = geocodedLocation.region;
    const detectedCity = geocodedLocation.city || geocodedLocation.district;
    const detectedCountry = geocodedLocation.country;
    const coordinateConfidence = geocodedLocation.confidence;


    // Also get traditional country detection for compatibility
    const phoneCountryInfo = detectCountryFromPhone(phone_number);

    // Handle company logo upload if present
    let company_logo_url = null;
    if (company_logo_base64) {
      try {
        // Extract base64 data
        const base64Data = company_logo_base64.split(',')[1] || company_logo_base64;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const fileExt = company_logo_type?.split('/')[1] || 'png';
        const fileName = `${user.id}/${company_name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, buffer, {
            contentType: company_logo_type || 'image/png',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);

        company_logo_url = urlData.publicUrl;
      } catch (logoError) {
        // Don't fail the entire request if logo upload fails
      }
    }

    let addressData;
    let newAddress;

    // Check if this is a Somali phone number
    if (somaliAddressService.isSomaliPhoneNumber(phone_number)) {
      
      try {
        // Generate Somali-style company address with GEOCODED location data passed directly
        addressData = await somaliAddressService.generateSomaliAddress(
          phone_number, 
          company_name, 
          landmark,
          geocodedLocation  // Pass geocoded location to use GPS data instead of phone prefix guessing
        );
        
        // Coordinates are already set from geocodedLocation, but ensure they're correct
        addressData.latitude = parseFloat(latitude);
        addressData.longitude = parseFloat(longitude);
        

        // Create company address record with Somali format
        const { data: somaliAddress, error: addressError } = await supabase
          .from('kivro_addresses')
          .insert({
            user_id: user.id,
            tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
            address_type: 'company',
            kivro_code: addressData.kivro_code,
            display_address: addressData.display_address,
            region: addressData.region,
            district: addressData.district,
            landmark: addressData.landmark,
            latitude: addressData.latitude,
            longitude: addressData.longitude,
            is_active: addressData.is_active,
            is_verified: latitude && longitude ? true : false, // Only auto-verify if real GPS provided
            verification_method: latitude && longitude ? 'gps' : null,
            geo_confidence: latitude && longitude ? 95 : 50, // High confidence for GPS, low for fallback
            is_business: true,
            company_name: company_name,
            company_registration_number: company_registration_number || null,
            company_email: company_email || null,
            company_phone: company_phone || phone_number,
            company_logo_url: company_logo_url,
            share_token: generateShareToken(),
            created_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (addressError) {
          throw addressError;
        }

        newAddress = somaliAddress;

      } catch (error) {
        throw new Error('Failed to generate Somali company address: ' + error.message);
      }

    } else {
      // Generate company address for any other African country using smart detection
      const countryName = detectedCountry || (phoneCountryInfo ? phoneCountryInfo.name : 'Africa');
      const countryCode = phoneCountryInfo ? phoneCountryInfo.code : '';
      
      // Generate company Kivro address with "BIZ" prefix
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const kivroCode = `KV-BIZ-${randomSuffix}-${timestamp.toString().slice(-4)}`;

      // Use smart coordinates and region detection for business

      // Create company address record for any African country with smart region detection
      const { data: companyAddress, error: addressError } = await supabase
        .from('kivro_addresses')
        .insert({
          user_id: user.id,
          tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
          address_type: 'company',
          kivro_code: kivroCode,
          display_address: `${company_name}, ${kivroCode}, ${detectedRegion}, ${detectedCity}, ${countryName}`,
          region: detectedRegion,
          district: `${detectedCity} Business District`,
          landmark: landmark || 'Business Address',
          latitude: finalLatitude,
          longitude: finalLongitude,
          country: countryName,
          phone_country_code: countryCode,
          phone_number: phone_number,
          is_active: true,
          is_verified: coordinateSource === 'gps' ? true : false, // Auto-verify only GPS coordinates
          verification_method: coordinateSource === 'gps' ? 'gps' : null,
          geo_confidence: Math.round(coordinateConfidence * 100), // Convert to percentage
          is_business: true,
          company_name: company_name,
          company_registration_number: company_registration_number || null,
          company_email: company_email || null,
          company_phone: company_phone || phone_number,
          company_logo_url: company_logo_url,
          share_token: generateShareToken(),
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (addressError) {
        throw new Error('Failed to create company address: ' + addressError.message);
      }

      newAddress = companyAddress;
    }


    res.status(201).json({
      success: true,
      message: 'Company address generated successfully',
      address: newAddress
    });

  } catch (error) {
    res.status(500).json({
      error: 'Address generation failed',
      message: error.message
    });
  }
});

// PATCH /api/addresses/:id/update - Update address with house number and image
router.patch('/:id/update', async (req, res) => {
  try {
    
    const user = await verifyUserToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Valid authentication required'
      });
    }

    const { id } = req.params;
    const { house_number } = req.body;

    // Verify the address belongs to the user
    const { data: existingAddress, error: fetchError } = await supabase
      .from('kivro_addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Address not found or you do not have permission to update it'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (house_number !== undefined && house_number !== null) {
      updateData.house_number = house_number.trim();
    }

    // Handle file upload if present
    let house_image_url = null;
    if (req.body.house_image_base64) {
      try {
        // Extract base64 data
        const base64Data = req.body.house_image_base64.split(',')[1] || req.body.house_image_base64;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const fileExt = req.body.house_image_type?.split('/')[1] || 'jpg';
        const fileName = `${user.id}/${id}_${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('house-images')
          .upload(fileName, buffer, {
            contentType: req.body.house_image_type || 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          throw new Error('Failed to upload image: ' + uploadError.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('house-images')
          .getPublicUrl(fileName);

        house_image_url = urlData.publicUrl;
        updateData.house_image_url = house_image_url;

      } catch (imageError) {
        return res.status(400).json({
          success: false,
          error: 'Image upload failed',
          message: imageError.message
        });
      }
    }

    // Update the address
    const { data: updatedAddress, error: updateError } = await supabase
      .from('kivro_addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update address: ' + updateError.message);
    }


    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: error.message
    });
  }
});

// POST /api/addresses/:id/location - Verify/update address location
router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, location_note, method } = req.body;


    // Verify user authentication
    const user = await verifyUserToken(req.headers.authorization);

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates required',
        message: 'Latitude and longitude are required'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        message: 'Coordinates are out of valid range'
      });
    }

    // Verify ownership
    const { data: address, error: fetchError } = await supabase
      .from('kivro_addresses')
      .select('id, user_id, phone_number, short_code, share_token')
      .eq('id', id)
      .single();

    if (fetchError || !address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    if (address.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You do not have permission to update this address'
      });
    }

    // Calculate geo_confidence based on method
    let geoConfidence = 50; // default
    if (method === 'gps') geoConfidence = 90;
    else if (method === 'manual') geoConfidence = 70;
    else if (method === 'telco') geoConfidence = 60;

    // Update address with location data
    const { data: updatedAddress, error: updateError } = await supabase
      .from('kivro_addresses')
      .update({
        latitude: latitude,
        longitude: longitude,
        location_note: location_note || null,
        verification_method: method || 'manual',
        geo_confidence: geoConfidence,
        is_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }


    res.json({
      success: true,
      message: 'Location verified successfully',
      is_verified: true,
      short_code: updatedAddress.short_code,
      share_token: updatedAddress.share_token,
      latitude: parseFloat(updatedAddress.latitude),
      longitude: parseFloat(updatedAddress.longitude),
      geo_confidence: updatedAddress.geo_confidence
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message
    });
  }
});

// GET /api/addresses/public/:shareToken - Public endpoint for drivers/couriers
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;

    // Fetch address by share_token (no authentication required)
    const { data: address, error } = await supabase
      .from('kivro_addresses')
      .select(`
        id,
        kivro_code,
        display_address,
        latitude,
        longitude,
        short_code,
        region,
        district,
        landmark,
        location_note,
        house_number,
        house_image_url,
        company_logo_url,
        is_verified,
        is_active,
        is_business,
        share_token
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (error || !address) {
      
      // Debug: Check if ANY address exists with this token (ignoring is_active)
      const { data: debugAddress, error: debugError } = await supabase
        .from('kivro_addresses')
        .select('id, kivro_code, share_token, is_active, latitude, longitude')
        .eq('share_token', shareToken)
        .single();
      
      
      return res.status(404).json({
        success: false,
        error: 'Address not found',
        message: 'This address is not available or has been removed'
      });
    }

    // Only return addresses with valid coordinates
    if (!address.latitude || !address.longitude) {
      return res.status(404).json({
        success: false,
        error: 'Location not available',
        message: 'This address does not have location data'
      });
    }


    // Return only public-safe information
    res.json({
      id: address.id,
      kivro_code: address.kivro_code,
      display_address: address.display_address,
      latitude: parseFloat(address.latitude),
      longitude: parseFloat(address.longitude),
      short_code: address.short_code,
      region: address.region,
      district: address.district,
      landmark: address.landmark,
      location_note: address.location_note,
      house_number: address.house_number,
      house_image_url: address.house_image_url,
      building_image_url: address.building_image_url,
      company_logo_url: address.company_logo_url,
      is_verified: address.is_verified,
      is_business: address.is_business || false
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to retrieve address'
    });
  }
});

// GET /api/addresses/public/code/:shortCode - Resolve by short code
router.get('/public/code/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Fetch address by short_code
    const { data: address, error } = await supabase
      .from('kivro_addresses')
      .select('id, share_token, latitude, longitude, short_code')
      .eq('short_code', shortCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !address) {
      return res.status(404).json({
        success: false,
        error: 'Short code not found',
        message: 'This KIVRO code does not exist'
      });
    }


    // Return minimal data for redirect
    res.json({
      id: address.id,
      share_token: address.share_token,
      latitude: parseFloat(address.latitude),
      longitude: parseFloat(address.longitude),
      short_code: address.short_code,
      share_url: `${process.env.FRONTEND_URL || 'https://kivro.africa'}/kv/${address.share_token}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to resolve short code'
    });
  }
});

// POST /api/addresses/validate-pin - Validate KIVRO address as PIN (for e-commerce integration)
router.post('/validate-pin', async (req, res) => {
  try {
    const { kivro_pin } = req.body;
    
    if (!kivro_pin || typeof kivro_pin !== 'string') {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'KIVRO PIN is required',
        message: 'Please provide a valid KIVRO address or short code'
      });
    }

    const pinValue = kivro_pin.trim().toUpperCase();

    // Try to find by short_code first (most common for PIN usage)
    let query = supabase
      .from('kivro_addresses')
      .select(`
        id,
        kivro_code,
        display_address,
        latitude,
        longitude,
        short_code,
        region,
        district,
        landmark,
        location_note,
        house_number,
        phone_number,
        is_verified,
        is_business,
        country,
        country_code
      `)
      .eq('is_active', true);

    // Search by short_code or kivro_code
    const { data: addresses, error } = await query.or(`short_code.eq.${pinValue},kivro_code.ilike.%${pinValue}%`);

    if (error) {
      return res.status(500).json({
        success: false,
        valid: false,
        error: 'Validation failed',
        message: 'Failed to validate KIVRO PIN'
      });
    }

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'PIN not found',
        message: 'This KIVRO address does not exist. Please check and try again.'
      });
    }

    // Get the first match (short_code match will be prioritized)
    const address = addresses[0];

    // Validate coordinates exist
    if (!address.latitude || !address.longitude) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Location unavailable',
        message: 'This KIVRO address does not have valid location data'
      });
    }


    // Return delivery-ready format
    res.json({
      success: true,
      valid: true,
      message: 'KIVRO address validated successfully',
      address: {
        // Core identifiers
        short_code: address.short_code,
        kivro_code: address.kivro_code,
        
        // Delivery information
        display_address: address.display_address,
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude),
        
        // Location details
        region: address.region,
        district: address.district,
        landmark: address.landmark,
        location_note: address.location_note,
        house_number: address.house_number,
        
        // Contact (masked for privacy)
        phone_number: address.phone_number ? `***${address.phone_number.slice(-4)}` : null,
        
        // Metadata
        is_verified: address.is_verified,
        is_business: address.is_business || false,
        country: address.country,
        country_code: address.country_code,
        
        // Navigation URLs for delivery drivers
        google_maps_url: `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`,
        apple_maps_url: `http://maps.apple.com/?ll=${address.latitude},${address.longitude}&q=${encodeURIComponent(address.display_address)}`,
        waze_url: `https://waze.com/ul?ll=${address.latitude},${address.longitude}&navigate=yes`
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Server error',
      message: 'Failed to validate KIVRO PIN'
    });
  }
});

// GET /api/addresses/pin/:pinCode - Quick PIN lookup (alternative endpoint)
router.get('/pin/:pinCode', async (req, res) => {
  try {
    const { pinCode } = req.params;
    const pinValue = pinCode.trim().toUpperCase();
    

    // Find by short_code
    const { data: address, error } = await supabase
      .from('kivro_addresses')
      .select(`
        id,
        kivro_code,
        display_address,
        latitude,
        longitude,
        short_code,
        region,
        district,
        landmark,
        location_note,
        house_number,
        is_verified,
        is_business,
        country
      `)
      .eq('short_code', pinValue)
      .eq('is_active', true)
      .single();

    if (error || !address) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'PIN not found',
        message: 'Invalid KIVRO PIN'
      });
    }

    if (!address.latitude || !address.longitude) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Location unavailable',
        message: 'This address has no location data'
      });
    }


    res.json({
      success: true,
      valid: true,
      address: {
        short_code: address.short_code,
        kivro_code: address.kivro_code,
        display_address: address.display_address,
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude),
        region: address.region,
        district: address.district,
        landmark: address.landmark,
        location_note: address.location_note,
        house_number: address.house_number,
        is_verified: address.is_verified,
        is_business: address.is_business || false,
        country: address.country,
        google_maps_url: `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Server error',
      message: 'Failed to lookup PIN'
    });
  }
});

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', async (req, res) => {
  try {
    
    // Verify user authentication
    const user = await verifyUserToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to delete addresses'
      });
    }

    const addressId = req.params.id;
    
    // First check if the address belongs to the user
    const { data: address, error: fetchError } = await supabase
      .from('kivro_addresses')
      .select('id, user_id, kivro_code')
      .eq('id', addressId)
      .single();

    if (fetchError || !address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
        message: 'The address you are trying to delete does not exist'
      });
    }

    // Check if the address belongs to the authenticated user
    if (address.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own addresses'
      });
    }

    // Delete the address
    const { error: deleteError } = await supabase
      .from('kivro_addresses')
      .delete()
      .eq('id', addressId);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: 'Delete failed',
        message: 'Failed to delete the address. Please try again.'
      });
    }


    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        id: addressId,
        kivro_code: address.kivro_code
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while deleting the address'
    });
  }
});

module.exports = router;
