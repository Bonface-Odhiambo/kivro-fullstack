const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyUserToken } = require('../config/supabase');
const otpService = require('../services/otpService');

const router = express.Router();

/**
 * OTP Routes for KIVRO
 * Status: DISABLED by default
 * Enable via: UPDATE system_settings SET setting_value = 'true' WHERE setting_key = 'otp_enabled'
 */

// Validation middleware
const validateOTPRequest = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(['phone_verification', 'login', 'transaction', 'address_verification', 'password_reset'])
    .withMessage('Invalid purpose')
];

const validateOTPVerification = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('otp_code')
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be 6 digits'),
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
];

// GET /api/otp/settings - Get OTP configuration (public)
router.get('/settings', async (req, res) => {
  try {
    const settings = await otpService.getOTPSettings();
    
    if (!settings) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch OTP settings'
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// GET /api/otp/status - Check if OTP is enabled
router.get('/status', async (req, res) => {
  try {
    const isEnabled = await otpService.isOTPEnabled();
    
    res.json({
      success: true,
      enabled: isEnabled,
      message: isEnabled ? 'OTP system is enabled' : 'OTP system is disabled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// POST /api/otp/generate - Generate and send OTP
router.post('/generate', validateOTPRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone_number, purpose } = req.body;
    const userId = req.user?.id || null; // Optional user ID
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');


    const result = await otpService.generateOTP(
      userId,
      phone_number,
      purpose,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// POST /api/otp/verify - Verify OTP code
router.post('/verify', validateOTPVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone_number, otp_code, purpose } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');


    const result = await otpService.verifyOTP(
      phone_number,
      otp_code,
      purpose,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// POST /api/otp/resend - Resend OTP
router.post('/resend', validateOTPRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phone_number, purpose } = req.body;
    const userId = req.user?.id || null;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');


    const result = await otpService.resendOTP(
      userId,
      phone_number,
      purpose,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// GET /api/otp/required/:action - Check if OTP is required for an action
router.get('/required/:action', async (req, res) => {
  try {
    const { action } = req.params;
    
    const isRequired = await otpService.isOTPRequired(action);
    
    res.json({
      success: true,
      action,
      required: isRequired,
      message: isRequired 
        ? `OTP is required for ${action}` 
        : `OTP is not required for ${action}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// POST /api/otp/send-login-otp - Send OTP for login (with user lookup)
router.post('/send-login-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone_number').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, phone_number } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');


    // Check if OTP is required for login
    const isRequired = await otpService.isOTPRequired('login');
    if (!isRequired) {
      return res.json({
        success: true,
        otpRequired: false,
        message: 'OTP not required for login'
      });
    }

    // Generate and send OTP
    const result = await otpService.generateOTP(
      null, // userId not available yet
      phone_number,
      'login',
      ipAddress,
      userAgent
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router;
