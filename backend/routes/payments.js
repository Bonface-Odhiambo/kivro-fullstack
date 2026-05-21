const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, verifyUserToken } = require('../config/supabase');
const { initiatePayment, verifyPayment } = require('../services/paymentGateway');

const router = express.Router();

// Validation middleware
const validatePayment = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+254|254|0)[17]\d{8}$/)
    .withMessage('Invalid Kenyan phone number format'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('account_reference')
    .notEmpty()
    .withMessage('Account reference is required')
    .isLength({ max: 50 })
    .withMessage('Account reference too long'),
  body('transaction_desc')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Transaction description too long'),
  body('country_code')
    .optional()
    .isLength({ min: 2, max: 3 })
    .withMessage('country_code must be a 2-3 character ISO code'),
  body('provider')
    .optional()
    .isIn(['mpesa', 'flutterwave', 'paystack'])
    .withMessage('provider must be mpesa, flutterwave, or paystack'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
];

// POST /api/payments/initiate - Initiate M-Pesa payment
router.post('/initiate', validatePayment, async (req, res) => {
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
    
    const { phone_number, amount, account_reference, transaction_desc } = req.body;

    // Update user profile with phone number
    await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        phone_number: phone_number,
        updated_at: new Date().toISOString()
      });

    // Generate callback URL
    const callbackURL = `${req.protocol}://${req.get('host')}/api/payments/callback`;

    // Route to correct gateway (M-Pesa, Flutterwave, or Paystack) based on country/provider
    const gatewayResult = await initiatePayment({
      phone: phone_number,
      email: req.body.email || '',
      amount,
      currency: req.body.currency || 'KES',
      reference: account_reference,
      description: transaction_desc,
      name: req.body.name || '',
      countryCode: req.body.country_code || 'KEN',
      provider: req.body.provider || null,
    });

    const mpesaResponse = {
      MerchantRequestID: gatewayResult.transaction_id || account_reference,
      CheckoutRequestID: gatewayResult.reference || account_reference,
      ResponseCode: '0',
      ResponseDescription: `Payment initiated via ${gatewayResult.provider}`,
      CustomerMessage: `Payment request sent`,
      provider: gatewayResult.provider,
      authorization_url: gatewayResult.authorization_url || null,
    };

    // Store payment request in database
    const { error: dbError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: user.id,
        phone_number: phone_number,
        amount: amount,
        account_reference: account_reference,
        transaction_desc: transaction_desc,
        merchant_request_id: mpesaResponse.MerchantRequestID,
        checkout_request_id: mpesaResponse.CheckoutRequestID,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      return res.status(500).json({
        error: 'Failed to record payment request',
        details: dbError.message
      });
    }


    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        CheckoutRequestID: mpesaResponse.CheckoutRequestID,
        MerchantRequestID: mpesaResponse.MerchantRequestID,
        ResponseCode: mpesaResponse.ResponseCode,
        ResponseDescription: mpesaResponse.ResponseDescription,
        CustomerMessage: mpesaResponse.CustomerMessage
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Payment initiation failed',
      message: error.message
    });
  }
});

// POST /api/payments/callback - M-Pesa callback endpoint
router.post('/callback', async (req, res) => {
  try {

    const callbackData = req.body;
    let MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc;

    // Handle real M-Pesa callback format
    if (callbackData.Body && callbackData.Body.stkCallback) {
      const { stkCallback } = callbackData.Body;
      MerchantRequestID = stkCallback.MerchantRequestID;
      CheckoutRequestID = stkCallback.CheckoutRequestID;
      ResultCode = stkCallback.ResultCode;
      ResultDesc = stkCallback.ResultDesc;
    }
    // Handle development simulation format
    else if (callbackData.checkout_request_id) {
      MerchantRequestID = callbackData.merchant_request_id;
      CheckoutRequestID = callbackData.checkout_request_id;
      ResultCode = callbackData.result_code || 0;
      ResultDesc = callbackData.result_desc || 'Success';
    }
    else {
      return res.status(400).json({ error: 'Invalid callback structure' });
    }

    // Update payment status
    const paymentStatus = ResultCode === 0 ? 'completed' : 'failed';
    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({
        status: paymentStatus,
        result_code: ResultCode,
        result_desc: ResultDesc,
        callback_data: callbackData,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', CheckoutRequestID);

    if (updateError) {
    }

    // If payment successful, activate subscription
    if (ResultCode === 0) {
      
      // Get user from payment request
      const { data: paymentRequest } = await supabase
        .from('payment_requests')
        .select('user_id, amount')
        .eq('checkout_request_id', CheckoutRequestID)
        .single();

      if (paymentRequest) {
        // Activate user subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: paymentRequest.user_id,
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) {
        } else {
        }
      }
    }

    res.status(200).json({ message: 'Callback processed successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// POST /api/payments/simulate - Simulate successful payment (development only)
router.post('/simulate', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Simulation not allowed in production' });
    }

    const user = await verifyUserToken(req.headers.authorization);
    const { checkout_request_id } = req.body;

    if (!checkout_request_id) {
      return res.status(400).json({ error: 'checkout_request_id is required' });
    }


    // Simulate callback
    const callbackPayload = {
      merchant_request_id: checkout_request_id.replace('CHECKOUT_', ''),
      checkout_request_id: checkout_request_id,
      result_code: 0,
      result_desc: 'Success (Simulated)'
    };

    // Process the simulated callback internally
    await processCallback(callbackPayload);

    res.status(200).json({
      success: true,
      message: 'Payment simulation completed successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Payment simulation failed',
      message: error.message
    });
  }
});

// Helper function to process callback (used by both real and simulated callbacks)
async function processCallback(callbackData) {
  const { checkout_request_id, result_code, result_desc } = callbackData;
  
  // Update payment status
  const paymentStatus = result_code === 0 ? 'completed' : 'failed';
  await supabase
    .from('payment_requests')
    .update({
      status: paymentStatus,
      result_code: result_code,
      result_desc: result_desc,
      updated_at: new Date().toISOString()
    })
    .eq('checkout_request_id', checkout_request_id);

  // Activate subscription if successful
  if (result_code === 0) {
    const { data: paymentRequest } = await supabase
      .from('payment_requests')
      .select('user_id')
      .eq('checkout_request_id', checkout_request_id)
      .single();

    if (paymentRequest) {
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: paymentRequest.user_id,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  }
}

// GET /api/payments/status/:checkoutRequestId - Check payment status
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const user = await verifyUserToken(req.headers.authorization);
    const { checkoutRequestId } = req.params;

    const { data: payment, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to check payment status',
      message: error.message
    });
  }
});

module.exports = router;
