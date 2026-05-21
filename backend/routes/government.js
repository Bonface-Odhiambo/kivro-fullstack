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

// GET /api/government/departments - Get all departments
router.get('/departments', async (req, res) => {
  try {
    const { data: departments, error } = await supabase
      .from('government_departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch departments',
      message: error.message
    });
  }
});

// GET /api/government/services - Get all services
router.get('/services', async (req, res) => {
  try {
    const { department_id } = req.query;

    let query = supabase
      .from('government_services')
      .select(`
        *,
        department:department_id(name, code)
      `)
      .eq('is_active', true)
      .order('service_name');

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    const { data: services, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: services
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch services',
      message: error.message
    });
  }
});

// GET /api/government/applications - Get all applications (admin only)
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = supabase
      .from('government_applications')
      .select(`
        *,
        service:service_id(service_name, service_id, department:department_id(name)),
        user:user_id(email)
      `)
      .order('submitted_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data: applications, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: applications
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
});

// GET /api/government/applications/:id - Get single application
router.get('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabase
      .from('government_applications')
      .select(`
        *,
        service:service_id(*),
        user:user_id(email),
        history:application_status_history(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch application',
      message: error.message
    });
  }
});

// POST /api/government/applications - Create new application
router.post('/applications', [
  body('service_id').notEmpty(),
  body('applicant_name').notEmpty(),
  body('applicant_phone').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { data: application, error } = await supabase
      .from('government_applications')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to create application',
      message: error.message
    });
  }
});

// PUT /api/government/applications/:id - Update application
router.put('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      ...(req.body.status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(req.body.status && { reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
    };

    const { data: application, error } = await supabase
      .from('government_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update application',
      message: error.message
    });
  }
});

// PUT /api/government/applications/:id/status - Update application status
router.put('/applications/:id/status', [
  requireAdmin,
  body('status').isIn(['pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const { data: application, error } = await supabase
      .from('government_applications')
      .update({ 
        status,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Add to history
    await supabase
      .from('application_status_history')
      .insert({
        application_id: id,
        status,
        notes,
        changed_by: req.user.id
      });

    res.json({
      success: true,
      message: 'Application status updated',
      data: application
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to update application status',
      message: error.message
    });
  }
});

// GET /api/government/stats - Get government services statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { data: applications } = await supabase
      .from('government_applications')
      .select('status, priority, submitted_at');

    const { data: services } = await supabase
      .from('government_services')
      .select('id')
      .eq('is_active', true);

    const { data: departments } = await supabase
      .from('government_departments')
      .select('id')
      .eq('is_active', true);

    const stats = {
      totalApplications: applications?.length || 0,
      pending: applications?.filter(a => a.status === 'pending').length || 0,
      underReview: applications?.filter(a => a.status === 'under_review').length || 0,
      approved: applications?.filter(a => a.status === 'approved').length || 0,
      completed: applications?.filter(a => a.status === 'completed').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0,
      totalServices: services?.length || 0,
      totalDepartments: departments?.length || 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// GET /api/government/departments/stats - Get department statistics
router.get('/departments/stats', requireAdmin, async (req, res) => {
  try {
    const { data: departments } = await supabase
      .from('government_departments')
      .select(`
        id,
        name,
        services:government_services(id),
        applications:government_applications(id, status)
      `)
      .eq('is_active', true);

    const departmentStats = departments?.map(dept => ({
      name: dept.name,
      services: dept.services?.length || 0,
      activeApplications: dept.applications?.filter(a => 
        ['pending', 'under_review'].includes(a.status)
      ).length || 0
    })) || [];

    res.json({
      success: true,
      data: departmentStats
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch department statistics',
      message: error.message
    });
  }
});

module.exports = router;
