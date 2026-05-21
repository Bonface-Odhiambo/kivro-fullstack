const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// GET /api/admin/metrics - Get key admin metrics
router.get('/admin/metrics', async (req, res) => {
  try {

    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch metrics from admin_metrics_summary view
    const { data: metricsData, error: metricsError } = await supabase
      .from('admin_metrics_summary')
      .select('*');

    if (metricsError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics from database',
        details: metricsError.message
      });
    }

    // Transform the data into the expected format
    const metrics = {};
    metricsData.forEach(metric => {
      switch (metric.metric_name) {
        case 'stripe_revenue':
          metrics.stripeRevenue = parseFloat(metric.metric_value) || 0;
          break;
        case 'android_installs':
          metrics.androidInstalls = parseInt(metric.metric_value) || 0;
          break;
        case 'ios_installs':
          metrics.iosInstalls = parseInt(metric.metric_value) || 0;
          break;
        case 'play_store_reviews':
          metrics.playStoreReviews = parseInt(metric.metric_value) || 0;
          break;
        case 'total_users':
          metrics.totalUsers = parseInt(metric.metric_value) || 0;
          break;
      }
    });


    res.json({
      success: true,
      data: metrics,
      ...metrics,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin metrics',
      details: error.message
    });
  }
});

// POST /api/admin/metrics/update - Update specific metric (admin only)
router.post('/admin/metrics/update', async (req, res) => {
  try {

    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { metricType, metricValue, additionalData } = req.body;

    if (!metricType || metricValue === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['metricType', 'metricValue']
      });
    }

    // Validate metric type
    const validMetricTypes = ['android_installs', 'ios_installs', 'play_store_reviews', 'app_store_reviews'];
    if (!validMetricTypes.includes(metricType)) {
      return res.status(400).json({
        error: 'Invalid metric type',
        validTypes: validMetricTypes
      });
    }

    // Insert new metric record
    const { data: insertedMetric, error: insertError } = await supabase
      .from('app_metrics')
      .insert({
        metric_type: metricType,
        metric_value: parseInt(metricValue),
        additional_data: additionalData || null
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update metric',
        details: insertError.message
      });
    }


    res.json({
      success: true,
      message: 'Metric updated successfully',
      data: insertedMetric
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update metric',
      details: error.message
    });
  }
});

// POST /api/admin/metrics/stripe-transaction - Record Stripe transaction (webhook endpoint)
router.post('/admin/metrics/stripe-transaction', async (req, res) => {
  try {

    const {
      stripePaymentIntentId,
      stripeChargeId,
      userId,
      amountCents,
      currency,
      status,
      description,
      metadata,
      stripeCreatedAt
    } = req.body;

    if (!stripePaymentIntentId || !amountCents || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['stripePaymentIntentId', 'amountCents', 'status']
      });
    }

    // Insert Stripe transaction record
    const { data: transaction, error: insertError } = await supabase
      .from('stripe_transactions')
      .insert({
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_charge_id: stripeChargeId || null,
        user_id: userId || null,
        amount_cents: parseInt(amountCents),
        currency: currency || 'USD',
        status: status,
        description: description || null,
        metadata: metadata || null,
        stripe_created_at: stripeCreatedAt || new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to record transaction',
        details: insertError.message
      });
    }


    res.json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record transaction',
      details: error.message
    });
  }
});

// GET /api/admin/metrics/history/:metricType - Get metric history
router.get('/admin/metrics/history/:metricType', async (req, res) => {
  try {

    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { metricType } = req.params;
    const { limit = 30 } = req.query;

    // Fetch metric history
    const { data: history, error: historyError } = await supabase
      .from('app_metrics')
      .select('*')
      .eq('metric_type', metricType)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (historyError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch metric history',
        details: historyError.message
      });
    }


    res.json({
      success: true,
      data: history,
      metricType,
      count: history.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metric history',
      details: error.message
    });
  }
});

module.exports = router;
