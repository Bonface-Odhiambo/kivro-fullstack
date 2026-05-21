const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Middleware to check admin or courier access
const requireAdminOrCourier = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'courier'].includes(profile.user_type)) {
      return res.status(403).json({ error: 'Admin or courier access required' });
    }

    req.user = user;
    req.userType = profile.user_type;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed', message: error.message });
  }
};

// GET /api/packages - Get all packages (admin only)
router.get('/', requireAdminOrCourier, async (req, res) => {
  try {

    const { data: packages, error } = await supabase
      .from('packages')
      .eq('tenant_id', req.tenant?.id || '00000000-0000-0000-0000-000000000001')
      .select(`
        *,
        sender:sender_user_id(id, email),
        recipient:recipient_user_id(id, email),
        courier:courier_id(id, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;


    res.json({
      success: true,
      data: packages
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch packages',
      message: error.message
    });
  }
});

// GET /api/packages/:id - Get single package
router.get('/:id', requireAdminOrCourier, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: package, error } = await supabase
      .from('packages')
      .eq('tenant_id', req.tenant?.id || '00000000-0000-0000-0000-000000000001')
      .select(`
        *,
        sender:sender_user_id(id, email),
        recipient:recipient_user_id(id, email),
        courier:courier_id(id, email),
        tracking:package_tracking(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: package
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch package',
      message: error.message
    });
  }
});

// POST /api/packages - Create new package
router.post('/', [
  requireAdminOrCourier,
  body('sender_name').notEmpty().withMessage('Sender name is required'),
  body('recipient_name').notEmpty().withMessage('Recipient name is required'),
  body('recipient_address').notEmpty().withMessage('Recipient address is required'),
  body('qr_code').notEmpty().withMessage('QR code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const packageData = {
      ...req.body,
      status: req.body.status || 'pending',
      tenant_id: req.tenant?.id || '00000000-0000-0000-0000-000000000001',
    };

    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert(packageData)
      .select()
      .single();

    if (error) throw error;


    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: newPackage
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to create package',
      message: error.message
    });
  }
});

// PUT /api/packages/:id - Update package
router.put('/:id', requireAdminOrCourier, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;


    res.json({
      success: true,
      message: 'Package updated successfully',
      data: updatedPackage
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update package',
      message: error.message
    });
  }
});

// PUT /api/packages/:id/status - Update package status
router.put('/:id/status', [
  requireAdminOrCourier,
  body('status').isIn(['pending', 'processing', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, location } = req.body;

    // Update package status
    const { data: updatedPackage, error: updateError } = await supabase
      .from('packages')
      .update({ 
        status,
        ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add tracking entry
    const { error: trackingError } = await supabase
      .from('package_tracking')
      .insert({
        package_id: id,
        status,
        notes,
        location,
        updated_by: req.user.id
      });

    if (trackingError) console.error('⚠️ Tracking insert error:', trackingError);


    res.json({
      success: true,
      message: 'Package status updated successfully',
      data: updatedPackage
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update package status',
      message: error.message
    });
  }
});

// GET /api/packages/stats - Get package statistics
router.get('/stats/summary', requireAdminOrCourier, async (req, res) => {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .eq('tenant_id', req.tenant?.id || '00000000-0000-0000-0000-000000000001')
      .select('status, created_at');

    if (error) throw error;

    const stats = {
      total: packages.length,
      pending: packages.filter(p => p.status === 'pending').length,
      processing: packages.filter(p => p.status === 'processing').length,
      in_transit: packages.filter(p => p.status === 'in_transit').length,
      out_for_delivery: packages.filter(p => p.status === 'out_for_delivery').length,
      delivered: packages.filter(p => p.status === 'delivered').length,
      cancelled: packages.filter(p => p.status === 'cancelled').length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch package statistics',
      message: error.message
    });
  }
});

module.exports = router;
