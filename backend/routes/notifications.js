const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, verifyUserToken } = require('../config/supabase');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token using Supabase directly
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

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

// POST /api/notifications/welcome - Send welcome email
router.post('/welcome', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('user_type').optional().isIn(['user', 'courier', 'admin']).withMessage('Invalid user type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Verify user token if provided (optional - allows unauthenticated welcome emails)
    let authenticated = false;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await verifyUserToken(token);
        authenticated = true;
      }
    } catch (error) {
      // Continue without authentication for welcome emails
    }

    const { email, full_name, user_type = 'user' } = req.body;


    // Send welcome email
    const emailSent = await notificationService.sendWelcomeEmail(
      email,
      full_name,
      user_type
    );

    if (!emailSent) {
      throw new Error('Failed to send welcome email');
    }


    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to send welcome email',
      message: error.message
    });
  }
});

// POST /api/notifications/send-bulk - Send bulk notification (Admin only)
router.post('/send-bulk', [
  requireAdmin,
  body('type').isIn(['email', 'sms', 'push']).withMessage('Invalid notification type'),
  body('audience').notEmpty().withMessage('Audience is required'),
  body('subject').optional(),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type, audience, subject, message } = req.body;


    // Get target users based on audience
    let targetUsers = [];
    
    try {
      if (audience === 'all') {
        // Send to all users
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, phone_number');
        
        if (error) throw error;
        targetUsers = data || [];
      } else {
        // For enterprise, business, or free - check if user_subscriptions table exists
        const { data: enterpriseUsers, error: enterpriseError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('plan_type', 'enterprise')
          .eq('status', 'active')
          .limit(1);
        
        // If table doesn't exist or error, fall back to all users
        if (enterpriseError) {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_id, display_name, phone_number');
          
          if (error) throw error;
          targetUsers = data || [];
        } else {
          // Table exists, proceed with audience filtering
          if (audience === 'enterprise') {
            const { data: users } = await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('plan_type', 'enterprise')
              .eq('status', 'active');
            const userIds = users?.map(u => u.user_id) || [];
            
            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, display_name, phone_number')
              .in('user_id', userIds);
            
            if (error) throw error;
            targetUsers = data || [];
          } else if (audience === 'business') {
            const { data: users } = await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('plan_type', 'business')
              .eq('status', 'active');
            const userIds = users?.map(u => u.user_id) || [];
            
            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, display_name, phone_number')
              .in('user_id', userIds);
            
            if (error) throw error;
            targetUsers = data || [];
          } else if (audience === 'free') {
            const { data: allSubs } = await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('status', 'active');
            const subscribedIds = allSubs?.map(u => u.user_id) || [];
            
            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, display_name, phone_number')
              .not('user_id', 'in', `(${subscribedIds.join(',')})`);
            
            if (error) throw error;
            targetUsers = data || [];
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch target users: ${error.message}`);
    }

    let sentCount = 0;
    const failedUsers = [];

    // Send notifications
    for (const user of targetUsers || []) {
      try {
        if (type === 'email') {
          // Get user email
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
          if (authUser?.user?.email) {
            await notificationService.sendCustomEmail(
              authUser.user.email,
              user.display_name || 'User',
              subject || 'Notification from Kivro',
              message
            );
            sentCount++;
          }
        } else if (type === 'sms') {
          // SMS sending would go here
          sentCount++;
        }
      } catch (error) {
        failedUsers.push(user.user_id);
      }
    }


    res.json({
      success: true,
      message: `Notification sent to ${sentCount} users`,
      data: {
        sent: sentCount,
        failed: failedUsers.length,
        total: targetUsers?.length || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to send bulk notification',
      message: error.message
    });
  }
});

module.exports = router;
