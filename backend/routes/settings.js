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

// GET /api/settings - Get all settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category, setting_key');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: settings, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
});

// GET /api/settings/:key - Get single setting
router.get('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    const { data: setting, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: setting
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch setting',
      message: error.message
    });
  }
});

// PUT /api/settings/:key - Update setting
router.put('/:key', [
  requireAdmin,
  body('setting_value').notEmpty()
], async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value } = req.body;

    const { data: setting, error } = await supabase
      .from('system_settings')
      .update({
        setting_value,
        updated_by: req.user.id
      })
      .eq('setting_key', key)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update setting',
      message: error.message
    });
  }
});

// GET /api/settings/health/metrics - Get system health metrics
router.get('/health/metrics', requireAdmin, async (req, res) => {
  try {
    const { data: metrics, error } = await supabase
      .from('system_health_metrics')
      .select('*')
      .order('component_name');

    if (error) throw error;

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch health metrics',
      message: error.message
    });
  }
});

// POST /api/settings/health/metrics - Update health metric
router.post('/health/metrics', requireAdmin, async (req, res) => {
  try {
    const { component_name, metric_name, metric_value, status } = req.body;

    const { data: metric, error } = await supabase
      .from('system_health_metrics')
      .upsert({
        component_name,
        metric_name,
        metric_value,
        status,
        last_check_at: new Date().toISOString()
      }, {
        onConflict: 'component_name,metric_name'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Health metric updated',
      data: metric
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update health metric',
      message: error.message
    });
  }
});

// GET /api/settings/logs - Get system logs
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;

    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (level) {
      query = query.eq('log_level', level);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: logs
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
});

// POST /api/settings/logs - Create system log
router.post('/logs', [
  body('log_level').isIn(['info', 'warning', 'error', 'critical']),
  body('message').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { data: log, error } = await supabase
      .from('system_logs')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Log created',
      data: log
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to create log',
      message: error.message
    });
  }
});

// GET /api/settings/templates - Get notification templates
router.get('/templates', requireAdmin, async (req, res) => {
  try {
    const { template_type } = req.query;

    let query = supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');

    if (template_type) {
      query = query.eq('template_type', template_type);
    }

    const { data: templates, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

// PUT /api/settings/templates/:id - Update notification template
router.put('/templates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: template, error } = await supabase
      .from('notification_templates')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update template',
      message: error.message
    });
  }
});

module.exports = router;
