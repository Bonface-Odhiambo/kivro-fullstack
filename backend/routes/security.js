const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
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

    if (!profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed', message: error.message });
  }
};

// GET /api/security/alerts - Get all security alerts
router.get('/alerts', requireAdmin, async (req, res) => {
  try {
    const { status, severity } = req.query;

    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('detected_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data: alerts, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch security alerts',
      message: error.message
    });
  }
});

// POST /api/security/alerts - Create security alert
router.post('/alerts', [
  requireAdmin,
  body('type').notEmpty(),
  body('severity').isIn(['low', 'medium', 'high', 'critical']),
  body('title').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { data: alert, error } = await supabase
      .from('security_alerts')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Security alert created',
      data: alert
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to create security alert',
      message: error.message
    });
  }
});

// PUT /api/security/alerts/:id - Update security alert
router.put('/alerts/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      ...(req.body.status === 'resolved' && { 
        resolved_at: new Date().toISOString(),
        resolved_by: req.user.id 
      })
    };

    const { data: alert, error } = await supabase
      .from('security_alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Security alert updated',
      data: alert
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update security alert',
      message: error.message
    });
  }
});

// GET /api/security/blocked-ips - Get blocked IPs
router.get('/blocked-ips', requireAdmin, async (req, res) => {
  try {
    const { data: blockedIPs, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .order('blocked_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: blockedIPs
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch blocked IPs',
      message: error.message
    });
  }
});

// POST /api/security/blocked-ips - Block an IP address
router.post('/blocked-ips', [
  requireAdmin,
  body('ip_address').isIP(),
  body('reason').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { data: blockedIP, error } = await supabase
      .from('blocked_ips')
      .insert({
        ...req.body,
        blocked_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'IP address blocked successfully',
      data: blockedIP
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to block IP address',
      message: error.message
    });
  }
});

// DELETE /api/security/blocked-ips/:id - Unblock an IP
router.delete('/blocked-ips/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('blocked_ips')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'IP address unblocked successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to unblock IP address',
      message: error.message
    });
  }
});

// GET /api/security/system-status - Get system security status
router.get('/system-status', requireAdmin, async (req, res) => {
  try {
    const { data: status, error } = await supabase
      .from('system_security_status')
      .select('*')
      .order('component_name');

    if (error) throw error;

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch system security status',
      message: error.message
    });
  }
});

// GET /api/security/audit-logs - Get audit logs
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
});

// GET /api/security/stats - Get security statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { data: alerts } = await supabase.from('security_alerts').select('status, severity');
    const { data: blockedIPs } = await supabase.from('blocked_ips').select('id');

    const stats = {
      totalAlerts: alerts?.length || 0,
      activeAlerts: alerts?.filter(a => a.status === 'active').length || 0,
      criticalAlerts: alerts?.filter(a => a.severity === 'critical').length || 0,
      blockedIPs: blockedIPs?.length || 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch security statistics',
      message: error.message
    });
  }
});

module.exports = router;
